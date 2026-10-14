from flask import Blueprint, jsonify
from app.database.db import get_db
from app.services.analytics_service import AnalyticsService

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/dashboard", methods=["GET"])
@analytics_bp.route("/analytics/summary", methods=["GET"])
def get_dashboard_summary():
    db = next(get_db())
    data = AnalyticsService.get_summary(db)
    return jsonify(data), 200

@analytics_bp.route("/analytics", methods=["GET"])
@analytics_bp.route("/analytics/routes", methods=["GET"])
def get_route_analytics():
    db = next(get_db())
    data = AnalyticsService.get_route_analytics(db)
    return jsonify(data), 200
