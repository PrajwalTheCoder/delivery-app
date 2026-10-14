import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_food_restaurants_list(client):
    res = client.get("/api/v1/food/restaurants?lat=19.035&lon=73.067")
    assert res.status_code == 200
    data = res.get_json()
    assert data["count"] > 0
    assert "restaurants" in data
    first_rest = data["restaurants"][0]
    assert "name" in first_rest
    assert "distance_km" in first_rest
    assert "estimated_delivery_mins" in first_rest
    assert "menu" in first_rest

def test_food_order_lifecycle(client):
    # 1. Place order
    create_payload = {
        "restaurant_id": "rest-behrouz-kharghar",
        "customer_name": "Test Customer",
        "customer_address": "Test Street, Sector 7, Kharghar",
        "customer_latitude": 19.0345,
        "customer_longitude": 73.0678,
        "items": [
            {
                "id": "item-bb-1",
                "name": "Dum Gosht Biryani",
                "price": 499,
                "quantity": 1
            }
        ]
    }
    res = client.post("/api/v1/food/orders", json=create_payload)
    assert res.status_code == 201
    order = res.get_json()["order"]
    order_id = order["id"]
    otp = order["delivery_otp"]
    assert len(otp) == 4
    assert order["status"] == "placed"

    # 2. Track order
    track_res = client.get(f"/api/v1/food/orders/{order_id}/track")
    assert track_res.status_code == 200
    track_data = track_res.get_json()
    assert track_data["order_id"] == order_id
    assert len(track_data["road_geometry"]) > 0

    # 3. Update status to preparing
    status_res = client.post(f"/api/v1/food/orders/{order_id}/status", json={"status": "preparing"})
    assert status_res.status_code == 200
    assert status_res.get_json()["order"]["status"] == "preparing"

    # 4. Driver updates live GPS location from device
    loc_res = client.post(f"/api/v1/food/orders/{order_id}/driver-location", json={
        "latitude": 19.0350,
        "longitude": 73.0675,
        "heading": 45.0,
        "speed": 22.5,
        "is_real_device": True
    })
    assert loc_res.status_code == 200
    loc_data = loc_res.get_json()
    assert loc_data["driver_location"]["is_real_device_connected"] is True
    assert loc_data["driver_location"]["latitude"] == 19.0350

    # 5. Verify OTP
    otp_res = client.post(f"/api/v1/food/orders/{order_id}/verify-otp", json={"otp": otp})
    assert otp_res.status_code == 200
    assert otp_res.get_json()["success"] is True

def test_device_info(client):
    res = client.get("/api/v1/food/device-info")
    assert res.status_code == 200
    data = res.get_json()
    assert "lan_ip" in data
    assert "driver_companion_url" in data
