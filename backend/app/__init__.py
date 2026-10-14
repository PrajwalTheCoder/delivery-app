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

    import os
    from flask import send_file, render_template_string

    @app.route("/")
    @app.route("/download")
    def download_page():
        return render_template_string("""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RouteWise - Download Android App</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
                body {
                    background: #0f1015;
                    color: #fff;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    text-align: center;
                }
                .card {
                    background: #171923;
                    border: 1px solid #2d3748;
                    border-radius: 24px;
                    padding: 36px 28px;
                    max-width: 440px;
                    width: 100%;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                }
                .logo {
                    width: 88px;
                    height: 88px;
                    border-radius: 22px;
                    background: linear-gradient(135deg, #FC8019, #E23744);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 42px;
                    margin: 0 auto 20px;
                    box-shadow: 0 10px 25px rgba(252, 128, 25, 0.4);
                }
                h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; letter-spacing: -0.5px; }
                .badge {
                    display: inline-block;
                    background: rgba(46, 204, 113, 0.15);
                    color: #2ecc71;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 4px 12px;
                    border-radius: 20px;
                    margin-bottom: 18px;
                    border: 1px solid rgba(46, 204, 113, 0.3);
                }
                p { color: #a0aec0; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
                .btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    background: linear-gradient(135deg, #FC8019, #FF5252);
                    color: #fff;
                    text-decoration: none;
                    font-weight: 700;
                    font-size: 16px;
                    padding: 16px 24px;
                    border-radius: 16px;
                    box-shadow: 0 8px 24px rgba(252, 128, 25, 0.4);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .btn:active { transform: scale(0.98); }
                .steps {
                    margin-top: 28px;
                    text-align: left;
                    background: #11131a;
                    padding: 16px;
                    border-radius: 14px;
                    border: 1px solid #222634;
                }
                .steps h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #718096; margin-bottom: 10px; }
                .steps ol { padding-left: 20px; color: #cbd5e0; font-size: 12px; line-height: 1.8; }
                .steps li span { color: #FC8019; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="logo">🛵</div>
                <h1>RouteWise</h1>
                <div class="badge">⚡ Real Time Engine • Live GPS</div>
                <p>Real-time delivery route simulation & live GPS tracking for Customer, Kitchen, and Rider.</p>
                
                <a href="/download/RouteWise.apk" class="btn">
                    <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Download RouteWise APK
                </a>

                <div class="steps">
                    <h3>Quick 3-Step Install</h3>
                    <ol>
                        <li>Tap <span>Download RouteWise APK</span> above.</li>
                        <li>Open the file & tap <span>Install</span> (allow install if prompted).</li>
                        <li>Open the app & select your role: <span>Customer, Rider, or Kitchen</span>!</li>
                    </ol>
                </div>
            </div>
        </body>
        </html>
        """)

    @app.route("/download/RouteWise.apk")
    def serve_apk():
        apk_candidates = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "RouteWise_RealTimeEngine.apk")),
            os.path.abspath(os.path.join("C:\\src\\delivery_mobile", "build", "app", "outputs", "flutter-apk", "app-debug.apk")),
        ]
        for path in apk_candidates:
            if os.path.exists(path):
                return send_file(path, as_attachment=True, download_name="RouteWise.apk", mimetype="application/vnd.android.package-archive")
        return jsonify({"error": "APK not found on server"}), 404

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
