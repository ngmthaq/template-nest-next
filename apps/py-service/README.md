# py-service

A small [FastAPI](https://fastapi.tiangolo.com) service. pnpm manages its Python setup, so it
lives in the same workspace as `server` and `client` and uses the same `pnpm <app> <script>`
commands.

## Setup

Python support is experimental in pnpm. It is turned on in the root `pnpm-workspace.yaml`
(`python.enabled: true`). Run `pnpm install` from the repo root:

```bash
pnpm install
```

This creates `apps/py-service/.venv` (a link into the pnpm store) and downloads Python
3.13.15 if it is not on your machine yet. You do not need Python installed yourself.

The app has no build step. `app/` is a plain Python package that runs with
`uvicorn app.main:app`.

## Scripts

Run any script with `pnpm py-service <script>` from the repo root, or `pnpm <script>` from
inside `apps/py-service`.

| Script         | What it does                                                          |
| -------------- | ---------------------------------------------------------------------- |
| `start:dev`    | Runs the app with `APP_ENV=development` and auto-reload on port 8000.   |
| `start:debug`  | Same as `start:dev`, but waits for a debugger on `127.0.0.1:5678` (VS Code "Attach"). |
| `start:staging`| Runs the app with `APP_ENV=staging`, reading host/port from settings.   |
| `start:prod`   | Runs the app with `APP_ENV=production`, reading host/port from settings.|
| `lint`         | Fixes lint issues with `ruff check --fix .`.                           |
| `lint:check`   | Checks lint issues with `ruff check .`. No changes.                    |
| `format`       | Formats code with `ruff format .`.                                     |
| `format:check` | Checks formatting with `ruff format --check .`. No changes.            |
| `typecheck`    | Runs `mypy` in strict mode.                                             |
| `test`         | Runs `pytest`. Tests sit next to the source file (`test_*.py`).        |

## Lint-staged

`.lintstagedrc.json` runs `ruff check --fix` and `ruff format` on staged `.py` files when you
commit, the same way `server`/`client` lint their own staged files.

## Environment

The start scripts, Docker Compose, and the Dockerfile all set `APP_ENV` from outside the app.
It picks which `.env.<APP_ENV>` file Settings loads (default `development` when unset). Copy
the example file to make your own:

```bash
cp .env.example .env.development
```

| Key    | Default     | What it does                                                       |
| ------ | ----------- | -------------------------------------------------------------------- |
| `HOST` | `127.0.0.1` | Address the server binds to. Set to `0.0.0.0` in Docker/production so it accepts outside connections. |
| `PORT` | `8000`      | HTTP server port.                                                   |

`start:dev` and `start:debug` always use `uvicorn`'s own default (port 8000) and do not read
`HOST`/`PORT`. `start:staging` and `start:prod` run `python -m app`, which reads both from
settings.

## Docker

`Dockerfile` builds from the **repo root**:

```bash
docker build -f apps/py-service/Dockerfile -t py-service .
```

It has two stages:

1. A `node:24-slim` stage installs the Python dependencies through pnpm (`--prod`, so dev
   tools like `ruff`/`mypy`/`pytest`/`debugpy` are left out), then copies the venv's
   `site-packages` out to a plain layer.
2. A `python:3.13-slim` runtime stage copies that `site-packages` folder and the `app/` code.
   It runs as a non-root user and has no Node.js or pnpm.

`docker-compose.yml` at the repo root has a `py-service` service in the same style as
`server`/`client` (`PY_SERVICE_PORT`, default `8000`). See the root `README.md` for the full
Docker commands.

`scripts/02_deploy_docker_vm.sh` (`pnpm deploy:vm`) deploys `py-service` to a VM the same way
as `server`/`client`: it checks `apps/py-service/.env.<NODE_ENV>`, asks for its published host
port, and builds, starts, and retags its image alongside the other two.

## pnpm quirks

Two small workarounds keep the Python setup working with this pnpm version:

- **`cross-env`**: pnpm 12.6.0 does not write a full lockfile entry for a project with zero
  npm dependencies. Adding `cross-env` as a devDependency (already used by other apps) fixes
  this, and the scripts above use it to set `APP_ENV` on every OS.
- **`supportedArchitectures`**: the default `pylock.toml` only covers the machine that created
  it. The root `pnpm-workspace.yaml` sets `supportedArchitectures` to `darwin-arm64`,
  `linux-x64-manylinux_2_28`, and `linux-arm64-manylinux_2_28`, so the lockfile also covers CI
  (linux-x64) and the Docker build (linux-arm64 on Apple Silicon, or linux-x64 elsewhere).
