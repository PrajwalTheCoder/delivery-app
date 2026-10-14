from flask import Blueprint, request, jsonify
from app.config import Config
from app.services.routing_service import routing_service

settings_bp = Blueprint("settings", __name__)

@settings_bp.route("/settings", methods=["GET"])
def get_settings():
    return jsonify({
        "osrm_endpoint": Config.OSRM_BASE_URL,
        "nominatim_endpoint": Config.NOMINATIM_BASE_URL,
        "geocoding_provider": Config.GEOCODING_PROVIDER,
        "geocoding_api_key_configured": bool(Config.GEOCODING_API_KEY or Config.GEOAPIFY_API_KEY or Config.LOCATIONIQ_API_KEY),
        "user_agent": Config.USER_AGENT,
        "max_exact_stops": Config.MAX_EXACT_STOPS,
        "fallback_speed_kmh": Config.FALLBACK_SPEED_KMH,
        "active_routing_provider": routing_service.base_url,
        "demo_region": "Navi Mumbai, Maharashtra, India"
    }), 200

@settings_bp.route("/settings", methods=["POST"])
def update_settings():
    data = request.get_json() or {}
    if "osrm_endpoint" in data and data["osrm_endpoint"]:
        Config.OSRM_BASE_URL = data["osrm_endpoint"].strip()
        routing_service.base_url = Config.OSRM_BASE_URL
    if "nominatim_endpoint" in data and data["nominatim_endpoint"]:
        Config.NOMINATIM_BASE_URL = data["nominatim_endpoint"].strip()
    if "geocoding_provider" in data and data["geocoding_provider"]:
        Config.GEOCODING_PROVIDER = data["geocoding_provider"].strip().lower()
    if "geocoding_api_key" in data:
        Config.GEOCODING_API_KEY = data["geocoding_api_key"].strip()
        if Config.GEOCODING_PROVIDER == "geoapify":
            Config.GEOAPIFY_API_KEY = Config.GEOCODING_API_KEY
        elif Config.GEOCODING_PROVIDER == "locationiq":
            Config.LOCATIONIQ_API_KEY = Config.GEOCODING_API_KEY
    if "fallback_speed_kmh" in data:
        Config.FALLBACK_SPEED_KMH = float(data["fallback_speed_kmh"])
    if "max_exact_stops" in data:
        Config.MAX_EXACT_STOPS = int(data["max_exact_stops"])

    return jsonify({
        "message": "Settings updated successfully.",
        "settings": {
            "osrm_endpoint": Config.OSRM_BASE_URL,
            "nominatim_endpoint": Config.NOMINATIM_BASE_URL,
            "geocoding_provider": Config.GEOCODING_PROVIDER,
            "geocoding_api_key_configured": bool(Config.GEOCODING_API_KEY),
            "fallback_speed_kmh": Config.FALLBACK_SPEED_KMH,
            "max_exact_stops": Config.MAX_EXACT_STOPS,
            "demo_region": "Navi Mumbai, Maharashtra, India"
        }
    }), 200
