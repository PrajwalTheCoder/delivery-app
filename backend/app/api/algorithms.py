from flask import Blueprint, request, jsonify
from app.algorithms.graph import RoadGraph
from app.algorithms.dijkstra import dijkstra_shortest_path
from app.algorithms.astar import astar_shortest_path
from app.algorithms.tsp import (
    optimize_delivery_route,
    nearest_neighbor_tour,
    two_opt_tour,
    exact_tsp_held_karp,
    calculate_tour_cost
)
from app.services.routing_service import routing_service
from app.utils.geo import format_distance, format_duration

algorithms_bp = Blueprint("algorithms", __name__)

def build_benchmark_mumbai_graph() -> RoadGraph:
    """
    A realistic road graph of South-Central Mumbai delivery corridor
    with authentic latitudes, longitudes, road connections, and distances.
    Nodes:
    A: Warehouse Hub (Andheri)
    B: Bandra Linking Rd
    C: BKC Commercial Hub
    D: Dadar Junction
    E: Worli Sea Face
    F: Lower Parel Tech Hub
    G: Nariman Point
    """
    g = RoadGraph(directed=False)
    g.add_node("A", 19.1197, 72.8468, "Andheri Hub (Warehouse)")
    g.add_node("B", 19.0600, 72.8335, "Bandra Linking Rd")
    g.add_node("C", 19.0657, 72.8687, "BKC Complex")
    g.add_node("D", 19.0222, 72.8427, "Dadar Junction")
    g.add_node("E", 19.0135, 72.8150, "Worli Sea Face")
    g.add_node("F", 19.0016, 72.8302, "Lower Parel Hub")
    g.add_node("G", 18.9256, 72.8242, "Nariman Point Depot")

    # Real road segment distances (meters) and average travel durations (seconds)
    g.add_edge("A", "B", 7800.0, 950.0, "Western Express Highway")
    g.add_edge("A", "C", 8500.0, 1100.0, "CST Road / Kurla Link")
    g.add_edge("B", "C", 3800.0, 520.0, "BKC Connector")
    g.add_edge("B", "D", 5100.0, 680.0, "Mahim Causeway")
    g.add_edge("C", "D", 5900.0, 800.0, "Dharavi-Sion Link")
    g.add_edge("D", "E", 3200.0, 420.0, "Senapati Bapat Marg")
    g.add_edge("D", "F", 2700.0, 360.0, "Dr Babasaheb Ambedkar Rd")
    g.add_edge("E", "F", 2100.0, 290.0, "Worli Naka Rd")
    g.add_edge("E", "G", 11200.0, 1400.0, "Marine Drive / Sea Face")
    g.add_edge("F", "G", 9800.0, 1250.0, "P D'Mello / Marine Lines")
    return g

@algorithms_bp.route("/algorithms/sample-graphs", methods=["GET"])
def get_sample_graphs():
    g = build_benchmark_mumbai_graph()
    return jsonify({
        "sample_graphs": [
            {
                "id": "mumbai_urban_corridor",
                "name": "Mumbai Metro Delivery Network",
                "description": "7 interconnected nodes covering key logistic corridors with real coordinates & road metrics.",
                "node_count": g.node_count(),
                "edge_count": g.edge_count(),
                "graph": g.to_dict()
            }
        ]
    }), 200

@algorithms_bp.route("/algorithms/shortest-path", methods=["POST"])
def shortest_path():
    """
    Executes Dijkstra or A* on the graph.
    Request body:
    {
      "algorithm": "dijkstra" | "astar" | "both",
      "start_node": "A",
      "target_node": "G",
      "weight_type": "distance" | "duration",
      "custom_graph": optional RoadGraph dict
    }
    """
    data = request.get_json() or {}
    algo = data.get("algorithm", "both").lower()
    start_node = data.get("start_node", "A")
    target_node = data.get("target_node", "G")
    weight_type = data.get("weight_type", "distance")

    # Construct graph: if custom graph supplied, build it, else use benchmark
    custom = data.get("custom_graph")
    if custom and "nodes" in custom and "edges" in custom:
        g = RoadGraph(directed=custom.get("directed", False))
        for n in custom["nodes"]:
            g.add_node(n["id"], n["latitude"], n["longitude"], n.get("label"), n.get("metadata"))
        for e in custom["edges"]:
            g.add_edge(e["source"], e["destination"], e["distance"], e.get("duration", 0.0), e.get("road_name"))
    else:
        g = build_benchmark_mumbai_graph()

    results = {}
    if algo in ["dijkstra", "both"]:
        results["dijkstra"] = dijkstra_shortest_path(g, start_node, target_node, weight_type)
    if algo in ["astar", "both"]:
        results["astar"] = astar_shortest_path(g, start_node, target_node, weight_type)

    return jsonify({
        "start_node": start_node,
        "target_node": target_node,
        "weight_type": weight_type,
        "results": results
    }), 200

