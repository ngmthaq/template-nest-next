# Title: Plan — Add a Python FastAPI microservice (apps/py-service) managed by pnpm

- Classification: feature
- Description: Add `apps/py-service`, a FastAPI app whose Python dependencies are managed by pnpm's Python support. It comes with lint, type, and test tooling, Docker, and CI.

---

## Approach Summary / Goal

- Turn on `python.enabled` in `pnpm-workspace.yaml`. The app folder holds a `pyproject.toml` (Python deps and `pylock.toml`) next to a small `package.json` (name `@template-nest-next/py-service` plus scripts). The pnpm docs say a Python project that sits next to an npm project is selected together with it. This means `pnpm py-service <script>` and `--filter` work the same way as for `server` and `client`.
- The app has no `[build-system]`. The code lives in an `app/` package at the project root and runs with `uvicorn app.main:app`. This way no Python build backend needs approval in `allowBuilds`.
- The layout is feature-based, like the server: `app/core/config.py` (pydantic-settings) and `app/feature/health/`. Tests sit next to the source files.
- Docker: a builder stage on `node:24-slim` runs `pnpm install --filter` for this app. A `python:3.13-slim` runtime stage then copies only the `site-packages` folder out of the venv. This avoids copying the `.venv` symlink into the pnpm store.
- Goal: `pnpm install` sets up Python 3.13 and all deps. `pnpm py-service dev` serves `GET /health`. Lint, typecheck, test, and the Docker build all pass locally and in both CI files.

## Functional Requirements

- `pnpm-workspace.yaml` has `python: { enabled: true }`, and `pnpm install` at the root creates `apps/py-service/.venv` and `apps/py-service/pylock.toml`.
- `apps/py-service/.python-version` is `3.13`, and `requires-python = ">=3.13,<3.14"`.
- Runtime deps: `fastapi`, `uvicorn[standard]`, `pydantic-settings`. Dev deps: `ruff`, `mypy`, `pytest`, `httpx`. All are added with `pnpm add pypi:…` and are exact pins.
- `package.json` scripts: `dev` (uvicorn with reload), `start`, `lint`, `lint:check`, `format`, `format:check`, `typecheck` (mypy strict), `test`, `test:cov` (only if `pytest-cov` is added).
- Root `package.json` gets `"py-service": "pnpm --filter @template-nest-next/py-service"`.
- Settings come from `.env.${APP_ENV}` (default `development`) with `PORT` (default 8000) and `APP_ENV`. A committed `.env.example` lists the keys only.
- `GET /health` returns `200 {"status": "ok"}`.
- `apps/py-service/Dockerfile` builds from the repo root and runs as a non-root user on port 8000. `docker-compose.yml` gets a `py-service` service in the same style as `server` (image tag, `env_file`, `${PY_SERVICE_PORT:-8000}:8000`).
- `.gitlab/ci.yml` and `.github/workflows/ci.yml` both get lint (`ruff check` + `ruff format --check`), typecheck (`mypy`), and test (`pytest`) jobs for py-service, and stay in sync.

## Non-Functional Requirements

- No new npm dependencies. `allowBuilds` does not change.
- `.gitignore` and `.dockerignore` ignore `.venv`, `__pycache__`, `.mypy_cache`, `.pytest_cache`, and `.ruff_cache`.
- `mypy --strict` passes. Ruff uses a clear rule set (`E, F, I, B, UP, S`) that includes the security rules, to match the ESLint security setup.
- The Docker runtime image has no Node or pnpm, only Python and the installed packages.

## Files in Scope

- Modify: `pnpm-workspace.yaml`, `package.json` (root), `pnpm-lock.yaml` (only if pnpm rewrites it), `.gitignore`, `.dockerignore`, `docker-compose.yml`, `.gitlab/ci.yml`, `.github/workflows/ci.yml`, `README.md`, `.claude/references/PROJECT_OVERVIEW.md`
- Create in `apps/py-service/`: `package.json`, `pyproject.toml`, `pylock.toml`, `.python-version`, `.env.example`, `Dockerfile`, `README.md`, `app/__init__.py`, `app/main.py`, `app/core/__init__.py`, `app/core/config.py`, `app/feature/__init__.py`, `app/feature/health/__init__.py`, `app/feature/health/router.py`
- Create (tester): `app/feature/health/test_router.py`, `app/core/test_config.py`

## Risks & Assumptions

