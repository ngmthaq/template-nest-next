# Title: Plan — Self-hosted OpenObserve for server and client logs

- Classification: feature
- Description: Add an OpenObserve container to the infra compose file, and make both apps push their logs to it over HTTP when `OPENOBSERVE_*` env vars are set.

---

## Approach Summary / Goal

- Add an `openobserve` service to `docker-compose-infra.yml`, so `pnpm infra` starts MySQL, Redis, and OpenObserve together.
- Server: add Winston's built-in `transports.Http` (batch mode) to `CoreWinstonModule`, sending to OpenObserve's `_json` ingest API. No new package.
- Client: `logUtils` also sends logs to OpenObserve, but only on the Next server side (never from the browser). It sends in batches, in the background, and never throws.
- Goal: search logs from both apps in the OpenObserve UI (`http://localhost:5080`), in org `default`, streams `server` and `client`.

## Functional Requirements

- `docker-compose-infra.yml` has an `openobserve` service: pinned image tag, port `${OPENOBSERVE_PORT:-5080}:5080`, named volume `openobserve-data`, health check, root user from `ZO_ROOT_USER_EMAIL` / `ZO_ROOT_USER_PASSWORD` in `apps/server/.env.<env>`.
- `scripts/01_run_docker_infra.sh` reads `OPENOBSERVE_PORT` (default `5080`) from the env file, passes it to compose (local and remote), and shows it in the summary and status output.
- Server sends logs only when `OPENOBSERVE_URL` is set. Env keys: `OPENOBSERVE_URL`, `OPENOBSERVE_ORG` (default `default`), `OPENOBSERVE_STREAM` (default `server`), `OPENOBSERVE_USER`, `OPENOBSERVE_PASSWORD`. Console logging stays as it is.
- Each server log entry is JSON with timestamp, level, message, context, and `service: "server"` + environment name.
- Client (Next server side) sends logs only when `OPENOBSERVE_URL` is set and `typeof window === 'undefined'`. Same env keys, stream default `client`, `service: "client"`. Only logs that pass `LOG_LEVEL` are sent.
- A failed send (OpenObserve down, wrong password) never crashes the app and never causes a log loop.
- `.env.example` files in both apps and both READMEs describe the new keys and how to open the UI.

## Non-Functional Requirements

- Security: the password is never sent to the browser (no `NEXT_PUBLIC_` keys). No log endpoint is open to the browser. No real secrets in `.env.example`.
- Speed: sending is batched and does not block requests.
- Code follows current patterns (`configuration.ts` for server config, `logUtils` class for client).

## Files in Scope

- `docker-compose-infra.yml` (modify)
- `scripts/01_run_docker_infra.sh` (modify)
- `apps/server/.env.example` (modify)
- `apps/server/src/core/config/configuration.ts` (modify)
- `apps/server/src/core/winston/core-winston.module.ts` (modify; may add a small helper file in `apps/server/src/core/winston/lib/`)
- `apps/server/src/core/winston/**/*.spec.ts` (create)
- `apps/client/.env.example` (modify)
- `apps/client/src/utils/logUtils.ts` (modify)
- `apps/client/src/utils/logUtils.spec.ts` (modify)
- `apps/server/README.md`, `apps/client/README.md` (modify — docs sections)

## Risks & Assumptions

- Assumption: apps use the root user's email/password for sending (your choice). Anyone with the app env file can then log into OpenObserve as admin. You can switch to a separate user later without code changes.
- Risk: `docker-compose-infra.yml` and `docker-compose.yml` are separate projects. When apps run in Docker, `OPENOBSERVE_URL` must use the host (e.g. `http://host.docker.internal:5080` or the VM IP), not `localhost`. The README will say so.
- Risk: the `env_file` of the infra compose passes the whole server env file into the OpenObserve container too (same as MySQL/Redis today). Not new, but noted.
- Assumption: the developer checks and pins a real OpenObserve image tag (no `latest`).
- Logs are lost if OpenObserve is down (no retry queue). Console logs still work.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute
- [ ] Blocked — requires user input on: —

## Task List

| #   | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | ------ | ---- | ---------------- | ------------ | ------------------- | ------ |
| 1   | DONE | Add `openobserve` service + volume to `docker-compose-infra.yml`; add `ZO_ROOT_USER_EMAIL`, `ZO_ROOT_USER_PASSWORD`, `OPENOBSERVE_PORT` to `apps/server/.env.example` | developer | none | `docker compose -f docker-compose-infra.yml config` passes; pinned tag; health check; port from `OPENOBSERVE_PORT` | `clean-code` |
| 2   | DONE | Update `scripts/01_run_docker_infra.sh` to read, pass, and show `OPENOBSERVE_PORT` (local + remote) | developer | 1 | `bash -n` passes; summary shows port; remote command exports it; header/status mention OpenObserve | `clean-code` |
| 3   | DONE | Server: add `log.openobserve` config in `configuration.ts`; add batched Http transport in `CoreWinstonModule` when URL is set; add `OPENOBSERVE_*` keys to `.env.example` | developer | none | No transport when URL empty; transport targets `/api/{org}/{stream}/_json` with basic auth; `pnpm server lint:check`, `typecheck`, `build` pass | `clean-code`, `security-scanner` |
| 4   | DONE | Client: extend `LogUtils` to batch-send server-side logs to OpenObserve when URL is set; add keys to `.env.example` | developer | none | Never sends in browser; errors swallowed, no loop; respects `LOG_LEVEL`; `pnpm client lint:check`, `typecheck`, `build` pass | `clean-code`, `security-scanner` |
| 5   | DONE | Docs: OpenObserve section in `apps/server/README.md` (start, UI URL, login, Docker host note) and env keys in `apps/client/README.md` | developer | 1–4 | Steps match the real keys and ports | — |
| 6   | DONE | Server unit tests for the Winston setup (transport on/off, URL/auth/meta) | tester | 3 | `pnpm server test` passes | `aaa-testing` |
| 7   | DONE | Client unit tests in `logUtils.spec.ts` (sends on server side, not in browser, level filter, fetch failure is safe) | tester | 4 | `pnpm client test` passes | `aaa-testing` |
