from flask import Blueprint, request, jsonify
from app.database.db import get_db
from app.services.delivery_service import DeliveryService

deliveries_bp = Blueprint("deliveries", __name__)

@deliveries_bp.route("/deliveries", methods=["GET"])
def list_deliveries():
    db = next(get_db())
    status = request.args.get("status")
    priority = request.args.get("priority")
    search = request.args.get("search")

    deliveries = DeliveryService.get_all(db, status=status, priority=priority, search=search)
    return jsonify({
        "count": len(deliveries),
        "deliveries": [d.to_dict() for d in deliveries]
    }), 200

@deliveries_bp.route("/deliveries", methods=["POST"])
def create_delivery():
    data = request.get_json() or {}
    required_fields = ["customer_label", "address", "latitude", "longitude"]
    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    try:
        lat = float(data["latitude"])
        lon = float(data["longitude"])
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
            return jsonify({"error": "Latitude must be between -90 and 90, and Longitude between -180 and 180."}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Latitude and Longitude must be valid numbers."}), 400

    db = next(get_db())
    delivery = DeliveryService.create(db, data)
    return jsonify({
        "message": "Delivery created successfully.",
        "delivery": delivery.to_dict()
    }), 201

@deliveries_bp.route("/deliveries/<delivery_id>", methods=["GET"])
def get_delivery(delivery_id):
    db = next(get_db())
    delivery = DeliveryService.get_by_id(db, delivery_id)
    if not delivery:
        return jsonify({"error": "Delivery not found."}), 404
    return jsonify({"delivery": delivery.to_dict()}), 200

@deliveries_bp.route("/deliveries/<delivery_id>", methods=["PUT", "PATCH"])
def update_delivery(delivery_id):
    data = request.get_json() or {}
    db = next(get_db())
    updated = DeliveryService.update(db, delivery_id, data)
    if not updated:
        return jsonify({"error": "Delivery not found."}), 404
    return jsonify({
        "message": "Delivery updated successfully.",
        "delivery": updated.to_dict()
    }), 200

@deliveries_bp.route("/deliveries/<delivery_id>", methods=["DELETE"])
def delete_delivery(delivery_id):
    db = next(get_db())
    success = DeliveryService.delete(db, delivery_id)
    if not success:
        return jsonify({"error": "Delivery not found."}), 404
    return jsonify({"message": "Delivery deleted successfully."}), 200

@deliveries_bp.route("/deliveries/seed-demo", methods=["POST"])
def seed_demo():
    db = next(get_db())
    created = DeliveryService.seed_demo_data(db)
    return jsonify({
        "message": f"Successfully loaded {len(created)} demo deliveries for Navi Mumbai demonstration.",
        "created_count": len(created),
        "deliveries": [d.to_dict() for d in created]
    }), 200

@deliveries_bp.route("/deliveries/clear-demo", methods=["POST"])
def clear_demo():
    db = next(get_db())
    removed_count = DeliveryService.clear_demo_data(db)
    return jsonify({
        "message": f"Successfully cleared {removed_count} demo deliveries.",
        "removed_count": removed_count
    }), 200
