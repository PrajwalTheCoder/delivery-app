import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"
    PORT = int(os.getenv("PORT", "5000"))
    HOST = os.getenv("HOST", "127.0.0.1")
    
    # SQLite default database path
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'routewise.db'}")
    
    # Routing engines
    OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")
    NOMINATIM_BASE_URL = os.getenv("NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org")
    USER_AGENT = os.getenv("USER_AGENT", "RouteWiseAI-AcademicDemo/1.0 (academic-project; contact: student@college.edu)")
    
    # Geocoding provider abstraction: "nominatim", "geoapify", "locationiq"
    GEOCODING_PROVIDER = os.getenv("GEOCODING_PROVIDER", "nominatim")
    GEOCODING_API_KEY = os.getenv("GEOCODING_API_KEY", "")
    GEOAPIFY_API_KEY = os.getenv("GEOAPIFY_API_KEY", os.getenv("GEOCODING_API_KEY", ""))
    LOCATIONIQ_API_KEY = os.getenv("LOCATIONIQ_API_KEY", "")
    
    # Max stops for exact TSP (held-karp)
    MAX_EXACT_STOPS = int(os.getenv("MAX_EXACT_STOPS", "9"))
    
    # Default average speed in km/h for fallback road estimations
    FALLBACK_SPEED_KMH = float(os.getenv("FALLBACK_SPEED_KMH", "30.0"))
