import requests
import hashlib
from typing import List, Tuple, Dict, Any, Optional
from app.config import Config
from app.utils.geo import haversine_distance

# Route cache mapping hash of coordinates -> route data
ROUTE_CACHE: Dict[str, Dict[str, Any]] = {}
TABLE_CACHE: Dict[str, Dict[str, Any]] = {}

class RoutingService:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or Config.OSRM_BASE_URL).rstrip("/")

    def _coords_to_key(self, coords: List[Tuple[float, float]]) -> str:
        s = ";".join(f"{round(lat, 5)},{round(lon, 5)}" for lat, lon in coords)
        return hashlib.md5(s.encode("utf-8")).hexdigest()

    def get_route(
        self,
        coordinates: List[Tuple[float, float]], # List of (lat, lon)
        overview: str = "full"
    ) -> Dict[str, Any]:
        """
        Request driving road-route geometry, distance, and duration from OSRM.
        coordinates: [(lat1, lon1), (lat2, lon2), ...]
        Returns road coordinates, distance_meters, duration_seconds.
        """
        if len(coordinates) < 2:
            return {
                "success": False,
                "error": "At least two coordinates are required to compute a route.",
                "distance_meters": 0.0,
                "duration_seconds": 0.0,
                "geometry_coordinates": []
            }

        cache_key = self._coords_to_key(coordinates) + f"_{overview}"
        if cache_key in ROUTE_CACHE:
            return ROUTE_CACHE[cache_key]

        # OSRM expects coordinates in {lon},{lat};{lon},{lat} order!
        coord_str = ";".join(f"{lon},{lat}" for lat, lon in coordinates)
        url = f"{self.base_url}/route/v1/driving/{coord_str}"
        params = {
            "overview": overview,
            "geometries": "geojson",
            "steps": "false"
        }

        try:
            resp = requests.get(url, params=params, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    best_route = data["routes"][0]
                    # GeoJSON coordinates are [lon, lat], convert to [lat, lon] for Leaflet
                    raw_coords = best_route["geometry"]["coordinates"]
                    leaflet_coords = [[c[1], c[0]] for c in raw_coords]

                    result = {
                        "success": True,
                        "provider": "OSRM Road Network",
                        "is_real_road_geometry": True,
                        "distance_meters": round(best_route["distance"], 1),
                        "duration_seconds": round(best_route["duration"], 1),
                        "geometry_coordinates": leaflet_coords,
                        "warnings": []
                    }
                    ROUTE_CACHE[cache_key] = result
                    return result
        except Exception as e:
            # Service unreachable, timeout or network issue
            pass

        # Graceful fallback: Road Curvature Model
        # When public OSRM demo is unavailable, compute road-network approximation
        # using Haversine distance multiplied by typical urban detour curvature (1.35x)
        total_dist = 0.0
        simple_coords = []
        for i in range(len(coordinates) - 1):
            c1 = coordinates[i]
            c2 = coordinates[i + 1]
            seg_dist = haversine_distance(c1, c2) * 1.35 # 1.35 road winding factor
            total_dist += seg_dist
            simple_coords.append([c1[0], c1[1]])
        simple_coords.append([coordinates[-1][0], coordinates[-1][1]])

        # Duration based on average urban speed 30 km/h (8.33 m/s)
        duration_sec = total_dist / (Config.FALLBACK_SPEED_KMH * 1000.0 / 3600.0)

        fallback_result = {
            "success": True,
            "provider": "Internal Road Estimator (OSRM Offline/Unreachable)",
            "is_real_road_geometry": False,
            "distance_meters": round(total_dist, 1),
            "duration_seconds": round(duration_sec, 1),
            "geometry_coordinates": simple_coords,
            "warnings": ["Using curvature road-model fallback because public OSRM demo service was unreachable."]
        }
        return fallback_result

    def get_travel_cost_matrix(
        self,
        coordinates: List[Tuple[float, float]] # List of (lat, lon)
    ) -> Dict[str, Any]:
        """
        Calculates pairwise distance and duration matrices between all supplied coordinates.
        Uses OSRM Table API in a single HTTP request!
        """
        n = len(coordinates)
        if n < 2:
            return {
                "success": True,
                "distance_matrix": [[0.0]],
                "duration_matrix": [[0.0]],
                "provider": "Local"
            }

        cache_key = "table_" + self._coords_to_key(coordinates)
        if cache_key in TABLE_CACHE:
            return TABLE_CACHE[cache_key]

        coord_str = ";".join(f"{lon},{lat}" for lat, lon in coordinates)
        url = f"{self.base_url}/table/v1/driving/{coord_str}"
        params = {
            "annotations": "duration,distance"
        }

        try:
            resp = requests.get(url, params=params, timeout=6.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == "Ok" and "distances" in data and "durations" in data:
                    res = {
                        "success": True,
                        "provider": "OSRM Table API",
                        "is_real_road_matrix": True,
                        "distance_matrix": data["distances"],
                        "duration_matrix": data["durations"],
                        "warnings": []
                    }
                    TABLE_CACHE[cache_key] = res
                    return res
        except Exception:
            pass

        # Fallback matrix calculation using Haversine distance * 1.35 road factor
        dist_matrix = [[0.0] * n for _ in range(n)]
        dur_matrix = [[0.0] * n for _ in range(n)]
        speed_mps = Config.FALLBACK_SPEED_KMH * 1000.0 / 3600.0

        for i in range(n):
            for j in range(n):
                if i != j:
                    d = haversine_distance(coordinates[i], coordinates[j]) * 1.35
                    dist_matrix[i][j] = round(d, 1)
                    dur_matrix[i][j] = round(d / speed_mps, 1)

        res = {
            "success": True,
            "provider": "Internal Road Curvature Estimator (OSRM Offline)",
            "is_real_road_matrix": False,
            "distance_matrix": dist_matrix,
            "duration_matrix": dur_matrix,
            "warnings": ["Using curvature road matrix fallback as public OSRM was unreachable."]
        }
        return res

routing_service = RoutingService()
