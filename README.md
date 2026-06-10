# AnkiUtility

AnkiUtility is a full-stack flashcard editor and exporter that simplifies creating, editing and exporting Anki decks.

Key features
- Visual CSV import with column mapping and editable import table
- Inline card table editor (CRUD) with soft-delete, undo and permanent delete
- Template editor (HTML + CSS) with live split preview
- Export as JSON or .apkg (Anki package) using genanki
- Project, deck and template management
- Multi-language UI (English, Persian/Farsi, Arabic) with automatic RTL layout for rtl locales
- Toasts anchored to action buttons with undo and progress

Tech stack
- Backend: Flask + Flask-SQLAlchemy + Flask-Migrate (SQLite by default)
- Frontend: Vite + React, CodeMirror for template editing
- Tests: pytest for backend, Vitest + Testing Library for frontend

Project structure (top-level)
- backend/ — Flask app, models, API blueprints, migrations
- frontend/ — Vite React app, components, i18n, tests
- README.md — this file

Quickstart (development)
Prereqs: Python 3.10+, Node 18+, npm or yarn

Backend
1. cd backend
2. python -m venv .venv
3. source .venv/bin/activate   # on Windows: .venv\Scripts\activate
4. pip install -r requirements.txt
5. export FLASK_APP=app             # Windows PowerShell: $env:FLASK_APP = 'app'
6. flask db upgrade                # applies bundled migrations and creates sqlite DB (anki.db)
7. flask run --port 5000           # or: gunicorn -w 1 "app:create_app()"

Environment
- The app uses SQLite by default at backend/anki.db. To override, set SQLALCHEMY_DATABASE_URI in instance config or environment before starting Flask.

Frontend
1. cd frontend
2. npm install
3. npm run dev        # starts Vite dev server (usually http://localhost:5173)
4. npm test           # run frontend unit tests (vitest)

Running full app
- Start backend (port 5000) and frontend (port 5173). The frontend calls backend APIs under /api (CORS enabled for dev).

Database & migrations
- Flask-Migrate is configured. If you change models:
  flask db migrate -m "msg"
  flask db upgrade

API overview (important endpoints)
- GET /api/cards?project_id=:id — list (non-deleted) cards
- POST /api/cards — create card { fields, tags, deck_id?, template_id? }
- PUT /api/cards/:id — update card
- DELETE /api/cards/:id — soft-delete card
- POST /api/cards/batch-delete — batch soft-delete { ids: [...] }
- POST /api/cards/restore — restore soft-deleted { ids: [...] }
- POST /api/cards/permanent-delete — permanently delete { ids: [...] }

- GET /api/templates — list templates
- POST /api/templates — create template
- PUT /api/templates/:id — update template

- POST /api/imports/upload — upload CSV (server parses and returns columns/sample)
- POST /api/imports/apply — apply mapped rows to create cards (accepts mapped_rows or mapping)

- POST /api/export/json — export selected cards as JSON
- POST /api/export/apkg — export a project or selected card IDs as .apkg (Anki package)

- POST /api/preview — render preview for a template+fields (used by live preview)

I18n & RTL behavior
- UI strings live in frontend/src/i18n.js. Supported locales: en, fa, ar.
- Changing the locale updates document.documentElement.dir to 'ltr' or 'rtl'.
- Code editors (HTML/CSS) are explicitly forced to LTR so code remains readable in RTL locales.

Testing
- Backend: cd backend && pytest
- Frontend: cd frontend && npm test

Notes & troubleshooting
- Tests run in jsdom. The frontend's i18n module guards access to window.localStorage to avoid jsdom errors.
- Vite may emit an ExperimentalWarning about localStorage when running tests with newer Node; that's informational only.
- If export .apkg fails, verify genanki is installed and writable /tmp is available (export path is /tmp by default).

Contributing
- Please keep changes focused and add tests when possible. Run linters/tests before opening PRs.

License
- MIT (add your preferred license file)

If you want, I can also:
- Add a one-command dev script to start backend+frontend together
- Add Docker compose for easier local setup
- Add more API docs or OpenAPI specification

Enjoy AnkiUtility — tell me if you'd like a short start-up checklist or a demo walkthrough.
