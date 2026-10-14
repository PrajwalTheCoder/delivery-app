import heapq
import time
from typing import Dict, List, Optional, Any
from app.algorithms.graph import RoadGraph
from app.utils.geo import haversine_distance

MAX_SPEED_METERS_PER_SECOND = 27.78  # 100 km/h upper bound for admissible time heuristic

def calculate_heuristic(
    graph: RoadGraph,
    current_node_id: str,
    target_node_id: str,
    weight_type: str = "distance"
) -> float:
    """
    Computes an admissible geographic heuristic between current_node and target_node.
    - For distance: Straight-line Haversine distance (always <= road distance, so admissible).
    - For duration: Haversine distance divided by maximum vehicle speed (guaranteed lower bound on travel time).
    """
    n1 = graph.nodes[current_node_id]
    n2 = graph.nodes[target_node_id]

    straight_line_dist = haversine_distance(
        (n1.latitude, n1.longitude),
        (n2.latitude, n2.longitude)
    )

    if weight_type == "duration":
        return straight_line_dist / MAX_SPEED_METERS_PER_SECOND
    return straight_line_dist

def astar_shortest_path(
    graph: RoadGraph,
    start_node: str,
    target_node: str,
    weight_type: str = "distance"
) -> Dict[str, Any]:
    """
    Finds the shortest path between start_node and target_node using A* Search algorithm.
    Guarantees optimal path when heuristic is admissible.
    """
    start_time = time.perf_counter()
    start_str = str(start_node)
    target_str = str(target_node)

    if start_str not in graph.nodes:
        return {
            "algorithm": "A*",
            "success": False,
            "error": f"Start node '{start_str}' does not exist in graph.",
            "path": [],
            "path_nodes": [],
            "total_cost": 0.0,
            "nodes_expanded": 0,
            "execution_time_ms": 0.0
        }

    if target_str not in graph.nodes:
        return {
            "algorithm": "A*",
            "success": False,
            "error": f"Target node '{target_str}' does not exist in graph.",
            "path": [],
            "path_nodes": [],
            "total_cost": 0.0,
            "nodes_expanded": 0,
            "execution_time_ms": 0.0
        }

    if start_str == target_str:
        return {
            "algorithm": "A*",
            "success": True,
            "path": [start_str],
            "path_nodes": [graph.nodes[start_str].to_dict()],
            "total_cost": 0.0,
            "nodes_expanded": 1,
            "execution_time_ms": round((time.perf_counter() - start_time) * 1000, 3)
        }

    # g_score[n] is the cost of the cheapest path from start to n currently known
    g_score: Dict[str, float] = {node_id: float('inf') for node_id in graph.nodes}
    g_score[start_str] = 0.0

    # f_score[n] = g_score[n] + h(n)
    initial_h = calculate_heuristic(graph, start_str, target_str, weight_type)
    f_score: Dict[str, float] = {node_id: float('inf') for node_id in graph.nodes}
    f_score[start_str] = initial_h

    predecessors: Dict[str, Optional[str]] = {node_id: None for node_id in graph.nodes}
    closed_set = set()
    nodes_expanded = 0

    # Priority queue stores (f_score, counter, current_node_id)
    open_heap = []
    counter = 0
    heapq.heappush(open_heap, (initial_h, counter, start_str))

    found_target = False

    while open_heap:
        curr_f, _, current_node = heapq.heappop(open_heap)

        if current_node in closed_set:
            continue

        closed_set.add(current_node)
        nodes_expanded += 1

        if current_node == target_str:
            found_target = True
            break

        for neighbor_id, edge in graph.get_neighbors(current_node):
            if neighbor_id in closed_set:
                continue

            edge_weight = edge.distance if weight_type == "distance" else edge.duration
            tentative_g = g_score[current_node] + edge_weight

            if tentative_g < g_score[neighbor_id]:
                predecessors[neighbor_id] = current_node
                g_score[neighbor_id] = tentative_g
                h = calculate_heuristic(graph, neighbor_id, target_str, weight_type)
                f_score[neighbor_id] = tentative_g + h

                counter += 1
                heapq.heappush(open_heap, (f_score[neighbor_id], counter, neighbor_id))

    exec_time_ms = round((time.perf_counter() - start_time) * 1000, 3)

    if not found_target or g_score[target_str] == float('inf'):
        return {
            "algorithm": "A*",
            "success": False,
            "error": f"Target node '{target_str}' is unreachable from start node '{start_str}'.",
            "path": [],
            "path_nodes": [],
            "total_cost": float('inf'),
            "nodes_expanded": nodes_expanded,
            "execution_time_ms": exec_time_ms
        }

    # Path reconstruction
    path = []
    curr = target_str
    while curr is not None:
        path.append(curr)
        curr = predecessors[curr]
    path.reverse()

    path_nodes = [graph.nodes[nid].to_dict() for nid in path]

    return {
        "algorithm": "A*",
        "success": True,
        "path": path,
        "path_nodes": path_nodes,
        "total_cost": round(g_score[target_str], 2),
        "weight_type": weight_type,
        "nodes_expanded": nodes_expanded,
        "execution_time_ms": exec_time_ms,
        "heuristic_used": "Haversine straight-line admissible lower bound"
    }