- **Risk:** pnpm's Python support is **experimental**. Its settings and layout may change in a later pnpm version.
- **Risk:** The docs do not say clearly where `pnpm run` reads scripts from for a Python project. We assume the colocated `package.json` works. If it does not, the developer stops and reports back.
- **Risk:** CI runs on linux-x64 and Docker on your Mac builds linux-arm64. `pylock.toml` must cover those platforms. `supportedArchitectures` may be needed, but it also affects npm optional deps (more binaries in `node_modules`). The developer first checks whether the lockfile already covers the platforms, and adds the setting only if needed.
- **Risk:** On a clean CI runner, pnpm downloads Python 3.13, which adds some time to each job. This is acceptable.
- **Assumption:** The Docker approach (copy `site-packages` into `python:3.13-slim`) works because both images are Debian/glibc. The developer proves this with a real `docker build` and a `curl /health`.
- **Out of scope:** calling the service from NestJS, lint-staged/pre-commit hooks for Python files, the `02_deploy_docker_vm.sh` changes, and database or Redis access from Python.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute
- [ ] Blocked — requires user input on: —

## Task List

| #   | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | ------ | ---- | ---------------- | ------------ | ------------------- | ------ |
| 1 | DONE | Enable pnpm Python and scaffold `apps/py-service`: workspace setting, `package.json`, `pyproject.toml` (+ ruff/mypy/pytest config), `.python-version`, deps via `pnpm add pypi:…`, root script, ignore files | developer | none | `pnpm install` makes `.venv` + `pylock.toml`. `pnpm py-service exec python --version` shows 3.13.x. A second `pnpm install --frozen-lockfile` leaves the tree unchanged | `clean-code` |
| 2 | DONE | Write the app: `app/main.py`, `app/core/config.py` (pydantic-settings, `.env.${APP_ENV}`), `app/feature/health/router.py`, `.env.example` | developer | task 1 | `pnpm py-service dev` serves `GET /health` → `200 {"status":"ok"}`. `lint:check`, `format:check`, and `typecheck` pass | `clean-code`, `security-scanner` |
| 3 | DONE | Add tests next to the source: `/health` via FastAPI `TestClient`, and settings defaults + env override | tester | task 2 | `pnpm py-service test` passes. Tests follow AAA. At least one test fails if the health route or the default port changes | `aaa-testing` |
| 4 | DONE | Add `apps/py-service/Dockerfile` (node builder → python slim runtime, non-root) and the `py-service` service in `docker-compose.yml` | developer | task 2 | `docker build -f apps/py-service/Dockerfile .` works. The container answers `GET /health` with 200. `docker compose config` is valid | `clean-code`, `security-scanner` |
| 5 | DONE | Add py-service lint/typecheck/test jobs to `.gitlab/ci.yml` and `.github/workflows/ci.yml` (kept in sync) | developer | task 3 | Both YAML files parse. Every new job command runs green locally after a clean `pnpm install --frozen-lockfile` | `clean-code` |
| 6 | DONE | Write docs: `apps/py-service/README.md` (setup, scripts, env, Docker), and update the root `README.md` tree/scripts and `PROJECT_OVERVIEW.md` | developer | tasks 1–5 | The docs list the real script names and ports and follow WRITING_STYLE | — |

## Amendments (user decisions after round 1)

- **Blocker 1 (pnpm 12.6.0 writes no `pnpm-lock.yaml` importer for a project with zero npm deps, so `--frozen-lockfile` fails repo-wide):** add `cross-env` as a devDependency of `apps/py-service/package.json` (already in the lockfile from the server) and use it in scripts that set `APP_ENV`. This is a small, approved exception to "No new npm dependencies".
- **Blocker 2 (`pylock.toml` has only macOS arm64 wheels):** add `supportedArchitectures` to `pnpm-workspace.yaml` for darwin-arm64, linux-x64 (manylinux), and linux-arm64 (manylinux). Accepted side effect: npm optional binaries for these platforms are also installed.
- **Task 7 (added by user, approved):** in `apps/py-service/package.json`, replace `dev`/`start` with `start:dev` (`cross-env APP_ENV=development uvicorn … --reload`), `start:debug` (`cross-env APP_ENV=development python -m debugpy --listen 127.0.0.1:5678 -m uvicorn app.main:app --reload`), `start:staging` (`cross-env APP_ENV=staging python -m app`), `start:prod` (`cross-env APP_ENV=production python -m app`). Add `debugpy` as a pinned dev dependency via `pnpm add -D pypi:debugpy@<version>`. Docs use the new names. Role: developer. Depends on R1. Acceptance: each script starts and `/health` returns 200 (temp `.env.*` for staging/prod, deleted after); `start:debug` listens on 127.0.0.1:5678; no `dev`/`start` left; `pylock.toml` locks debugpy for all 3 platforms; `pnpm install --frozen-lockfile` stays clean; docs name only the new scripts.
- **Review R2 (developer):** enable `plugins = ["pydantic.mypy"]` in `[tool.mypy]` and remove the 5 `# type: ignore[call-arg]` in `app/core/test_config.py`.
- **Final status:** tasks 1–7, R1, and R2 are DONE. Review accepted on 2026-09-24.
