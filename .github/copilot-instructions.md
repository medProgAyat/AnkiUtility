# Copilot instructions for AnkiUtility

Purpose
- Small utility to help create Anki cards/notes (from README).

Repository snapshot (detected)
- README.md, LICENSE, .gitignore. No source, tests, CI, or packaging files found.

Build / test / lint
- No build, test, or lint commands detected in the repo.
- When tests are added, recommended single-test commands for Python projects Copilot may suggest:
  - Run full suite: pytest
  - Run a single test: pytest path/to/test_file.py::test_name or pytest -k "name_substring"
- When linters/formatters are added (e.g., ruff/flake8/black), use their standard CLI (e.g., ruff check . or black .).

High-level architecture (current)
- No source code found. Expect a small CLI or library that constructs Anki notes and interacts with Anki package formats or AnkiConnect.
- Typical layout to follow when adding code (helps future Copilot sessions find things):
  - src/<package_name>/  — library code
  - tests/               — pytest tests
  - docs/ or README.md   — usage examples and CLI invocation
  - CLI entrypoint (if present): src/<pkg>/cli.py or use a console_scripts entrypoint in pyproject/setup.cfg

Key conventions and pointers for Copilot sessions
- Search paths: when code appears, prefer these locations in order: src/, tests/, README.md for usage, and any top-level scripts.
- Tests: assume pytest if test files appear (tests/ and files named test_*.py).
- Packaging: if pyproject.toml appears later, prefer PEP 517 tooling (python -m build / pip install -e .).
- External integrations: look for AnkiConnect usage (HTTP on localhost:8765) or .apkg handling; prioritize those files when suggesting changes.

Other AI assistant configs checked
- No CLAUDE.md, .cursorrules, .cursor/rules/, AGENTS.md, .windsurfrules, CONVENTIONS.md, or existing .github/copilot-instructions.md were found.

Notes for future authors
- If adding CI or tests, update this file with exact commands (test runner, lint command, single-test invocation) and any repository-specific conventions (naming, module layout, environment variables).

---
Created by Copilot CLI analysis. If you'd like, I can update this when source or tests are added to include concrete build/test/lint commands and any repo-specific conventions.