# Backend (Flask) quickstart

1. Create a virtualenv and install dependencies:
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt

2. Run the app (development):
   python run.py

## Endpoints

- GET /health — healthcheck
- GET /api/cards — placeholder list endpoint

When implementing: use Flask app factory in app/__init__.py, SQLAlchemy models in app/models.py, and add the API blueprints in app/api/.
