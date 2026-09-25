# Title: Plan — Stricter tests for invalid py-service bodies, and PY_SERVICE_URL in Compose

- Classification: feature
- Description: Make the non-object body tests check the exact error message, and set `PY_SERVICE_URL` for the server in Docker Compose.

---

## Approach Summary / Goal

- In `health.service.spec.ts`, the `null` and string body tests will check the exact message `Invalid py-service health response`. A new array body test does the same. This stops the raw `TypeError` text from coming back.
- In `docker-compose.yml`, add `PY_SERVICE_URL: http://py-service:8000` to the server's `environment:` block. The server then reaches py-service by its service name under Compose, and on the VM.
- Update the server README and `.env.example` comment to say Compose sets this value already.

## Functional Requirements

- The `null`, string, and array body tests check `{ status: 'down', error: 'Invalid py-service health response' }`.
- `docker compose config` shows `PY_SERVICE_URL=http://py-service:8000` for the server.

## Non-Functional Requirements

- No production code changes in `health.service.ts`. All server tests pass.

## Files in Scope

- Modify: `apps/server/src/feature/health/health.service.spec.ts`
- Modify: `docker-compose.yml`, `apps/server/README.md`, `apps/server/.env.example` (comment only)

## Risks & Assumptions

- **Assumption:** `environment:` wins over `env_file`, so a `PY_SERVICE_URL` in a VM env file is replaced under Compose. This matches how `PORT` is handled.
- There are no local env files to update.

## Open Questions / Blockers

- none

## Status

- [x] Ready to execute

## Task List

| # | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
|---|---|---|---|---|---|---|
| 1 | DONE | Add `PY_SERVICE_URL: http://py-service:8000` to the server `environment:` in `docker-compose.yml`. Update the README row and the `.env.example` comment to say Compose sets it. | developer | none | `docker compose config` shows the value for the server. Docs match. | `clean-code` |
| 2 | DONE | Tighten the null and string body tests, and add an array body test. Each checks the exact `Invalid py-service health response` error. | tester | none | `pnpm server test` is green. The 3 tests check the exact message. | `aaa-testing` |
