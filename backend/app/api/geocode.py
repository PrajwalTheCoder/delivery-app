from flask import Blueprint, request, jsonify
from app.services.geocoding_service import search_address, reverse_geocode

geocode_bp = Blueprint("geocode", __name__)

@geocode_bp.route("/geocoding/search", methods=["GET", "POST"])
@geocode_bp.route("/geocode/search", methods=["GET", "POST"])
def search():
    if request.method == "POST":
        body = request.get_json() or {}
        query = body.get("query") or body.get("q", "")
        limit = int(body.get("limit", 5))
    else:
        query = request.args.get("q", "") or request.args.get("query", "")
        limit = int(request.args.get("limit", 5))

    query = query.strip()
    if not query:
        return jsonify({"results": [], "count": 0, "query": ""}), 200

    results = search_address(query, limit=limit)
    return jsonify({
        "query": query,
        "count": len(results),
        "results": results
    }), 200

@geocode_bp.route("/geocoding/reverse", methods=["GET", "POST"])
@geocode_bp.route("/geocode/reverse", methods=["GET", "POST"])
def reverse():
    if request.method == "POST":
        body = request.get_json() or {}
        lat = body.get("latitude") or body.get("lat")
        lon = body.get("longitude") or body.get("lon")
    else:
        lat = request.args.get("lat") or request.args.get("latitude")
        lon = request.args.get("lon") or request.args.get("longitude")

    if lat is None or lon is None:
        return jsonify({"error": "Latitude and Longitude parameters are required."}), 400

    try:
        lat_f = float(lat)
        lon_f = float(lon)
        if not (-90.0 <= lat_f <= 90.0) or not (-180.0 <= lon_f <= 180.0):
            return jsonify({"error": "Coordinates out of valid range (-90 to 90, -180 to 180)."}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Latitude and Longitude must be valid numbers."}), 400

    result = reverse_geocode(lat_f, lon_f)
    return jsonify({"result": result}), 200
