import heapq
import time
from typing import Dict, List, Optional, Any
from app.algorithms.graph import RoadGraph

def dijkstra_shortest_path(
    graph: RoadGraph,
    start_node: str,
    target_node: str,
    weight_type: str = "distance"  # "distance" or "duration"
) -> Dict[str, Any]:
    """
    Finds the shortest path between start_node and target_node using Dijkstra's Algorithm.
    Tracks visited nodes, settled distances, predecessors, and constructs the path.
    """
    start_time = time.perf_counter()
    start_str = str(start_node)
    target_str = str(target_node)

    if start_str not in graph.nodes:
        return {
            "algorithm": "Dijkstra",
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
            "algorithm": "Dijkstra",
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
            "algorithm": "Dijkstra",
            "success": True,
            "path": [start_str],
            "path_nodes": [graph.nodes[start_str].to_dict()],
            "total_cost": 0.0,
            "nodes_expanded": 1,
            "execution_time_ms": round((time.perf_counter() - start_time) * 1000, 3)
        }

    # Data structures
    distances: Dict[str, float] = {node_id: float('inf') for node_id in graph.nodes}
    predecessors: Dict[str, Optional[str]] = {node_id: None for node_id in graph.nodes}
    settled = set()
    nodes_expanded = 0

    distances[start_str] = 0.0
    # Priority Queue stores tuples: (current_cost, counter, node_id)
    pq = []
    counter = 0
    heapq.heappush(pq, (0.0, counter, start_str))

    while pq:
        current_cost, _, current_node = heapq.heappop(pq)

        if current_node in settled:
            continue

        settled.add(current_node)
        nodes_expanded += 1

        if current_node == target_str:
            # Reached target with optimal path
            break

        # If recorded distance is strictly less than popped cost, skip
        if current_cost > distances[current_node]:
            continue

        for neighbor_id, edge in graph.get_neighbors(current_node):
            if neighbor_id in settled:
                continue

            edge_weight = edge.distance if weight_type == "distance" else edge.duration
            if edge_weight < 0:
                raise ValueError(f"Dijkstra does not support negative edge weights: edge ({current_node}->{neighbor_id}) has weight {edge_weight}")

            new_cost = current_cost + edge_weight
            if new_cost < distances[neighbor_id]:
                distances[neighbor_id] = new_cost
                predecessors[neighbor_id] = current_node
                counter += 1
                heapq.heappush(pq, (new_cost, counter, neighbor_id))

    exec_time_ms = round((time.perf_counter() - start_time) * 1000, 3)

    # Check if target is unreachable
    if distances[target_str] == float('inf'):
        return {
            "algorithm": "Dijkstra",
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
        "algorithm": "Dijkstra",
        "success": True,
        "path": path,
        "path_nodes": path_nodes,
        "total_cost": round(distances[target_str], 2),
        "weight_type": weight_type,
        "nodes_expanded": nodes_expanded,
        "execution_time_ms": exec_time_ms,
        "predecessors_count": len([p for p in predecessors.values() if p is not None])
    }
