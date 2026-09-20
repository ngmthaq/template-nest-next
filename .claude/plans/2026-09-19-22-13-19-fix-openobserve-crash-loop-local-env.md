# Title: Plan — Fix OpenObserve crash loop (local env)

- Classification: bug
- Description: Add the 8 missing OpenObserve keys to `apps/server/.env.development`, then restart the container and verify it stays up.

---

## Approach Summary / Goal

- **Root cause:** `docker-compose-infra.yml` loads `apps/server/.env.<NODE_ENV>` into the `openobserve` service. The OpenObserve change added `ZO_ROOT_USER_EMAIL` / `ZO_ROOT_USER_PASSWORD` to `.env.example`, but your gitignored `.env.development` never got them. OpenObserve panics at startup without them (`src/jobs/src/job/mod.rs:348`), and `restart: unless-stopped` loops.
- **Fix:** Copy the OpenObserve block from `.env.example` (lines 127–151, with its comments) into `.env.development`, using the example root login and turning log shipping on to `http://localhost:5080`.
- **Goal:** The container becomes `healthy`, and dev server logs land in the `default/server` stream.

## Functional Requirements

- `.env.development` has: `OPENOBSERVE_PORT=5080`, `ZO_ROOT_USER_EMAIL=admin@example.com`, `ZO_ROOT_USER_PASSWORD=ChangeMe123!`, `OPENOBSERVE_URL=http://localhost:5080`, `OPENOBSERVE_ORG=default`, `OPENOBSERVE_STREAM=server`, `OPENOBSERVE_USER=admin@example.com`, `OPENOBSERVE_PASSWORD=ChangeMe123!`.
- After `docker compose -f docker-compose-infra.yml up -d openobserve`, the container is `healthy` and its logs no longer show the panic.
- A log ingest with the root login returns HTTP 200.

## Non-Functional Requirements

- Only the OpenObserve block is added; no other line in `.env.development` changes.
- The file stays gitignored — credentials are never committed.

## Files in Scope

- `apps/server/.env.development` (modify — local, gitignored)

## Risks & Assumptions

- **No regression test.** You chose "only local env file", so no code changes and nothing to unit-test. The tester task is a runtime check instead.
- **The gap can come back** for anyone whose local env file is older than the example (no guard in the repo).
- **Keeping the existing volume** is assumed safe: migrations finished (schema v77) and no user was created. If the root user is still missing after restart, the fallback is `docker compose -f docker-compose-infra.yml down` + `docker volume rm template-nest-next-infra_openobserve-data` (only empty OpenObserve data is lost).
- The restart only touches the `openobserve` service; MySQL and Redis are not recreated.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute

## Task List

| #   | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | ------ | ---- | ---------------- | ------------ | ------------------- | ------ |
| 1   | DONE   | Add the OpenObserve block from `apps/server/.env.example` (lines 127–151, same comments and order) to `apps/server/.env.development` with the values above. | developer | none | All 8 keys present once in `.env.development`; `diff` of key names vs `.env.example` shows no missing keys. | `clean-code` |
| 2   | DONE   | Run `NODE_ENV=development docker compose -f docker-compose-infra.yml up -d openobserve`, wait for healthy, check logs, and POST one test record to `http://localhost:5080/api/default/server/_json` with basic auth. | tester | task 1 | `docker inspect` shows `healthy`; no `panicked` in logs since restart; ingest returns 200. | — |
