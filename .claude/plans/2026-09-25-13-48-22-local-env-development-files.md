# Plan: create local `.env.development` files

- Classification: feature
- Description: Create `.env.development` for server, client, and py-service from each `.env.example`, with values for running the apps on the host.

## Approach

- Copy each app's `.env.example` to `.env.development` and keep the comments. Then change only these values:

| App | Key | Value |
|---|---|---|
| server | `PY_SERVICE_URL` | `http://localhost:8000` |
| server | `OPENOBSERVE_URL` | `http://localhost:5080` |
| server | `OPENOBSERVE_PASSWORD` | `ChangeMe123!` (same as `ZO_ROOT_USER_PASSWORD`) |
| client | `OPENOBSERVE_URL` | `http://localhost:5080` |
| client | `OPENOBSERVE_PASSWORD` | `ChangeMe123!` |
| py-service | `OPENOBSERVE_URL` | `http://localhost:5080` |
| py-service | `OPENOBSERVE_PASSWORD` | `ChangeMe123!` |

- All other values stay as they are in `.env.example`. Those are already local defaults: `localhost` MySQL and Redis, `API_URL=http://localhost:3000`, `HOST=127.0.0.1`, and so on.
- `.env.example` files: no change, because they already have every key.

## Files in scope

- Create: `apps/server/.env.development`, `apps/client/.env.development`, `apps/py-service/.env.development` (all git-ignored)

## Risks

- The OpenObserve password is the example default. It's fine for local dev only. Never use it on the VM.
- If OpenObserve already stored its data with a different root password, log shipping fails auth. Change the value in the file if so.

## Task list

| # | Status | Task | Role | Acceptance criteria |
|---|---|---|---|---|
| 1 | DONE | Create the three `.env.development` files as above | developer | Each file has the same keys as its `.env.example`, with the values above. `git status` shows no new tracked files. |

There is no tester task, because these are only local config files.
