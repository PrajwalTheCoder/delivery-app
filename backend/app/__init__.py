from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.database.db import init_db, SessionLocal
from app.api import register_blueprints

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend Vite app (http://localhost:5173, etc.)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize SQLite database schema
    with app.app_context():
        init_db()

    # Register blueprints under /api/v1
    register_blueprints(app)

    # Clean session teardown
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        SessionLocal.remove()

    # Structured error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            "error": "Bad Request",
            "message": str(error.description if hasattr(error, "description") else error),
            "status_code": 400
        }), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Not Found",
            "message": "The requested resource was not found on this server.",
            "status_code": 404
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "error": "Internal Server Error",
            "message": "An unexpected error occurred while processing the request.",
            "status_code": 500
        }), 500

    return app
