from typing import Dict, List, Optional, Tuple, Any
import math

class GraphNode:
    def __init__(self, node_id: str, latitude: float, longitude: float, label: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None):
        self.node_id = str(node_id)
        self.latitude = float(latitude)
        self.longitude = float(longitude)
        self.label = label or str(node_id)
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.node_id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "label": self.label,
            "metadata": self.metadata
        }

class GraphEdge:
    def __init__(self, source: str, destination: str, distance: float, duration: float = 0.0, road_name: Optional[str] = None):
        self.source = str(source)
        self.destination = str(destination)
        self.distance = float(distance) # in meters
        self.duration = float(duration) # in seconds
        self.road_name = road_name or ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source,
            "destination": self.destination,
            "distance": self.distance,
            "duration": self.duration,
            "road_name": self.road_name
        }

class RoadGraph:
    """
    Weighted directed/undirected graph representation for road network routing.
    Edges have both distance (meters) and travel duration (seconds) weights.
    """
    def __init__(self, directed: bool = False):
        self.directed = directed
        self.nodes: Dict[str, GraphNode] = {}
        self.adj: Dict[str, Dict[str, GraphEdge]] = {}

    def add_node(self, node_id: str, latitude: float, longitude: float, label: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> GraphNode:
        node = GraphNode(node_id, latitude, longitude, label, metadata)
        self.nodes[str(node_id)] = node
        if str(node_id) not in self.adj:
            self.adj[str(node_id)] = {}
        return node

    def add_edge(self, source: str, destination: str, distance: float, duration: float = 0.0, road_name: Optional[str] = None):
        src = str(source)
        dst = str(destination)
        if src not in self.nodes or dst not in self.nodes:
            raise ValueError(f"Both nodes ({src}, {dst}) must be present in the graph before creating an edge.")

        edge1 = GraphEdge(src, dst, distance, duration, road_name)
        self.adj[src][dst] = edge1

        if not self.directed:
            edge2 = GraphEdge(dst, src, distance, duration, road_name)
            self.adj[dst][src] = edge2

    def get_neighbors(self, node_id: str) -> List[Tuple[str, GraphEdge]]:
        nid = str(node_id)
        if nid not in self.adj:
            return []
        return list(self.adj[nid].items())

    def get_edge(self, source: str, destination: str) -> Optional[GraphEdge]:
        return self.adj.get(str(source), {}).get(str(destination))

    def node_count(self) -> int:
        return len(self.nodes)

    def edge_count(self) -> int:
        count = sum(len(neighbors) for neighbors in self.adj.values())
        return count if self.directed else count // 2

    def to_dict(self) -> Dict[str, Any]:
        edges = []
        for src, neighbors in self.adj.items():
            for dst, edge in neighbors.items():
                if self.directed or src <= dst:
                    edges.append(edge.to_dict())
        return {
            "directed": self.directed,
            "nodes": [n.to_dict() for n in self.nodes.values()],
            "edges": edges
        }
