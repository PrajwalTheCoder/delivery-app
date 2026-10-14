import pytest
from app import create_app
from app.database.db import Base, engine

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        with app.app_context():
            Base.metadata.create_all(bind=engine)
        yield client

def test_api_health(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_api_deliveries_crud(client):
    # 1. Create delivery
    payload = {
        "customer_label": "Test Customer",
        "address": "MG Road, Bengaluru",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "contact": "+91 99999 88888",
        "description": "Fragile package",
        "priority": "high"
    }
    create_res = client.post("/api/v1/deliveries", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.get_json()["delivery"]
    deliv_id = created_data["id"]
    assert created_data["customer_label"] == "Test Customer"
    assert created_data["status"] == "pending"

    # 2. Get delivery by ID
    get_res = client.get(f"/api/v1/deliveries/{deliv_id}")
    assert get_res.status_code == 200
    assert get_res.get_json()["delivery"]["id"] == deliv_id

    # 3. Update delivery
    update_res = client.put(f"/api/v1/deliveries/{deliv_id}", json={"status": "delivered", "customer_label": "Updated Name"})
    assert update_res.status_code == 200
    updated = update_res.get_json()["delivery"]
    assert updated["customer_label"] == "Updated Name"
    assert updated["status"] == "delivered"
    assert updated["completed_at"] is not None

    # 4. List deliveries
    list_res = client.get("/api/v1/deliveries?status=delivered")
    assert list_res.status_code == 200
    items = list_res.get_json()["deliveries"]
    assert any(d["id"] == deliv_id for d in items)

    # 5. Delete delivery
    del_res = client.delete(f"/api/v1/deliveries/{deliv_id}")
    assert del_res.status_code == 200

    # 6. Verify deleted
    get_after_del = client.get(f"/api/v1/deliveries/{deliv_id}")
    assert get_after_del.status_code == 404

def test_api_deliveries_validation(client):
    # Missing required field
    res = client.post("/api/v1/deliveries", json={"customer_label": "No Coords"})
    assert res.status_code == 400
    assert "Missing required fields" in res.get_json()["error"]

    # Invalid latitude
    res_lat = client.post("/api/v1/deliveries", json={
        "customer_label": "Bad Lat",
        "address": "Nowhere",
        "latitude": 999.0,
        "longitude": 72.0
    })
    assert res_lat.status_code == 400
