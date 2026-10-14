import os
from app import create_app
from app.config import Config

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", Config.PORT))
    host = os.environ.get("HOST", Config.HOST)
    print(f"[*] RouteWise AI Backend Server running at http://{host}:{port}/api/v1")
    app.run(host=host, port=port, debug=False)
