import requests
import time
from typing import List, Dict, Any, Optional
from app.config import Config

# In-memory LRU cache for geocoding queries
GEOCODE_CACHE: Dict[str, List[Dict[str, Any]]] = {}
REVERSE_CACHE: Dict[str, Dict[str, Any]] = {}

# Rate limit timestamp tracking
LAST_NOMINATIM_REQUEST_TIME = 0.0

# Curated demonstration and fallback locations for Navi Mumbai (the recommended PBL demo region)
# and Mumbai Metropolitan Region with verified real coordinates
PRESET_DEMO_LOCATIONS: List[Dict[str, Any]] = [
    # Navi Mumbai Hub & Delivery Locations (Recommended Demonstration Region)
    {
        "id": "nm-depot-kharghar",
        "display_name": "RouteWise Central Depot — Sector 12, Kharghar, Navi Mumbai 410210",
        "address": "Central Distribution Hub, Sector 12, Kharghar, Navi Mumbai, Maharashtra 410210",
        "latitude": 19.0434,
        "longitude": 73.0683,
        "type": "warehouse",
        "locality": "Kharghar",
        "city": "Navi Mumbai",
        "pincode": "410210",
        "confidence": "high"
    },
    {
        "id": "nm-stop-1-utsav-chowk",
        "display_name": "Utsav Chowk, Sector 7, Kharghar, Navi Mumbai 410210",
        "address": "Utsav Chowk Circle, Sector 7, Kharghar, Navi Mumbai, Maharashtra 410210",
        "latitude": 19.0345,
        "longitude": 73.0678,
        "type": "destination",
        "locality": "Kharghar",
        "city": "Navi Mumbai",
        "pincode": "410210",
        "confidence": "high"
    },
    {
        "id": "nm-stop-2-vashi-sector17",
        "display_name": "Sector 17 Commercial Complex, Vashi, Navi Mumbai 400703",
        "address": "Vashi Plaza, Sector 17, Vashi, Navi Mumbai, Maharashtra 400703",
        "latitude": 19.0760,
        "longitude": 72.9986,
        "type": "destination",
        "locality": "Vashi",
        "city": "Navi Mumbai",
        "pincode": "400703",
        "confidence": "high"
    },
    {
        "id": "nm-stop-3-cbd-belapur",
        "display_name": "CBD Belapur Station Complex, Sector 11, CBD Belapur, Navi Mumbai 400614",
        "address": "Station Commercial Complex, Sector 11, CBD Belapur, Navi Mumbai 400614",
        "latitude": 19.0183,
        "longitude": 73.0392,
        "type": "destination",
        "locality": "CBD Belapur",
        "city": "Navi Mumbai",
        "pincode": "400614",
        "confidence": "high"
    },
    {
        "id": "nm-stop-4-seawoods-grand-central",
        "display_name": "Seawoods Grand Central Mall, Sector 40, Seawoods, Navi Mumbai 400706",
        "address": "Railway Station Complex, Sector 40, Seawoods West, Navi Mumbai 400706",
        "latitude": 19.0219,
        "longitude": 73.0182,
        "type": "destination",
        "locality": "Seawoods",
        "city": "Navi Mumbai",
        "pincode": "400706",
        "confidence": "high"
    },
    {
        "id": "nm-stop-5-nerul-gymkhana",
        "display_name": "Nerul Gymkhana & Sports Club, Sector 28, Nerul, Navi Mumbai 400706",
        "address": "Sector 28, Nerul West, Navi Mumbai, Maharashtra 400706",
        "latitude": 19.0330,
        "longitude": 73.0135,
        "type": "destination",
        "locality": "Nerul",
        "city": "Navi Mumbai",
        "pincode": "400706",
        "confidence": "high"
    },
    {
        "id": "nm-stop-6-kopar-khairane",
        "display_name": "Kopar Khairane D-Mart, Sector 15, Kopar Khairane, Navi Mumbai 400709",
        "address": "Sector 15, Kopar Khairane, Navi Mumbai, Maharashtra 400709",
        "latitude": 19.0987,
        "longitude": 73.0076,
        "type": "destination",
        "locality": "Kopar Khairane",
        "city": "Navi Mumbai",
        "pincode": "400709",
        "confidence": "high"
    },
    {
        "id": "nm-stop-7-airoli-mindspace",
        "display_name": "Mindspace SEZ, Sector 8, Airoli, Navi Mumbai 400708",
        "address": "Thane-Belapur Road, Sector 8, Airoli, Navi Mumbai, Maharashtra 400708",
        "latitude": 19.1601,
        "longitude": 72.9972,
        "type": "destination",
        "locality": "Airoli",
        "city": "Navi Mumbai",
        "pincode": "400708",
        "confidence": "high"
    },
    {
        "id": "nm-stop-8-panvel-station",
        "display_name": "Panvel Railway Station Road, Old Panvel, Navi Mumbai 410206",
        "address": "Station Road, Old Panvel, Navi Mumbai, Maharashtra 410206",
        "latitude": 18.9902,
        "longitude": 73.1175,
        "type": "destination",
        "locality": "Panvel",
        "city": "Navi Mumbai",
        "pincode": "410206",
        "confidence": "high"
    },
    # Mumbai Central Hubs
    {
        "id": "mumbai-bkc-hub",
        "display_name": "Bandra Kurla Complex (BKC), G Block, Bandra East, Mumbai 400051",
        "address": "G Block BKC, Bandra East, Mumbai, Maharashtra 400051",
        "latitude": 19.0657,
        "longitude": 72.8687,
        "type": "destination",
        "locality": "BKC",
        "city": "Mumbai",
        "pincode": "400051",
        "confidence": "high"
    },
    {
        "id": "mumbai-andheri-hub",
        "display_name": "Andheri East Logistics Hub, Chakala, Andheri East, Mumbai 400093",
        "address": "Western Express Hwy, Chakala, Andheri East, Mumbai 400093",
        "latitude": 19.1136,
        "longitude": 72.8697,
        "type": "warehouse",
        "locality": "Andheri East",
        "city": "Mumbai",
        "pincode": "400093",
        "confidence": "high"
    },
    {
        "id": "mumbai-powai-plaza",
        "display_name": "Hiranandani Gardens, Central Avenue, Powai, Mumbai 400076",
        "address": "Central Ave, Hiranandani Gardens, Powai, Mumbai 400076",
        "latitude": 19.1176,
        "longitude": 72.9060,
        "type": "destination",
        "locality": "Powai",
        "city": "Mumbai",
        "pincode": "400076",
        "confidence": "high"
    }
]

