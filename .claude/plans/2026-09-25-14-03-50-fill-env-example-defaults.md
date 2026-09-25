# Plan: fill default values in `.env.example`

- Classification: feature
- Description: Put the local-dev defaults into the `.env.example` files, so a plain copy works without edits.

## Approach

| App | Key | Value |
|---|---|---|
| server | `PY_SERVICE_URL` | `http://localhost:8000` |
| server, client, py-service | `OPENOBSERVE_URL` | `http://localhost:5080` |
| server, client, py-service | `OPENOBSERVE_PASSWORD` | `ChangeMe123!` |

- Keep the comments. Change each "Leave empty to turn off…" line so it says the value is a local default and that you can clear it to turn the feature off.
- These keys stay empty on purpose: `MAIL_USER`, `MAIL_PASSWORD`, `CORS_ALLOWED_HEADERS`, `CORS_MAX_AGE`, `COOKIE_SECRET`, `REDIS_PASSWORD`.

## Files in scope

- Modify: `apps/server/.env.example`, `apps/client/.env.example`, `apps/py-service/.env.example`

## Risks

- `ChangeMe123!` becomes a committed value. This is the same as `ZO_ROOT_USER_PASSWORD`, which is already committed. Local use only.
- If someone copies `.env.example` to a VM without editing it, the server checks py-service at `localhost:8000`, which fails there, so `/health` returns 503. Right now an empty value skips that check. The comments will say to change these values for Docker and the VM.

## Task list

| # | Status | Task | Role | Acceptance criteria |
|---|---|---|---|---|
| 1 | DONE | Set the values above and update their comments | developer | Values are set. Other keys are unchanged. Comments match the new values. |
