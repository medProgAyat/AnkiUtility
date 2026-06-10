from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# ext
db = SQLAlchemy()


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    migrate = Migrate(app, db)
    app.config.from_mapping(
        SECRET_KEY="dev",
        SQLALCHEMY_DATABASE_URI=f"sqlite:///./anki.db",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    db.init_app(app)

    # register API blueprint
    try:
        from .api import bp as api_bp
        app.register_blueprint(api_bp, url_prefix="/api")
    except Exception:
        pass

    # enable CORS for dev
    try:
        from flask_cors import CORS

        CORS(app)
    except Exception:
        pass

    @app.route("/health")
    def health():
        return {"status": "ok"}

    return app
