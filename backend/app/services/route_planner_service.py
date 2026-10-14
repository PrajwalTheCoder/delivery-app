import json
import time
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models.route_plan import RoutePlan
from app.models.route_stop import RouteStop
from app.models.route_result import RouteResult
from app.models.route_metric_snapshot import RouteMetricSnapshot
from app.models.delivery import Delivery
from app.models.delivery_status_event import DeliveryStatusEvent
from app.services.routing_service import routing_service
from app.algorithms.tsp import optimize_delivery_route, calculate_tour_cost
from app.utils.geo import format_distance, format_duration, interpolate_points

class RoutePlannerService:
    @staticmethod
    def preview_route(request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates baseline road distance and duration for the entered stop sequence
        without performing optimization.
        """
        start_loc = request_data.get("start")
        if not start_loc or "latitude" not in start_loc or "longitude" not in start_loc:
            raise ValueError("Start location with valid latitude and longitude is required.")

        stops = request_data.get("stops", [])
        if not stops:
            raise ValueError("At least one delivery stop is required for route preview.")

        destination_policy = request_data.get("destination_policy", "return_to_depot")
        return_to_depot = (destination_policy == "return_to_depot")

        # Ordered coordinates as entered
        coords = [(float(start_loc["latitude"]), float(start_loc["longitude"]))]
        for s in stops:
            coords.append((float(s["latitude"]), float(s["longitude"])))
        if return_to_depot and len(coords) > 1:
            coords.append(coords[0])

        route_res = routing_service.get_route(coords)
        return {
            "success": True,
            "destination_policy": destination_policy,
            "stop_count": len(stops),
            "distance_meters": route_res.get("distance_meters", 0.0),
            "total_distance": format_distance(route_res.get("distance_meters", 0.0)),
            "duration_seconds": route_res.get("duration_seconds", 0.0),
            "estimated_duration": format_duration(route_res.get("duration_seconds", 0.0)),
            "route_geometry": route_res.get("geometry_coordinates", []),
            "is_real_road_geometry": route_res.get("is_real_road_geometry", False),
            "routing_provider": route_res.get("provider", "OSRM Road Network")
        }

    @staticmethod
    def optimize_and_plan(db: Session, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes end-to-end multi-stop route optimization pipeline:
        1. Validates depot (warehouse), stops, coordinates, and destination policy.
        2. Retrieves road-network distance and duration matrix.
        3. Evaluates user's entered baseline sequence.
        4. Runs Nearest Neighbor and 2-Opt local search improvement.
        5. Computes road geometry for the optimized sequence.
        6. Persists route plan, stop ordering, metrics snapshot, and delivery status updates.
        """
        start_loc = request_data.get("start")
        if not start_loc or "latitude" not in start_loc or "longitude" not in start_loc:
            raise ValueError("Start location with valid latitude and longitude is required.")

        stops = request_data.get("stops", [])
        if not stops:
            raise ValueError("At least one delivery stop is required for route planning.")

        objective = request_data.get("objective", "distance")  # "distance" or "duration"
        algorithm = request_data.get("algorithm", "nearest_neighbor_2opt")
        plan_name = request_data.get("name", f"Delivery Route Plan - {time.strftime('%b %d, %H:%M')}")
        destination_policy = request_data.get("destination_policy", "return_to_depot")
        return_to_depot = (destination_policy == "return_to_depot")
        save_plan = request_data.get("save_plan", True)
        enforce_priorities = request_data.get("enforce_priorities", True)

        # Coordinate list: index 0 is depot/start
        all_coords = [(float(start_loc["latitude"]), float(start_loc["longitude"]))]
        priorities = []
        for s in stops:
            all_coords.append((float(s["latitude"]), float(s["longitude"])))
            priorities.append(s.get("priority", "normal"))

        # Step 1: Query travel-cost matrix
        matrix_res = routing_service.get_travel_cost_matrix(all_coords)
        if not matrix_res.get("success"):
            raise RuntimeError("Failed to obtain travel-cost matrix from routing service.")

        cost_matrix = matrix_res["distance_matrix"] if objective == "distance" else matrix_res["duration_matrix"]

        # Step 2: Run TSP optimization algorithm
        tsp_result = optimize_delivery_route(
            cost_matrix=cost_matrix,
            algorithm=algorithm,
            priorities=priorities,
            enforce_priorities=enforce_priorities,
            return_to_depot=return_to_depot
        )

        ordered_indices = tsp_result["ordered_indices"]  # e.g. [0, 2, 1, 3]

        # Step 3: Compute Baseline route metrics from matrix
        original_indices = list(range(len(all_coords)))
        baseline_distance = calculate_tour_cost(original_indices, matrix_res["distance_matrix"], return_to_depot=return_to_depot)
        baseline_duration = calculate_tour_cost(original_indices, matrix_res["duration_matrix"], return_to_depot=return_to_depot)

        # Step 4: Reorder stops and calculate leg metrics
        ordered_stops: List[Dict[str, Any]] = []
        ordered_coords = [(float(start_loc["latitude"]), float(start_loc["longitude"]))]

        cumulative_duration_sec = 0.0
        cumulative_distance_m = 0.0

        for stop_order, tour_idx in enumerate(ordered_indices[1:], start=1):
            original_stop = stops[tour_idx - 1]
            prev_idx = ordered_indices[stop_order - 1]

            leg_dist = matrix_res["distance_matrix"][prev_idx][tour_idx]
            leg_dur = matrix_res["duration_matrix"][prev_idx][tour_idx]
            cumulative_distance_m += leg_dist
            cumulative_duration_sec += leg_dur

            ordered_stop_dict = dict(original_stop)
            ordered_stop_dict["stop_order"] = stop_order
            ordered_stop_dict["leg_distance_meters"] = round(leg_dist, 1)
            ordered_stop_dict["leg_duration_seconds"] = round(leg_dur, 1)
            ordered_stop_dict["estimated_arrival_seconds"] = round(cumulative_duration_sec, 1)
            ordered_stop_dict["formatted_arrival"] = format_duration(cumulative_duration_sec)["text"]
            ordered_stops.append(ordered_stop_dict)

            ordered_coords.append((float(original_stop["latitude"]), float(original_stop["longitude"])))

        # If return to depot is configured, add final leg back to depot
        if return_to_depot and len(ordered_coords) > 1:
            return_leg_dist = matrix_res["distance_matrix"][ordered_indices[-1]][0]
            return_leg_dur = matrix_res["duration_matrix"][ordered_indices[-1]][0]
            cumulative_distance_m += return_leg_dist
            cumulative_duration_sec += return_leg_dur
            ordered_coords.append(ordered_coords[0])

        # Step 5: Road geometry from OSRM
        route_geom_res = routing_service.get_route(ordered_coords)
        full_geometry = route_geom_res.get("geometry_coordinates", [])

        final_distance = route_geom_res.get("distance_meters", cumulative_distance_m)
        final_duration = route_geom_res.get("duration_seconds", cumulative_duration_sec)

        # Exact authoritative savings
        distance_saved = max(0.0, baseline_distance - final_distance)
        duration_saved = max(0.0, baseline_duration - final_duration)
        if baseline_distance > 0.0:
            savings_pct = round((distance_saved / baseline_distance) * 100.0, 2)
        else:
            savings_pct = 0.0

        smooth_simulation_points = interpolate_points(full_geometry, num_points_per_segment=4)

        # Step 6: Persist into database if requested
        plan_id = None
        if save_plan:
            route_plan = RoutePlan(
                name=plan_name,
                start_address=start_loc.get("address", "Central Depot"),
                start_latitude=float(start_loc["latitude"]),
                start_longitude=float(start_loc["longitude"]),
                destination_policy=destination_policy,
                optimization_objective=objective,
                algorithm=algorithm,
                total_distance_meters=final_distance,
                estimated_duration_seconds=final_duration,
                baseline_distance_meters=baseline_distance,
                baseline_duration_seconds=baseline_duration,
                distance_saved_meters=distance_saved,
                duration_saved_seconds=duration_saved,
                savings_percentage=savings_pct,
                original_sequence_json=json.dumps([s.get("customer_label", f"Stop {i+1}") for i, s in enumerate(stops)]),
                optimized_sequence_json=json.dumps([s.get("customer_label", f"Stop {s['stop_order']}") for s in ordered_stops]),
                route_geometry_json=json.dumps(full_geometry),
                status="planned"
            )
            db.add(route_plan)
            db.flush()
            plan_id = route_plan.id

            # Save stops
            for stop in ordered_stops:
                delivery_id = stop.get("id")
                # Look up or create delivery
                if not delivery_id or not db.query(Delivery).filter(Delivery.id == delivery_id).first():
                    new_delivery = Delivery(
                        customer_label=stop.get("customer_label", "Delivery Destination"),
                        address=stop.get("address", "Destination Address"),
                        latitude=float(stop["latitude"]),
                        longitude=float(stop["longitude"]),
                        contact=stop.get("contact"),
                        description=stop.get("description"),
                        priority=stop.get("priority", "normal"),
                        package_weight_kg=float(stop.get("package_weight_kg", 1.0)),
                        time_window_start=stop.get("time_window_start"),
                        time_window_end=stop.get("time_window_end"),
                        notes=stop.get("notes"),
                        status="planned"
                    )
                    db.add(new_delivery)
                    db.flush()
                    delivery_id = new_delivery.id
                else:
                    existing = db.query(Delivery).filter(Delivery.id == delivery_id).first()
                    if existing:
                        prev_status = existing.status
                        existing.status = "planned"
                        status_event = DeliveryStatusEvent(
                            delivery_id=existing.id,
                            route_plan_id=route_plan.id,
                            previous_status=prev_status,
                            new_status="planned",
                            reason="Assigned to route plan"
                        )
                        db.add(status_event)

                route_stop = RouteStop(
                    route_plan_id=route_plan.id,
                    delivery_id=delivery_id,
                    stop_order=stop["stop_order"],
                    leg_distance_meters=stop["leg_distance_meters"],
                    leg_duration_seconds=stop["leg_duration_seconds"],
                    estimated_arrival_seconds=stop["estimated_arrival_seconds"],
                    status="pending"
                )
                db.add(route_stop)

            # Metric Snapshot
            snapshot = RouteMetricSnapshot(
                route_plan_id=route_plan.id,
                algorithm=algorithm,
                baseline_distance_meters=baseline_distance,
                optimized_distance_meters=final_distance,
                distance_saved_meters=distance_saved,
                savings_percentage=savings_pct,
                baseline_duration_seconds=baseline_duration,
                optimized_duration_seconds=final_duration,
                duration_saved_seconds=duration_saved,
                execution_time_ms=tsp_result["execution_time_ms"]
            )
            db.add(snapshot)

            # Legacy result for backward compatibility
            route_result = RouteResult(
                route_plan_id=route_plan.id,
                algorithm=algorithm,
                total_distance_meters=final_distance,
                estimated_duration_seconds=final_duration,
                execution_time_ms=tsp_result["execution_time_ms"],
                result_metadata=json.dumps({
                    "objective": objective,
                    "improvement_percent": savings_pct,
                    "distance_saved_meters": distance_saved,
                    "duration_saved_seconds": duration_saved,
                    "destination_policy": destination_policy,
                    "comparison": tsp_result["comparison"],
                    "is_real_road_geometry": route_geom_res.get("is_real_road_geometry", False),
                    "routing_provider": route_geom_res.get("provider", "OSRM")
                })
            )
            db.add(route_result)
            db.commit()

        return {
            "success": True,
            "route_plan_id": plan_id,
            "plan_name": plan_name,
            "algorithm": algorithm,
            "objective": objective,
            "destination_policy": destination_policy,
            "start": start_loc,
            "ordered_stops": ordered_stops,
            "baseline_distance": format_distance(baseline_distance),
            "baseline_duration": format_duration(baseline_duration),
            "total_distance": format_distance(final_distance),
            "estimated_duration": format_duration(final_duration),
            "distance_saved": format_distance(distance_saved),
            "duration_saved": format_duration(duration_saved),
            "savings_percentage": savings_pct,
            "route_geometry": full_geometry,
            "simulation_coordinates": smooth_simulation_points,
            "is_real_road_geometry": route_geom_res.get("is_real_road_geometry", False),
            "routing_provider": route_geom_res.get("provider", "OSRM"),
            "execution_time_ms": tsp_result["execution_time_ms"],
            "comparison": tsp_result["comparison"],
            "original_sequence": [s.get("customer_label", f"Stop {i+1}") for i, s in enumerate(stops)],
            "optimized_sequence": [s.get("customer_label", f"Stop {s['stop_order']}") for s in ordered_stops],
            "warnings": route_geom_res.get("warnings", [])
        }

    @staticmethod
    def get_all_plans(db: Session) -> List[Dict[str, Any]]:
        plans = db.query(RoutePlan).order_by(RoutePlan.created_at.desc()).all()
        return [p.to_dict() for p in plans]

    @staticmethod
    def get_plan_by_id(db: Session, plan_id: str) -> Optional[Dict[str, Any]]:
        plan = db.query(RoutePlan).filter(RoutePlan.id == plan_id).first()
        if not plan:
            return None
        return plan.to_dict()

    @staticmethod
    def duplicate_plan(db: Session, plan_id: str) -> Optional[Dict[str, Any]]:
        plan = db.query(RoutePlan).filter(RoutePlan.id == plan_id).first()
        if not plan:
            return None

        new_plan = RoutePlan(
            name=f"{plan.name} (Copy)",
            start_address=plan.start_address,
            start_latitude=plan.start_latitude,
            start_longitude=plan.start_longitude,
            destination_policy=plan.destination_policy,
            optimization_objective=plan.optimization_objective,
            algorithm=plan.algorithm,
            total_distance_meters=plan.total_distance_meters,
            estimated_duration_seconds=plan.estimated_duration_seconds,
            baseline_distance_meters=plan.baseline_distance_meters,
            baseline_duration_seconds=plan.baseline_duration_seconds,
            distance_saved_meters=plan.distance_saved_meters,
            duration_saved_seconds=plan.duration_saved_seconds,
            savings_percentage=plan.savings_percentage,
            original_sequence_json=plan.original_sequence_json,
            optimized_sequence_json=plan.optimized_sequence_json,
            route_geometry_json=plan.route_geometry_json,
            status="planned"
        )
        db.add(new_plan)
        db.flush()

        for stop in plan.stops:
            new_stop = RouteStop(
                route_plan_id=new_plan.id,
                delivery_id=stop.delivery_id,
                stop_order=stop.stop_order,
                leg_distance_meters=stop.leg_distance_meters,
                leg_duration_seconds=stop.leg_duration_seconds,
                estimated_arrival_seconds=stop.estimated_arrival_seconds,
                status="pending"
            )
            db.add(new_stop)

        db.commit()
        return new_plan.to_dict()

    @staticmethod
    def delete_plan(db: Session, plan_id: str) -> bool:
        plan = db.query(RoutePlan).filter(RoutePlan.id == plan_id).first()
        if not plan:
            return False
        db.delete(plan)
        db.commit()
        return True
