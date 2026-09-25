# Plan: read `PY_SERVICE_URL` from the env file under Compose

- Classification: feature
- Description: Remove the fixed `PY_SERVICE_URL` from `docker-compose.yml` so the server reads it from `apps/server/.env.<APP_ENV>`.

## Approach

- Delete `PY_SERVICE_URL: http://py-service:8000` from the server's `environment:` block in `docker-compose.yml`.
- Change the `.env.example` comment and the README row back to this meaning: "Under Docker Compose, set this to `http://py-service:8000` in the env file, not `localhost`. Leave it empty to skip the check."

## Files in scope

- Modify: `docker-compose.yml`, `apps/server/.env.example` (comment only), `apps/server/README.md`

## Risks

- On the VM, `apps/server/.env.<APP_ENV>` must have `PY_SERVICE_URL=http://py-service:8000`, or the `pyService` check is skipped. You add this by hand.

## Task list

| # | Status | Task | Role | Acceptance criteria |
|---|---|---|---|---|
| 1 | DONE | Remove the compose line and update the `.env.example` comment and README row as above | developer | `docker-compose.yml` has no `PY_SERVICE_URL`. The docs say to set it in the env file for Compose. |

There is no tester task, because this only changes config and docs.
