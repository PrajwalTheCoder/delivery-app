from flask import Blueprint, jsonify
from sqlalchemy import text
from app.database.db import get_db
from app.config import Config

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    db_status = "connected"
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    return jsonify({
        "status": "healthy",
        "service": "RouteWise AI Backend API",
        "version": "1.0.0",
        "database": db_status,
        "config": {
            "osrm_endpoint": Config.OSRM_BASE_URL,
            "nominatim_endpoint": Config.NOMINATIM_BASE_URL,
            "max_exact_stops": Config.MAX_EXACT_STOPS
        }
    }), 200
