import pytest
import io
import csv
from app import create_app
from app.database.db import get_db
from app.models.delivery import Delivery
from app.models.route_plan import RoutePlan
from app.algorithms.tsp import (
    calculate_tour_cost,
    nearest_neighbor_tour,
    two_opt_tour,
    optimize_delivery_route
)
from app.services.geocoding_service import GeocodingService

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_closed_vs_open_route_costs():
    # 3 nodes: 0, 1, 2 forming a triangle
    matrix = [
        [0.0, 10.0, 15.0],
        [10.0, 0.0, 12.0],
        [15.0, 12.0, 0.0]
    ]
    tour = [0, 1, 2]
    open_cost = calculate_tour_cost(tour, matrix, return_to_depot=False)
    # open: 0->1 (10) + 1->2 (12) = 22
    assert open_cost == 22.0

    closed_cost = calculate_tour_cost(tour, matrix, return_to_depot=True)
    # closed: 0->1 (10) + 1->2 (12) + 2->0 (15) = 37
    assert closed_cost == 37.0
    assert closed_cost > open_cost

def test_asymmetric_matrix_optimization():
    # Asymmetric matrix: one-way streets where going backwards is much more expensive
    matrix = [
        [0.0, 10.0, 100.0],
        [100.0, 0.0, 10.0],
        [10.0, 100.0, 0.0]
    ]
    # Tour [0, 1, 2] closed: 0->1 (10) + 1->2 (10) + 2->0 (10) = 30
    # Tour [0, 2, 1] closed: 0->2 (100) + 2->1 (100) + 1->0 (100) = 300
    res = optimize_delivery_route(matrix, algorithm="nearest_neighbor_2opt", return_to_depot=True)
    assert res["ordered_indices"] == [0, 1, 2]
    assert res["total_cost"] == 30.0

def test_zero_savings_retains_baseline():
    # Symmetric 2-node where original order is already optimal
    matrix = [
        [0.0, 25.0],
        [25.0, 0.0]
    ]
    res = optimize_delivery_route(matrix, algorithm="nearest_neighbor_2opt", return_to_depot=False)
    assert res["ordered_indices"] == [0, 1]
    assert res["cost_improvement_percent"] == 0.0
    assert res["distance_saved"] == 0.0

def test_geocoding_presets_navi_mumbai():
    # Explicit search for Kharghar returns Navi Mumbai depot or landmarks
    results = GeocodingService.search("Kharghar", limit=5)
    assert len(results) > 0
    assert any("kharghar" in r["display_name"].lower() or "navi mumbai" in r["display_name"].lower() for r in results)
    first = results[0]
    assert -90.0 <= first["latitude"] <= 90.0
    assert -180.0 <= first["longitude"] <= 180.0

def test_route_execution_and_stop_status(client):
    # Seed demo data
    seed_res = client.post("/api/v1/deliveries/seed-demo")
    assert seed_res.status_code == 200

    # Create and optimize route plan with Kharghar depot
    plan_payload = {
        "name": "Kharghar Test Plan",
        "start": {
            "address": "Central Depot, Kharghar, Navi Mumbai",
            "latitude": 19.0434,
            "longitude": 73.0683
        },
        "stops": [
            {
                "customer_label": "Customer A",
                "address": "Sector 7, Kharghar",
                "latitude": 19.0345,
                "longitude": 73.0678,
                "priority": "high"
            },
            {
                "customer_label": "Customer B",
                "address": "Sector 17, Vashi",
                "latitude": 19.0760,
                "longitude": 72.9986,
                "priority": "normal"
            }
        ],
        "destination_policy": "return_to_depot",
        "save_plan": True
    }
    opt_res = client.post("/api/v1/routes/optimize", json=plan_payload)
    assert opt_res.status_code == 200
    plan_data = opt_res.get_json()
    plan_id = plan_data["route_plan_id"]
    assert plan_id is not None

    # Start the route
    start_res = client.post(f"/api/v1/routes/{plan_id}/start")
    assert start_res.status_code == 200
    assert start_res.get_json()["plan"]["status"] == "in_transit"

    # Get route details and verify stops
    get_res = client.get(f"/api/v1/routes/{plan_id}")
    plan_obj = get_res.get_json()["plan"]
    stops = plan_obj["stops"]
    assert len(stops) == 2

    # Mark first stop as delivered
    first_stop_id = stops[0]["id"]
    deliv_res = client.post(f"/api/v1/routes/{plan_id}/stops/{first_stop_id}/status", json={
        "status": "delivered"
    })
    assert deliv_res.status_code == 200
    assert deliv_res.get_json()["stop"]["status"] == "delivered"

    # Mark second stop as failed with reason
    second_stop_id = stops[1]["id"]
    fail_res = client.post(f"/api/v1/routes/{plan_id}/stops/{second_stop_id}/status", json={
        "status": "failed",
        "reason": "Customer gate locked, phone switched off"
    })
    assert fail_res.status_code == 200
    assert fail_res.get_json()["stop"]["status"] == "failed"
    assert fail_res.get_json()["stop"]["failure_reason"] == "Customer gate locked, phone switched off"

    # Verify route status transitioned to completed
    check_plan = client.get(f"/api/v1/routes/{plan_id}").get_json()["plan"]
    assert check_plan["status"] == "completed"

    # Test CSV export
    csv_res = client.get(f"/api/v1/routes/{plan_id}/export?format=csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.content_type
    csv_text = csv_res.data.decode("utf-8")
    assert "RouteWise AI" in csv_text
    assert plan_id in csv_text
