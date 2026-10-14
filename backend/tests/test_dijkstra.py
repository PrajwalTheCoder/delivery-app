import pytest
from app.algorithms.graph import RoadGraph
from app.algorithms.dijkstra import dijkstra_shortest_path

def test_dijkstra_simple_connected_graph():
    g = RoadGraph(directed=False)
    g.add_node("A", 0.0, 0.0)
    g.add_node("B", 0.0, 1.0)
    g.add_node("C", 0.0, 2.0)
    g.add_edge("A", "B", 10.0)
    g.add_edge("B", "C", 15.0)

    res = dijkstra_shortest_path(g, "A", "C")
    assert res["success"] is True
    assert res["path"] == ["A", "B", "C"]
    assert res["total_cost"] == 25.0

def test_dijkstra_multiple_paths_finds_minimum():
    g = RoadGraph(directed=True)
    g.add_node("A", 0.0, 0.0)
    g.add_node("B", 0.0, 1.0)
    g.add_node("C", 1.0, 0.0)
    g.add_node("D", 1.0, 1.0)

    # Path 1: A -> B -> D: cost 50 + 50 = 100
    g.add_edge("A", "B", 50.0)
    g.add_edge("B", "D", 50.0)
    # Path 2: A -> C -> D: cost 20 + 25 = 45 (Cheaper!)
    g.add_edge("A", "C", 20.0)
    g.add_edge("C", "D", 25.0)

    res = dijkstra_shortest_path(g, "A", "D")
    assert res["success"] is True
    assert res["path"] == ["A", "C", "D"]
    assert res["total_cost"] == 45.0

def test_dijkstra_zero_weight_edge():
    g = RoadGraph(directed=False)
    g.add_node("A", 0.0, 0.0)
    g.add_node("B", 0.0, 1.0)
    g.add_node("C", 0.0, 2.0)
    g.add_edge("A", "B", 0.0)
    g.add_edge("B", "C", 12.5)

    res = dijkstra_shortest_path(g, "A", "C")
    assert res["success"] is True
    assert res["total_cost"] == 12.5
    assert res["path"] == ["A", "B", "C"]

def test_dijkstra_unreachable_node():
    g = RoadGraph(directed=True)
    g.add_node("A", 0.0, 0.0)
    g.add_node("B", 0.0, 1.0)
    g.add_node("Isolated", 5.0, 5.0)
    g.add_edge("A", "B", 10.0)

    res = dijkstra_shortest_path(g, "A", "Isolated")
    assert res["success"] is False
    assert res["path"] == []
    assert "unreachable" in res["error"].lower()

def test_dijkstra_same_start_and_target():
    g = RoadGraph(directed=False)
    g.add_node("A", 0.0, 0.0)
    res = dijkstra_shortest_path(g, "A", "A")
    assert res["success"] is True
    assert res["path"] == ["A"]
    assert res["total_cost"] == 0.0
