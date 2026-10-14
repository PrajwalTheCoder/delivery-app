import math
from typing import Tuple, List, Dict, Any

EARTH_RADIUS_METERS = 6371000.0  # Mean radius of Earth in meters

def haversine_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Calculate the great-circle distance between two points on the Earth's surface
    using the Haversine formula.
    coord1: (lat, lon) in degrees
    coord2: (lat, lon) in degrees
    returns: distance in meters
    """
    lat1, lon1 = coord1
    lat2, lon2 = coord2

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return EARTH_RADIUS_METERS * c

def format_distance(meters: float) -> Dict[str, Any]:
    """Format meters into a user-friendly object with km and m."""
    if meters >= 1000:
        return {
            "meters": round(meters, 1),
            "kilometers": round(meters / 1000.0, 2),
            "text": f"{round(meters / 1000.0, 2)} km"
        }
    return {
        "meters": round(meters, 1),
        "kilometers": round(meters / 1000.0, 2),
        "text": f"{int(round(meters))} m"
    }

def format_duration(seconds: float) -> Dict[str, Any]:
    """Format seconds into human-readable duration."""
    total_sec = int(round(seconds))
    hours = total_sec // 3600
    minutes = (total_sec % 3600) // 60
    sec = total_sec % 60

    if hours > 0:
        text = f"{hours}h {minutes}m"
    elif minutes > 0:
        text = f"{minutes}m {sec}s" if sec > 0 else f"{minutes}m"
    else:
        text = f"{sec}s"

    return {
        "seconds": round(seconds, 1),
        "minutes": round(seconds / 60.0, 1),
        "hours": round(seconds / 3600.0, 2),
        "text": text
    }

def interpolate_points(coords: List[List[float]], num_points_per_segment: int = 4) -> List[List[float]]:
    """
    Given a list of [lat, lon] coordinates, linearly interpolate between them
    to provide smooth simulation steps.
    """
    if not coords or len(coords) < 2:
        return coords

    interpolated = []
    for i in range(len(coords) - 1):
        p1 = coords[i]
        p2 = coords[i + 1]
        for step in range(num_points_per_segment):
            fraction = step / float(num_points_per_segment)
            lat = p1[0] + (p2[0] - p1[0]) * fraction
            lon = p1[1] + (p2[1] - p1[1]) * fraction
            interpolated.append([round(lat, 6), round(lon, 6)])
    interpolated.append(coords[-1])
    return interpolated
