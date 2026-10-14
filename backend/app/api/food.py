from flask import Blueprint, request, jsonify
from app.services.food_delivery_service import FoodDeliveryService

food_bp = Blueprint("food", __name__, url_prefix="/food")

@food_bp.route("/restaurants", methods=["GET"])
def get_restaurants():
    """List real restaurants with live road distance and ETA from user location."""
    user_lat = request.args.get("lat", type=float)
    user_lon = request.args.get("lon", type=float)
    query = request.args.get("q", "")
    category = request.args.get("category", "all")

    restaurants = FoodDeliveryService.get_restaurants(
        user_lat=user_lat,
        user_lon=user_lon,
        search_query=query,
        category=category
    )
    return jsonify({
        "count": len(restaurants),
        "restaurants": restaurants
    }), 200

@food_bp.route("/restaurants/<restaurant_id>", methods=["GET"])
def get_restaurant_detail(restaurant_id):
    """Retrieve single restaurant details with full menu catalog."""
    rest = FoodDeliveryService.get_restaurant_by_id(restaurant_id)
    if not rest:
        return jsonify({"error": f"Restaurant '{restaurant_id}' not found."}), 404
    return jsonify({"restaurant": rest}), 200

@food_bp.route("/orders", methods=["GET", "POST"])
def orders_handler():
    if request.method == "POST":
        body = request.get_json() or {}
        order = FoodDeliveryService.create_order(body)
        return jsonify({
            "message": "Order placed successfully!",
            "order": order
        }), 201
    else:
        orders = FoodDeliveryService.get_all_orders()
        return jsonify({
            "count": len(orders),
            "orders": orders
        }), 200

@food_bp.route("/orders/<order_id>", methods=["GET"])
def get_order(order_id):
    order = FoodDeliveryService.get_order(order_id)
    if not order:
        return jsonify({"error": f"Order '{order_id}' not found."}), 404
    return jsonify({"order": order}), 200

@food_bp.route("/orders/<order_id>/track", methods=["GET"])
def track_order(order_id):
    """Live tracking telemetry payload for Swiggy / Zomato order tracking view."""
    order = FoodDeliveryService.get_order(order_id)
    if not order:
        return jsonify({"error": f"Order '{order_id}' not found."}), 404
    return jsonify({
        "order_id": order["id"],
        "status": order["status"],
        "status_title": order["status_title"],
        "status_message": order["status_message"],
        "delivery_otp": order["delivery_otp"],
        "distance_km": order["distance_km"],
        "estimated_delivery_mins": order["estimated_delivery_mins"],
        "driver_location": order["driver_location"],
        "restaurant": order["restaurant"],
        "customer": order["customer"],
        "rider": order["rider"],
        "road_geometry": order["road_geometry"],
        "timeline": order["timeline"],
        "items": order["items"],
        "bill": order["bill"]
    }), 200

@food_bp.route("/orders/<order_id>/status", methods=["POST"])
def update_status(order_id):
    """Update order lifecycle status (from Kitchen, Dispatch, or Driver)."""
    body = request.get_json() or {}
    new_status = body.get("status")
    if not new_status:
        return jsonify({"error": "Status field is required."}), 400

    updated = FoodDeliveryService.update_order_status(order_id, new_status)
    if not updated:
        return jsonify({"error": f"Order '{order_id}' not found."}), 404

    return jsonify({
        "message": f"Order status updated to '{new_status}'",
        "order": updated
    }), 200

@food_bp.route("/orders/<order_id>/driver-location", methods=["POST"])
def update_driver_location(order_id):
    """
    Real Device GPS Sync Endpoint:
    Receives live latitude, longitude, heading, and speed from driver's physical smartphone.
    """
    body = request.get_json() or {}
    lat = body.get("latitude") or body.get("lat")
    lon = body.get("longitude") or body.get("lon")
    heading = float(body.get("heading", 0.0))
    speed = float(body.get("speed", 0.0))
    is_real_device = bool(body.get("is_real_device", False))

    if lat is None or lon is None:
        return jsonify({"error": "Latitude and longitude are required."}), 400

    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except (ValueError, TypeError):
        return jsonify({"error": "Coordinates must be numeric."}), 400

    updated = FoodDeliveryService.update_driver_location(
        order_id=order_id,
        latitude=lat_f,
        longitude=lon_f,
        heading=heading,
        speed_kmh=speed,
        is_real_device=is_real_device
    )

    if not updated:
        return jsonify({"error": f"Order '{order_id}' not found."}), 404

    return jsonify({
        "message": "Driver location updated successfully",
        "driver_location": updated["driver_location"],
        "remaining_distance_km": updated["distance_km"],
        "remaining_eta_mins": updated["estimated_delivery_mins"]
    }), 200

@food_bp.route("/orders/<order_id>/verify-otp", methods=["POST"])
def verify_otp(order_id):
    """Driver OTP verification on doorstep."""
    body = request.get_json() or {}
    otp = str(body.get("otp", "")).strip()
    if not otp:
        return jsonify({"error": "OTP is required."}), 400

    result = FoodDeliveryService.verify_otp(order_id, otp)
    if not result.get("success"):
        return jsonify(result), 400

    return jsonify(result), 200

@food_bp.route("/device-info", methods=["GET"])
def device_info():
    """Returns local LAN network IP address and companion URLs for physical device pairing."""
    info = FoodDeliveryService.get_device_info()
    return jsonify(info), 200

@food_bp.route("/seed-demo", methods=["POST"])
def seed_demo():
    FoodDeliveryService.seed_demo_order_if_empty()
    orders = FoodDeliveryService.get_all_orders()
    return jsonify({
        "message": "Demo order seeded successfully",
        "orders": orders
    }), 200
