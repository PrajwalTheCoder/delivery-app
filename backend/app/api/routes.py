import csv
import io
from flask import Blueprint, request, jsonify, Response
from datetime import datetime, timezone
from app.database.db import get_db
from app.services.route_planner_service import RoutePlannerService
from app.models.route_plan import RoutePlan
from app.models.route_stop import RouteStop
from app.models.delivery import Delivery
from app.models.delivery_status_event import DeliveryStatusEvent

routes_bp = Blueprint("routes", __name__)

@routes_bp.route("/routes", methods=["GET"])
def list_route_plans():
    db = next(get_db())
    plans = RoutePlannerService.get_all_plans(db)
    return jsonify({
        "count": len(plans),
        "plans": plans
    }), 200

@routes_bp.route("/routes", methods=["POST"])
@routes_bp.route("/routes/optimize", methods=["POST"])
def optimize_route():
    data = request.get_json() or {}
    db = next(get_db())

    try:
        result = RoutePlannerService.optimize_and_plan(db, data)
        return jsonify(result), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Route optimization failed: {str(e)}"}), 500

@routes_bp.route("/routes/preview", methods=["POST"])
def preview_route():
    data = request.get_json() or {}
    try:
        preview = RoutePlannerService.preview_route(data)
        return jsonify(preview), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Route preview failed: {str(e)}"}), 500

@routes_bp.route("/routes/<plan_id>", methods=["GET"])
def get_route_plan(plan_id):
    db = next(get_db())
    plan = RoutePlannerService.get_plan_by_id(db, plan_id)
    if not plan:
        return jsonify({"error": "Route plan not found."}), 404
    return jsonify({"plan": plan}), 200

@routes_bp.route("/routes/<plan_id>", methods=["PATCH"])
def update_plan_status(plan_id):
    data = request.get_json() or {}
    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "Status is required."}), 400

    db = next(get_db())
    plan = db.query(RoutePlan).filter(RoutePlan.id == plan_id).first()
    if not plan:
        return jsonify({"error": "Route plan not found."}), 404

    plan.status = new_status
    db.commit()
    return jsonify({"message": "Route plan status updated.", "plan": plan.to_dict()}), 200

@routes_bp.route("/routes/<plan_id>", methods=["DELETE"])
def delete_route_plan(plan_id):
    db = next(get_db())
    success = RoutePlannerService.delete_plan(db, plan_id)
    if not success:
        return jsonify({"error": "Route plan not found."}), 404
    return jsonify({"message": "Route plan deleted successfully."}), 200

@routes_bp.route("/routes/<plan_id>/duplicate", methods=["POST"])
def duplicate_route_plan(plan_id):
    db = next(get_db())
    duplicated = RoutePlannerService.duplicate_plan(db, plan_id)
    if not duplicated:
        return jsonify({"error": "Route plan not found."}), 404
    return jsonify({
        "message": "Route plan duplicated successfully.",
        "plan": duplicated
    }), 201

@routes_bp.route("/routes/<plan_id>/start", methods=["POST"])
def start_route(plan_id):
    """Transitions a planned route to 'in_transit' status and marks first stop active."""
    db = next(get_db())
    plan = db.query(RoutePlan).filter(RoutePlan.id == plan_id).first()
    if not plan:
        return jsonify({"error": "Route plan not found."}), 404

    plan.status = "in_transit"
    for stop in plan.stops:
        if stop.status == "pending":
            stop.status = "in_transit"
            if stop.delivery and stop.delivery.status == "planned":
                prev_st = stop.delivery.status
                stop.delivery.status = "in_transit"
                event = DeliveryStatusEvent(
                    delivery_id=stop.delivery.id,
                    route_plan_id=plan.id,
                    previous_status=prev_st,
                    new_status="in_transit",
                    reason="Route dispatched for execution"
                )
                db.add(event)

    db.commit()
    return jsonify({
        "message": "Route started and marked in transit.",
        "plan": plan.to_dict()
    }), 200

