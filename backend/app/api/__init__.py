from flask import Blueprint
from app.api.health import health_bp
from app.api.deliveries import deliveries_bp
from app.api.routes import routes_bp
from app.api.algorithms import algorithms_bp
from app.api.analytics import analytics_bp
from app.api.geocode import geocode_bp
from app.api.settings import settings_bp
from app.api.food import food_bp

def register_blueprints(app):
    api_v1 = Blueprint("api_v1", __name__, url_prefix="/api/v1")
    api_v1.register_blueprint(health_bp)
    api_v1.register_blueprint(deliveries_bp)
    api_v1.register_blueprint(routes_bp)
    api_v1.register_blueprint(algorithms_bp)
    api_v1.register_blueprint(analytics_bp)
    api_v1.register_blueprint(geocode_bp)
    api_v1.register_blueprint(settings_bp)
    api_v1.register_blueprint(food_bp)
    app.register_blueprint(api_v1)
