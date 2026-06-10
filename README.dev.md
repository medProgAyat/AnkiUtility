Development notes

Backend (development):
- Create virtualenv and install:
  python -m venv .venv
  source .venv/bin/activate
  pip install -r backend/requirements.txt

- Initialize DB (creates default project/deck/template):
  python backend/create_db.py

- Run dev server (port 5001):
  python backend/run.py

Frontend (development):
- Install and run Vite dev server:
  cd frontend
  npm ci
  npm run dev

- Vite proxies /api and /health to the backend on http://localhost:5001
- Open UI at http://localhost:5173

Testing:
- Backend tests:
  (in project root)
  python -m venv .venv
  source .venv/bin/activate
  pip install -r backend/requirements.txt
  pytest -q backend

- Frontend tests:
  cd frontend
  npm ci
  npm test

Quick flow:
- Start backend, initialize DB
- Start frontend, open http://localhost:5173
- Use Project toolbar to create/select a project, then create decks/templates and cards, preview and export
