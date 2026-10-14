import pytest
from app.algorithms.graph import RoadGraph
from app.algorithms.dijkstra import dijkstra_shortest_path
from app.algorithms.astar import astar_shortest_path

def test_astar_finds_correct_shortest_path():
    g = RoadGraph(directed=False)
    # Realistic lat/lon coordinates
    g.add_node("Start", 19.1197, 72.8468)
    g.add_node("Mid", 19.0600, 72.8335)
    g.add_node("Goal", 19.0016, 72.8302)

    g.add_edge("Start", "Mid", 7000.0)
    g.add_edge("Mid", "Goal", 6000.0)

    res = astar_shortest_path(g, "Start", "Goal")
    assert res["success"] is True
    assert res["path"] == ["Start", "Mid", "Goal"]
    assert res["total_cost"] == 13000.0

def test_astar_agrees_with_dijkstra_on_identical_graph():
    # Grid graph with multiple alternative routes
    g = RoadGraph(directed=False)
    coords = {
        "A": (19.0, 72.0),
        "B": (19.0, 72.1),
        "C": (19.1, 72.0),
        "D": (19.1, 72.1),
        "E": (19.2, 72.2)
    }
    for nid, (lat, lon) in coords.items():
        g.add_node(nid, lat, lon)

    g.add_edge("A", "B", 12000.0)
    g.add_edge("A", "C", 11000.0)
    g.add_edge("B", "D", 11000.0)
    g.add_edge("C", "D", 10000.0)
    g.add_edge("D", "E", 15000.0)
    g.add_edge("B", "E", 28000.0)

    dijkstra_res = dijkstra_shortest_path(g, "A", "E")
    astar_res = astar_shortest_path(g, "A", "E")

    assert dijkstra_res["success"] is True
    assert astar_res["success"] is True
    # Crucial property: Both algorithms find the exact same minimum cost!
    assert dijkstra_res["total_cost"] == astar_res["total_cost"]
    assert dijkstra_res["path"] == astar_res["path"]

def test_astar_unreachable_node():
    g = RoadGraph(directed=True)
    g.add_node("A", 19.0, 72.0)
    g.add_node("B", 19.1, 72.1)
    g.add_node("Unreachable", 20.0, 73.0)
    g.add_edge("A", "B", 5000.0)

    res = astar_shortest_path(g, "A", "Unreachable")
    assert res["success"] is False
    assert res["path"] == []
    assert "unreachable" in res["error"].lower()
