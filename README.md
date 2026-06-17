<!-- Persian Translation Badge -->
[![README فارسی](https://img.shields.io/badge/📖_README-فارسی-0066cc?style=for-the-badge&logo=googletranslate&logoColor=white)](README_fa.md)

<h1 align="center">
  <img src="https://raw.githubusercontent.com/nicehash/awesome-anki/main/assets/anki-logo.svg" height="38" alt="Anki logo" /> AnkiUtility
</h1>
<p align="center">
  <em>Full‑stack flashcard editor & exporter for Anki decks</em>
  <br/>
  <strong>Create · Edit · Preview · Export</strong>
</p>

<p align="center">
  <!-- Tech stack badges -->
  <img src="https://img.shields.io/badge/Backend-Flask-000000?logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/DB-SQLite-003B57?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Tests-Pytest-0A9EDC?logo=pytest&logoColor=white" alt="Pytest" />
  <img src="https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License MIT" />
  <img src="https://wakatime.com/badge/user/e7c61e6b-1a47-4384-8cd8-77721e48dccf/project/be7cdcf6-7046-43d2-b791-b8cbffcbc569.svg)](https://wakatime.com/badge/user/e7c61e6b-1a47-4384-8cd8-77721e48dccf/project/be7cdcf6-7046-43d2-b791-b8cbffcbc569"/>
</p>

---

## 📋 Table of Contents

- [📸 Screenshots](#-screenshots)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quickstart](#-quickstart)
- [Database & Migrations](#-database--migrations)
- [API Overview](#-api-overview)
- [I18n & RTL](#-i18n--rtl)
- [Testing](#-testing)
- [Notes & Troubleshooting](#-notes--troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📸 Screenshots

<div align="center">
  <img src="./screenshots/Screenshot%201405-03-21%20at%2002.27.42.png" alt="Main interface" width="80%" style="border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
  <p><em>Main interface: card table editor & CSV import preview</em></p>
  
  <img src="./screenshots/Screenshot%201405-03-21%20at%2002.28.48.png" alt="Template editor" width="80%" style="border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
  <p><em>Template editor with live split preview</em></p>
</div>

---

## 🚀 Key Features

| Feature | Description |
|---------|-------------|
| 📥 **Visual CSV Import** | Upload CSV, map columns, and review data in an editable import table before creating cards |
| ✏️ **Inline Card Editor** | Full CRUD with soft‑delete, undo and permanent delete – all from a spreadsheet‑like interface |
| 🎨 **Template Editor** | HTML + CSS editor (CodeMirror) with a live, split‑screen preview of your card |
| 📦 **Flexible Export** | Export selected cards as JSON or as a ready‑to‑use `.apkg` Anki package (`genanki`) |
| 🗂️ **Project Management** | Organise work by projects, decks and templates |
| 🌍 **Multi‑language UI** | English, فارسی (Persian/Farsi), العربية (Arabic) – automatic RTL layout for right‑to‑left locales |
| 🔔 **Smart Toasts** | Action‑anchored notifications with undo support and progress indication |

---

## 🛠️ Tech Stack

**Backend**  
`Flask` · `Flask‑SQLAlchemy` · `Flask‑Migrate` (SQLite by default)

**Frontend**  
`Vite` · `React` · `CodeMirror` (template editing) · `i18n` with dynamic RTL

**Testing**  
`pytest` (backend) · `Vitest` + `Testing Library` (frontend)

---

## 📁 Project Structure (top‑level)

```
.
├── backend/            Flask app, models, API blueprints, migrations
├── frontend/           Vite React app, components, i18n, tests
└── README.md
```

---

## ⚡ Quickstart (development)

**Prerequisites**  
Python 3.10+, Node 18+, npm or yarn

### 🔧 Backend

```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set Flask app entry point
export FLASK_APP=app             # Windows PowerShell: $env:FLASK_APP = 'app'

# Run migrations (creates SQLite DB at backend/anki.db)
flask db upgrade

# Start server
flask run --port 5000            # or: gunicorn -w 1 "app:create_app()"
```

> **Environment**  
> The app uses SQLite by default. To override, set `SQLALCHEMY_DATABASE_URI` in the instance config or as an environment variable before starting Flask.

### 🖥️ Frontend

```bash
cd frontend

npm install          # Install packages
npm run dev          # Vite dev server → usually http://localhost:5173
npm test             # Run frontend unit tests (Vitest)
```

### 🔗 Running Full App

Start both servers. The frontend (port 5173) calls backend APIs at `/api` (CORS is enabled for development).

---

## 🗄️ Database & Migrations

Flask‑Migrate is configured. After changing models:

```bash
flask db migrate -m "Your message"
flask db upgrade
```

---

## 🌐 API Overview (important endpoints)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cards?project_id=:id` | GET | List non‑deleted cards for a project |
| `/api/cards` | POST | Create card `{ fields, tags, deck_id?, template_id? }` |
| `/api/cards/:id` | PUT | Update card |
| `/api/cards/:id` | DELETE | Soft‑delete card |
| `/api/cards/batch-delete` | POST | Batch soft‑delete `{ ids: [...] }` |
| `/api/cards/restore` | POST | Restore soft‑deleted `{ ids: [...] }` |
| `/api/cards/permanent-delete` | POST | Permanently delete `{ ids: [...] }` |
| `/api/templates` | GET | List all templates |
| `/api/templates` | POST | Create template |
| `/api/templates/:id` | PUT | Update template |
| `/api/imports/upload` | POST | Upload CSV → returns columns & sample rows |
| `/api/imports/apply` | POST | Apply mapped rows to create cards |
| `/api/imports/apkg` | POST | Import a .apkg Anki package – extracts decks, templates, cards. Accepts `file` (multipart) and optional `project_id`. Returns `created_cards`, `created_templates`, `created_decks`, `sample` |
| `/api/export/json` | POST | Export selected cards as JSON |
| `/api/export/apkg` | POST | Export project/card IDs as `.apkg` Anki package |
| `/api/preview` | POST | Render live preview for a template + fields |

- **.apkg import** works by reading `collection.anki2` from the uploaded file. If the internal database schema differs or is missing, the endpoint returns an error. Duplicates on repeated imports may create new decks/templates (no deduping yet). Extracted temporary files are cleaned up from `/tmp` after import. use:

```bash
curl -F "file=@/path/to/file.apkg" -F "project_id=1" http://localhost:5000/api/imports/apkg
```

---

## 🌍 I18n & RTL Behaviour

- UI strings are in `frontend/src/i18n.js`. Supported locales: `en`, `fa`, `ar`.
- Switching locale sets `document.documentElement.dir` to `ltr` or `rtl` automatically.
- Code editors (HTML/CSS) are **always LTR** so code stays readable even in RTL locales.

---

## 🧪 Testing

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

- Frontend tests run in `jsdom`. The i18n module guards `window.localStorage` access to avoid jsdom errors.
- Vite may show an `ExperimentalWarning` about `localStorage` with newer Node – this is harmless.

---

## 🔧 Notes & Troubleshooting

- The SQLite database is created at `backend/anki.db` after the first migration.
- If `.apkg` export fails, ensure `genanki` is installed and `/tmp` is writable (default export path).
- For custom export paths, adjust the export endpoint or set an environment variable.
- The backend automatically creates default templates and a demo project on first run to help you start quickly.

---

## 🤝 Contributing

Keep changes focused and add tests where possible. Run linters and the full test suite before opening a pull request.

---

## 📄 License

This project is licensed under the **MIT License** – see the `LICENSE` file for details.

---

<p align="center">
  <sub>Enjoy AnkiUtility — drop a ⭐ if you find it useful!</sub>
</p>
