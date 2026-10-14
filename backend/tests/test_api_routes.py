import pytest
from unittest.mock import patch
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

def test_api_route_optimization_and_persistence(client):
    req_body = {
        "name": "Unit Test Route Plan",
        "start": {
            "address": "Warehouse Central",
            "latitude": 19.1136,
            "longitude": 72.8697
        },
        "stops": [
            {
                "id": "mock-stop-1",
                "customer_label": "Client Alpha",
                "address": "Bandra BKC",
                "latitude": 19.0657,
                "longitude": 72.8687,
                "priority": "high"
            },
            {
                "id": "mock-stop-2",
                "customer_label": "Client Beta",
                "address": "Juhu Tara",
                "latitude": 19.1025,
                "longitude": 72.8270,
                "priority": "normal"
            }
        ],
        "objective": "distance",
        "algorithm": "nearest_neighbor_2opt",
        "save_plan": True
    }

    res = client.post("/api/v1/routes/optimize", json=req_body)
    assert res.status_code == 200
    data = res.get_json()

    assert data["success"] is True
    assert "route_plan_id" in data
    assert len(data["ordered_stops"]) == 2
    assert "total_distance" in data
    assert "route_geometry" in data

    plan_id = data["route_plan_id"]
    # Retrieve saved plan
    get_res = client.get(f"/api/v1/routes/{plan_id}")
    assert get_res.status_code == 200
    plan_data = get_res.get_json()["plan"]
    assert plan_data["name"] == "Unit Test Route Plan"
    assert len(plan_data["stops"]) == 2

    # Clean up
    del_res = client.delete(f"/api/v1/routes/{plan_id}")
    assert del_res.status_code == 200

def test_api_algorithm_compare(client):
    res = client.post("/api/v1/algorithms/compare", json={
        "start_node": "A",
        "target_node": "G",
        "weight_type": "distance"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "pathfinding_comparison" in data
    assert "tsp_comparison" in data
    assert len(data["tsp_comparison"]["strategies"]) == 4
