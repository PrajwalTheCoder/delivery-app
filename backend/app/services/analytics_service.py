from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.delivery import Delivery
from app.models.route_plan import RoutePlan
from app.models.route_result import RouteResult
from app.models.route_metric_snapshot import RouteMetricSnapshot
from app.utils.geo import format_distance, format_duration

class AnalyticsService:
    @staticmethod
    def get_summary(db: Session) -> Dict[str, Any]:
        """Calculates authoritative dashboard metrics computed directly from database records."""
        total_deliveries = db.query(Delivery).count()
        pending = db.query(Delivery).filter(Delivery.status == "pending").count()
        planned = db.query(Delivery).filter(Delivery.status == "planned").count()
        in_transit = db.query(Delivery).filter(Delivery.status == "in_transit").count()
        completed = db.query(Delivery).filter(Delivery.status == "delivered").count()
        failed = db.query(Delivery).filter(Delivery.status == "failed").count()
        cancelled = db.query(Delivery).filter(Delivery.status == "cancelled").count()

        total_plans = db.query(RoutePlan).count()
        total_distance = db.query(func.sum(RoutePlan.total_distance_meters)).scalar() or 0.0
        avg_duration = db.query(func.avg(RoutePlan.estimated_duration_seconds)).scalar() or 0.0
        total_distance_saved = db.query(func.sum(RoutePlan.distance_saved_meters)).scalar() or 0.0

        # Calculate historical distance savings percentage across all stored plans
        total_baseline = db.query(func.sum(RoutePlan.baseline_distance_meters)).scalar() or 0.0
        overall_savings_pct = round((total_distance_saved / total_baseline * 100.0), 2) if total_baseline > 0 else 0.0

        # Recent route plans
        recent_plans = db.query(RoutePlan).order_by(RoutePlan.created_at.desc()).limit(5).all()

        # Recent activities (combined from latest deliveries and route plans)
        recent_deliveries = db.query(Delivery).order_by(Delivery.created_at.desc()).limit(5).all()

        activities = []
        for p in recent_plans:
            activities.append({
                "type": "route_plan",
                "title": f"Route Planned: {p.name}",
                "description": f"{len(p.stops)} stops | {round(p.total_distance_meters/1000, 2)} km | Saved {round(p.distance_saved_meters/1000, 2)} km ({p.savings_percentage}%)",
                "timestamp": p.created_at.isoformat() if p.created_at else None
            })
        for d in recent_deliveries:
            activities.append({
                "type": "delivery",
                "title": f"Order: {d.customer_label}",
                "description": f"{d.address} ({d.priority.upper()} priority, {d.status})",
                "timestamp": d.created_at.isoformat() if d.created_at else None
            })

        activities.sort(key=lambda x: x["timestamp"] or "", reverse=True)

        return {
            "total_deliveries": total_deliveries,
            "pending_deliveries": pending,
            "planned_deliveries": planned,
            "in_transit_deliveries": in_transit,
            "completed_deliveries": completed,
            "failed_deliveries": failed,
            "cancelled_deliveries": cancelled,
            "total_route_plans": total_plans,
            "total_planned_distance": format_distance(total_distance),
            "average_duration": format_duration(avg_duration),
            "total_distance_saved": format_distance(total_distance_saved),
            "overall_savings_percent": overall_savings_pct,
            "recent_plans": [p.to_dict() for p in recent_plans],
            "recent_activities": activities[:8]
        }

    @staticmethod
    def get_route_analytics(db: Session) -> Dict[str, Any]:
        """Provides chart-ready aggregates and tabular equivalents for Analytics page."""
        # 1. Deliveries by Status
        status_counts = db.query(Delivery.status, func.count(Delivery.id)).group_by(Delivery.status).all()
        deliveries_by_status = [{"name": s.capitalize().replace("_", " "), "count": c} for s, c in status_counts]

        # 2. Deliveries by Priority
        priority_counts = db.query(Delivery.priority, func.count(Delivery.id)).group_by(Delivery.priority).all()
        deliveries_by_priority = [{"name": p.capitalize(), "count": c} for p, c in priority_counts]

        # 3. Distance & Savings by saved route (last 8 routes)
        routes = db.query(RoutePlan).order_by(RoutePlan.created_at.asc()).limit(8).all()
        distance_by_route = [
            {
                "name": r.name[:18] + ("..." if len(r.name) > 18 else ""),
                "distance_km": round(r.total_distance_meters / 1000.0, 2),
                "baseline_km": round(r.baseline_distance_meters / 1000.0, 2),
                "saved_km": round(r.distance_saved_meters / 1000.0, 2),
                "savings_percent": r.savings_percentage,
                "duration_min": round(r.estimated_duration_seconds / 60.0, 1),
                "stops": len(r.stops)
            }
            for r in routes
        ]

        # 4. Algorithm performance comparison from RouteMetricSnapshot & RouteResult
        snapshots = db.query(RouteMetricSnapshot).order_by(RouteMetricSnapshot.created_at.desc()).limit(10).all()
        algorithm_performance = []
        for s in snapshots:
            algorithm_performance.append({
                "algorithm": s.algorithm.replace("_", " ").title(),
                "baseline_km": round(s.baseline_distance_meters / 1000.0, 2),
                "optimized_km": round(s.optimized_distance_meters / 1000.0, 2),
                "saved_km": round(s.distance_saved_meters / 1000.0, 2),
                "savings_percent": s.savings_percentage,
                "duration_min": round(s.optimized_duration_seconds / 60.0, 1),
                "execution_time_ms": round(s.execution_time_ms, 2)
            })

        return {
            "deliveries_by_status": deliveries_by_status,
            "deliveries_by_priority": deliveries_by_priority,
            "distance_by_route": distance_by_route,
            "algorithm_performance": algorithm_performance,
            "total_records_analyzed": {
                "deliveries": db.query(Delivery).count(),
                "route_plans": db.query(RoutePlan).count(),
                "route_snapshots": db.query(RouteMetricSnapshot).count()
            }
        }