@algorithms_bp.route("/algorithms/compare", methods=["POST"])
def compare_algorithms():
    """
    Side-by-side comparison of algorithms on the same dataset:
    - Pathfinding comparison: Dijkstra vs A* on Mumbai Road Network
    - TSP optimization comparison: Sequential vs Nearest Neighbor vs 2-Opt vs Exact Held-Karp
    """
    data = request.get_json() or {}
    start_node = data.get("start_node", "A")
    target_node = data.get("target_node", "G")
    weight_type = data.get("weight_type", "distance")

    # 1. Pathfinding comparison on standard graph
    g = build_benchmark_mumbai_graph()
    dijkstra_res = dijkstra_shortest_path(g, start_node, target_node, weight_type)
    astar_res = astar_shortest_path(g, start_node, target_node, weight_type)

    # 2. Multi-Stop TSP benchmark comparison
    # 5 standard delivery destinations around Mumbai
    tsp_coords = [
        (19.1197, 72.8468),  # Warehouse: Andheri
        (19.0657, 72.8687),  # Stop 1: BKC
        (19.1025, 72.8270),  # Stop 2: Juhu
        (19.1176, 72.9060),  # Stop 3: Powai
        (19.0222, 72.8427),  # Stop 4: Dadar
        (19.0016, 72.8302),  # Stop 5: Lower Parel
    ]
    tsp_labels = ["Andheri HQ", "BKC", "Juhu", "Powai", "Dadar", "Lower Parel"]

    matrix_res = routing_service.get_travel_cost_matrix(tsp_coords)
    cost_matrix = matrix_res["distance_matrix"] if weight_type == "distance" else matrix_res["duration_matrix"]

    # Run TSP strategies
    seq_tour = list(range(len(tsp_coords)))
    seq_cost = calculate_tour_cost(seq_tour, cost_matrix)

    nn_tour, nn_cost = nearest_neighbor_tour(cost_matrix, start_idx=0)
    two_opt_tour_res, two_opt_cost, iterations = two_opt_tour(cost_matrix, initial_tour=nn_tour)
    exact_tour, exact_cost = exact_tsp_held_karp(cost_matrix, start_idx=0)

    tsp_comparison = {
        "nodes": tsp_labels,
        "strategies": [
            {
                "name": "Sequential Order (As Received)",
                "type": "Naive / Unoptimized",
                "tour": [tsp_labels[i] for i in seq_tour],
                "cost": round(seq_cost, 2),
                "formatted_cost": format_distance(seq_cost)["text"] if weight_type == "distance" else format_duration(seq_cost)["text"],
                "improvement_vs_sequential_percent": 0.0,
                "time_complexity": "O(1)"
            },
            {
                "name": "Nearest Neighbor Heuristic",
                "type": "Greedy Construction",
                "tour": [tsp_labels[i] for i in nn_tour],
                "cost": round(nn_cost, 2),
                "formatted_cost": format_distance(nn_cost)["text"] if weight_type == "distance" else format_duration(nn_cost)["text"],
                "improvement_vs_sequential_percent": round((seq_cost - nn_cost) / seq_cost * 100, 2) if seq_cost > 0 else 0.0,
                "time_complexity": "O(N²)"
            },
            {
                "name": "Nearest Neighbor + 2-Opt",
                "type": "Local Search Improvement",
                "tour": [tsp_labels[i] for i in two_opt_tour_res],
                "cost": round(two_opt_cost, 2),
                "formatted_cost": format_distance(two_opt_cost)["text"] if weight_type == "distance" else format_duration(two_opt_cost)["text"],
                "improvement_vs_sequential_percent": round((seq_cost - two_opt_cost) / seq_cost * 100, 2) if seq_cost > 0 else 0.0,
                "iterations": iterations,
                "time_complexity": "O(k · N²)"
            },
            {
                "name": "Exact Held-Karp Algorithm",
                "type": "Dynamic Programming (Global Optimum)",
                "tour": [tsp_labels[i] for i in exact_tour],
                "cost": round(exact_cost, 2),
                "formatted_cost": format_distance(exact_cost)["text"] if weight_type == "distance" else format_duration(exact_cost)["text"],
                "improvement_vs_sequential_percent": round((seq_cost - exact_cost) / seq_cost * 100, 2) if seq_cost > 0 else 0.0,
                "time_complexity": "O(N² · 2ᴺ)"
            }
        ]
    }

    educational_insight = (
        "Dijkstra and A* explore paths on the same graph: A* evaluates fewer nodes "
        "because its admissible Euclidean/Haversine heuristic directs the priority search towards "
        "the goal coordinate. In multi-stop optimization, 2-Opt iteratively untangles intersecting "
        "cross-edges from Nearest Neighbor, frequently matching the exact Held-Karp global optimum "
        "in polynomial time."
    )

    return jsonify({
        "pathfinding_comparison": {
            "graph_name": "Mumbai Metro Delivery Network",
            "start": start_node,
            "target": target_node,
            "dijkstra": dijkstra_res,
            "astar": astar_res
        },
        "tsp_comparison": tsp_comparison,
        "educational_insight": educational_insight
    }), 200