@routes_bp.route("/routes/<plan_id>/stops/<stop_id>/status", methods=["POST"])
def update_stop_status(plan_id, stop_id):
    """
    Updates stop execution status (delivered or failed).
    Records failure reason if failed, updates delivery record and status event log.
    """
    data = request.get_json() or {}
    new_status = data.get("status", "delivered") # "delivered" or "failed"
    reason = data.get("reason", "")

    db = next(get_db())
    stop = db.query(RouteStop).filter(
        RouteStop.id == stop_id,
        RouteStop.route_plan_id == plan_id
    ).first()

    if not stop:
        # Fallback query if stop_id was actually delivery_id
        stop = db.query(RouteStop).filter(
            RouteStop.delivery_id == stop_id,
            RouteStop.route_plan_id == plan_id
        ).first()

    if not stop:
        return jsonify({"error": "Stop not found on this route plan."}), 404

    now = datetime.now(timezone.utc)
    stop.status = new_status
    if new_status == "delivered":
        stop.completed_at = now
        stop.failure_reason = None
    elif new_status == "failed":
        stop.failure_reason = reason or "Customer unavailable"

    if stop.delivery:
        prev_st = stop.delivery.status
        stop.delivery.status = new_status
        if new_status == "delivered":
            stop.delivery.completed_at = now
        event = DeliveryStatusEvent(
            delivery_id=stop.delivery.id,
            route_plan_id=plan_id,
            previous_status=prev_st,
            new_status=new_status,
            reason=reason or f"Marked {new_status} by delivery driver"
        )
        db.add(event)

    # Check if all stops in plan are completed (delivered or failed)
    all_stops = db.query(RouteStop).filter(RouteStop.route_plan_id == plan_id).all()
    all_done = all(s.status in ["delivered", "failed"] for s in all_stops)
    if all_done:
        plan = db.query(RoutePlan).filter(RoutePlan.id == plan_id).first()
        if plan:
            plan.status = "completed"

    db.commit()
    return jsonify({
        "message": f"Stop updated to {new_status}.",
        "stop": stop.to_dict()
    }), 200

@routes_bp.route("/routes/<plan_id>/stop-complete", methods=["POST"])
def mark_stop_complete_legacy(plan_id):
    """Backward compatibility endpoint for stop-complete."""
    data = request.get_json() or {}
    stop_id = data.get("stop_id") or data.get("delivery_id")
    return update_stop_status(plan_id, stop_id)

@routes_bp.route("/routes/<plan_id>/export", methods=["GET"])
def export_route_csv(plan_id):
    """Exports route plan summary as downloadable CSV."""
    db = next(get_db())
    plan = db.query(RoutePlan).filter(RoutePlan.id == plan_id).first()
    if not plan:
        return jsonify({"error": "Route plan not found."}), 404

    format_type = request.args.get("format", "csv").lower()
    if format_type == "json":
        return jsonify(plan.to_dict()), 200

    output = io.StringIO()
    writer = csv.writer(output)

    # Route Header Details
    writer.writerow(["RouteWise AI — Optimized Delivery Manifest"])
    writer.writerow(["Route ID", plan.id])
    writer.writerow(["Route Name", plan.name])
    writer.writerow(["Created At", plan.created_at.isoformat() if plan.created_at else ""])
    writer.writerow(["Depot / Origin", plan.start_address])
    writer.writerow(["Destination Policy", plan.destination_policy])
    writer.writerow(["Algorithm", plan.algorithm])
    writer.writerow(["Total Road Distance (km)", round(plan.total_distance_meters / 1000.0, 2)])
    writer.writerow(["Estimated Duration (min)", round(plan.estimated_duration_seconds / 60.0, 1)])
    writer.writerow(["Distance Saved (km)", round(plan.distance_saved_meters / 1000.0, 2)])
    writer.writerow(["Savings Percentage", f"{plan.savings_percentage}%"])
    writer.writerow([])

    # Stop Columns
    writer.writerow([
        "Stop Order", "Customer Label", "Address", "Latitude", "Longitude",
        "Priority", "Package Weight (kg)", "Time Window", "Leg Distance (km)",
        "Leg Duration (min)", "Status"
    ])

    for stop in plan.stops:
        d = stop.delivery
        writer.writerow([
            stop.stop_order,
            d.customer_label if d else "Stop",
            d.address if d else "",
            d.latitude if d else "",
            d.longitude if d else "",
            d.priority if d else "normal",
            d.package_weight_kg if d else "1.0",
            f"{d.time_window_start or ''} - {d.time_window_end or ''}" if d else "",
            round((stop.leg_distance_meters or 0) / 1000.0, 2),
            round((stop.leg_duration_seconds or 0) / 60.0, 1),
            stop.status
        ])

    csv_data = output.getvalue()
    filename = f"routewise_plan_{plan.id[:8]}.csv"

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