class GeocodingService:
    @staticmethod
    def search(query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        User-triggered address search with provider abstraction:
        Supports:
        - Geoapify (if GEOCODING_PROVIDER=geoapify and GEOAPIFY_API_KEY set)
        - LocationIQ (if GEOCODING_PROVIDER=locationiq and LOCATIONIQ_API_KEY set)
        - Nominatim (OpenStreetMap, rate-limited with User-Agent)
        - Curated Navi Mumbai & MMR presets for reliable offline college presentations
        """
        if not query or len(query.strip()) < 2:
            return []

        clean_query = query.strip()
        cache_key = f"search_{clean_query.lower()}_{limit}"
        if cache_key in GEOCODE_CACHE:
            return GEOCODE_CACHE[cache_key]

        results: List[Dict[str, Any]] = []

        # 1. Try Geoapify if configured
        if Config.GEOCODING_PROVIDER == "geoapify" and Config.GEOAPIFY_API_KEY:
            results = GeocodingService._query_geoapify(clean_query, limit)

        # 2. Try LocationIQ if configured
        elif Config.GEOCODING_PROVIDER == "locationiq" and Config.LOCATIONIQ_API_KEY:
            results = GeocodingService._query_locationiq(clean_query, limit)

        # 3. Default to OpenStreetMap Nominatim with respectful rate limiting
        if not results:
            results = GeocodingService._query_nominatim(clean_query, limit)

        # 4. Fallback matching against curated Indian demonstration dataset
        if not results:
            results = GeocodingService._search_presets(clean_query)

        # Validate coordinates: -90 <= lat <= 90, -180 <= lon <= 180
        valid_results = []
        for r in results:
            try:
                lat = float(r["latitude"])
                lon = float(r["longitude"])
                if -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0:
                    r["latitude"] = lat
                    r["longitude"] = lon
                    valid_results.append(r)
            except (ValueError, TypeError):
                continue

        GEOCODE_CACHE[cache_key] = valid_results
        return valid_results

    @staticmethod
    def _query_geoapify(query: str, limit: int) -> List[Dict[str, Any]]:
        try:
            url = "https://api.geoapify.com/v1/geocode/search"
            params = {
                "text": query,
                "apiKey": Config.GEOAPIFY_API_KEY,
                "limit": limit,
                "country": "in"
            }
            resp = requests.get(url, params=params, timeout=4.0)
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                out = []
                for f in features:
                    props = f.get("properties", {})
                    coords = f.get("geometry", {}).get("coordinates", [])
                    if len(coords) >= 2:
                        out.append({
                            "id": props.get("place_id", f"geoapify-{len(out)}"),
                            "display_name": props.get("formatted", query),
                            "address": props.get("formatted", query),
                            "latitude": float(coords[1]),
                            "longitude": float(coords[0]),
                            "type": props.get("result_type", "address"),
                            "confidence": "verified" if props.get("rank", {}).get("confidence", 0) > 0.8 else "medium",
                            "locality": props.get("suburb") or props.get("district", ""),
                            "city": props.get("city", "Navi Mumbai"),
                            "pincode": props.get("postcode", "")
                        })
                return out
        except Exception:
            pass
        return []

    @staticmethod
    def _query_locationiq(query: str, limit: int) -> List[Dict[str, Any]]:
        try:
            url = "https://us1.locationiq.com/v1/search"
            params = {
                "key": Config.LOCATIONIQ_API_KEY,
                "q": query,
                "format": "json",
                "limit": limit,
                "countrycodes": "in"
            }
            resp = requests.get(url, params=params, timeout=4.0)
            if resp.status_code == 200:
                data = resp.json()
                out = []
                for idx, item in enumerate(data):
                    out.append({
                        "id": str(item.get("place_id", f"loc-iq-{idx}")),
                        "display_name": item.get("display_name", query),
                        "address": item.get("display_name", query),
                        "latitude": float(item.get("lat")),
                        "longitude": float(item.get("lon")),
                        "type": item.get("type", "address"),
                        "confidence": "verified",
                        "city": "Navi Mumbai"
                    })
                return out
        except Exception:
            pass
        return []

    @staticmethod
    def _query_nominatim(query: str, limit: int) -> List[Dict[str, Any]]:
        global LAST_NOMINATIM_REQUEST_TIME
        # Throttle to max 1 request per second for Nominatim policy
        now = time.time()
        elapsed = now - LAST_NOMINATIM_REQUEST_TIME
        if elapsed < 1.0:
            time.sleep(1.0 - elapsed)
        LAST_NOMINATIM_REQUEST_TIME = time.time()

        headers = {
            "User-Agent": Config.USER_AGENT,
            "Accept": "application/json"
        }
        params = {
            "q": query,
            "format": "jsonv2",
            "addressdetails": 1,
            "limit": limit,
            "countrycodes": "in"
        }

        try:
            url = f"{Config.NOMINATIM_BASE_URL.rstrip('/')}/search"
            response = requests.get(url, params=params, headers=headers, timeout=4.5)
            if response.status_code == 200:
                data = response.json()
                results = []
                for idx, item in enumerate(data):
                    addr_details = item.get("address", {})
                    pincode = addr_details.get("postcode", "")
                    city = addr_details.get("city") or addr_details.get("state_district") or "Navi Mumbai"
                    locality = addr_details.get("suburb") or addr_details.get("neighbourhood") or ""

                    results.append({
                        "id": str(item.get("place_id", f"geo-{idx}")),
                        "display_name": item.get("display_name", ""),
                        "address": item.get("name") or item.get("display_name", ""),
                        "latitude": float(item.get("lat")),
                        "longitude": float(item.get("lon")),
                        "type": item.get("type", "address"),
                        "confidence": "high" if float(item.get("importance", 0.0)) > 0.4 else "medium",
                        "locality": locality,
                        "city": city,
                        "pincode": pincode
                    })
                return results
        except Exception:
            pass
        return []

    @staticmethod
    def _search_presets(query: str) -> List[Dict[str, Any]]:
        q_lower = query.lower()
        matched = []
        for loc in PRESET_DEMO_LOCATIONS:
            if (q_lower in loc["display_name"].lower() or
                q_lower in loc["address"].lower() or
                q_lower in loc.get("locality", "").lower() or
                q_lower in loc.get("pincode", "")):
                matched.append(loc)

        if not matched:
            # Check for city or region keywords
            for key in ["kharghar", "vashi", "belapur", "nerul", "panvel", "seawoods", "mumbai", "airoli"]:
                if key in q_lower:
                    matched = [loc for loc in PRESET_DEMO_LOCATIONS if key in loc["display_name"].lower()]
                    break

        return matched

    @staticmethod
    def reverse(latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        """Converts latitude and longitude into human-readable Indian street address."""
        if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
            return None

        cache_key = f"{round(latitude, 5)},{round(longitude, 5)}"
        if cache_key in REVERSE_CACHE:
            return REVERSE_CACHE[cache_key]

        # Check proximity to known presets first (within 80m)
        for loc in PRESET_DEMO_LOCATIONS:
            d_lat = abs(loc["latitude"] - latitude)
            d_lon = abs(loc["longitude"] - longitude)
            if d_lat < 0.001 and d_lon < 0.001:
                REVERSE_CACHE[cache_key] = loc
                return loc

        # Try Nominatim reverse
        headers = {"User-Agent": Config.USER_AGENT, "Accept": "application/json"}
        params = {"lat": latitude, "lon": longitude, "format": "jsonv2", "zoom": 18}

        try:
            url = f"{Config.NOMINATIM_BASE_URL.rstrip('/')}/reverse"
            resp = requests.get(url, params=params, headers=headers, timeout=4.0)
            if resp.status_code == 200:
                data = resp.json()
                item = {
                    "id": str(data.get("place_id", cache_key)),
                    "display_name": data.get("display_name", f"Pin ({round(latitude, 4)}, {round(longitude, 4)})"),
                    "address": data.get("display_name", ""),
                    "latitude": latitude,
                    "longitude": longitude,
                    "type": "reversed",
                    "confidence": "verified"
                }
                REVERSE_CACHE[cache_key] = item
                return item
        except Exception:
            pass

        fallback = {
            "id": cache_key,
            "display_name": f"Location ({round(latitude, 4)}, {round(longitude, 4)})",
            "address": f"Lat: {round(latitude, 4)}, Lon: {round(longitude, 4)}",
            "latitude": latitude,
            "longitude": longitude,
            "type": "map_pin",
            "confidence": "approximate"
        }
        REVERSE_CACHE[cache_key] = fallback
        return fallback

# Global convenience functions for backwards compatibility
def search_address(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    return GeocodingService.search(query, limit)

def reverse_geocode(latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
    return GeocodingService.reverse(latitude, longitude)
