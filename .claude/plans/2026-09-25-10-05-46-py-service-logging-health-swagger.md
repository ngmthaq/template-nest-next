# Title: Plan — py-service logging, health indicator, and Swagger

- Classification: feature
- Description: py-service sends its logs to OpenObserve through a batching `httpx2` logging handler and serves Swagger at `/swagger`. The server's `/health` checks py-service and validates the response with class-validator.

---

## Approach Summary / Goal

- **Logging:** add `app/core/logging.py` with an `OpenObserveHandler` (a subclass of `logging.Handler`). It keeps records in a buffer. It POSTs them as one batch to `{url}/api/{org}/{stream}/_json` when 20 records are waiting or every 5 seconds, from a background thread. It uses the same batch sizes as the server. The project already swapped `httpx` for `httpx2`, so "httpx handler" means moving `httpx2` from dev dependencies to runtime dependencies.
- **Health:** the server uses the global `HttpService` to call `{PY_SERVICE_URL}/health` with a short timeout. `plainToInstance` + `validate` check the body against a `PyServiceHealthDto`. A network error or an invalid body gives `pyService: {status:'down', error}`, and then `/health` returns 503. If `PY_SERVICE_URL` is empty, the indicator is left out.
- **Swagger:** FastAPI gets a title, description, and version. The docs move to `/swagger` (UI) and `/swagger-json` (OpenAPI). ReDoc is turned off. All docs are turned off when `APP_ENV=production`, the same as on the server.
- Goal: all three apps report and document py-service the same way the server already does.

## Functional Requirements

- py-service: when `OPENOBSERVE_URL` is set, app logs and uvicorn logs (access and error) go to OpenObserve stream `py-service` (the default). When it is empty, logs only go to the console.
- py-service: a failed log POST never crashes the app and never blocks a request. Logs still in the buffer are sent on shutdown.
- py-service: new settings `log_level`, `openobserve_url`, `openobserve_org` (default `default`), `openobserve_stream` (default `py-service`), `openobserve_user`, `openobserve_password`.
- py-service: `GET /swagger` and `GET /swagger-json` return 200 outside production. Both return 404 in production. `/docs` and `/redoc` return 404.
- Server: the new config key is `pyService.url`, read from `PY_SERVICE_URL`.
- Server: `/health` has `info.pyService` only when the URL is set. It is `up` only when the call succeeds and the body passes the `PyServiceHealthDto` checks (`status` must be `'ok'`). If it is `down`, `/health` returns 503.
- Server: the Swagger example and summary for `/health` mention py-service.
- Client: the health page shows the label from the new `health.indicatorsPyService` key (en + zh) for the `pyService` row.

## Non-Functional Requirements

- Security: the OpenObserve password is never logged. py-service call errors return only a short message, never the response body.
- Speed: the py-service check uses a 3000 ms timeout, so a hung service reports `down` fast (the same as MySQL and Redis).
- py-service `ruff`, `mypy --strict`, and `pytest` pass. Server lint, typecheck, and test pass. Client lint, typecheck, test, and build pass.

## Files in Scope

- py-service — modify: `pyproject.toml`, `pylock.toml` (move `httpx2` to runtime deps through pnpm), `app/core/config.py`, `app/main.py`, `.env.example`, `README.md`
- py-service — create: `app/core/logging.py`, `app/core/test_logging.py`, `app/test_main.py`
- py-service — modify tests: `app/core/test_config.py`
- Server — modify: `src/core/config/configuration.ts`, `src/feature/health/health.service.ts`, `src/feature/health/health.controller.ts` (summary text), `.env.example`, `README.md`
- Server — create: `src/feature/health/dto/py-service-health.dto.ts` (+ `.spec.ts`)
- Server — modify tests: `health.service.spec.ts`, `health.module.spec.ts` (if the new `HttpService` dependency breaks it)
- Client — modify: `src/libs/next-intl/messages/en.json`, `zh.json`, `health/_components/HealthStatusPanel/index.tsx` (+ `index.spec.tsx`)

## Risks & Assumptions

- **Assumption:** `httpx2` is used as the HTTP client for the handler, because the project replaced `httpx` with it. If `httpx2` cannot be a runtime dependency, the developer stops and reports.
- **Assumption:** the indicator key is `pyService` (camelCase, like the other keys). The docs path `/swagger` matches the server.
- **Assumption:** logs are sent as JSON objects with `_timestamp`, `level`, `message`, `logger`, and `exc_info` (when present).
- **Risk:** under Docker Compose, the server needs `PY_SERVICE_URL=http://py-service:8000`, not `localhost`. This goes into the `.env.example` comment and the README. Env files that are not in git (VM, local) must be updated by hand.
- **Risk:** the background thread in the handler needs a clean stop. The handler flushes and closes in the FastAPI lifespan shutdown.

## Open Questions / Blockers

- none

## Status

- [x] Ready to execute
- [ ] Blocked — requires user input on: —

## Task List

| #   | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | ------ | ---- | ---------------- | ------------ | ------------------- | ------ |
| 1   | DONE   | py-service: move `httpx2` to runtime deps (pnpm, regenerate `pylock.toml`). Add log + OpenObserve settings to `config.py`. Create `app/core/logging.py` (`OpenObserveHandler` + `setup_logging(settings)`) and hook it into `create_app` with a lifespan that flushes and closes on shutdown. Update `.env.example` and `README.md`. | developer | none | Logs reach `/api/{org}/{stream}/_json` with basic auth when the URL is set. Nothing is sent when the URL is empty. Send errors are swallowed. Lint, format, typecheck, and test pass. | `clean-code` |
| 2   | DONE   | py-service: set up Swagger in `create_app` (title, description, version, `docs_url="/swagger"`, `openapi_url="/swagger-json"`, `redoc_url=None`; all `None` in production). Update `README.md`. | developer | task 1 (same files) | `/swagger` and `/swagger-json` return 200 in development and 404 in production. `/docs` returns 404. Checks pass. | `clean-code` |
| 3   | DONE   | Server: add `pyService.url` to `configuration.ts`. Create `PyServiceHealthDto` (class-validator, `@IsIn(['ok'])` status). Add `checkPyService()` to `HealthService` using `HttpService` + `firstValueFrom` (3000 ms timeout) + `plainToInstance`/`validate`. Skip it when there is no URL. Update the Swagger example and summary, `.env.example`, and `README.md`. | developer | none | `/health` shows `pyService` up/down as described. An invalid body gives `down`. No URL gives no key. Lint, typecheck, and build pass. | `clean-code` |
| 4   | DONE   | Client: add `indicatorsPyService` to `en.json` and `zh.json`. Map `pyService` in `HealthStatusPanel`. | developer | none | The row shows the translated label. Client lint, typecheck, and build pass. | `clean-code` |
| 5   | DONE   | py-service tests: `test_logging.py` (batch by count, flush on close, skip when no URL, swallow send errors — mock the httpx2 client), new settings in `test_config.py`, `test_main.py` (Swagger routes in dev vs prod). | tester | tasks 1, 2 | All new tests pass in AAA style. `pnpm py-service test` is green. | `aaa-testing` |
| 6   | DONE   | Server tests: `py-service-health.dto.spec.ts` (valid/invalid bodies), `health.service.spec.ts` (up, network error, invalid body, no URL → no key, overall `error`). Fix `health.module.spec.ts` if needed. | tester | task 3 | `pnpm server test` is green. The new branches are covered. | `aaa-testing` |
| 7   | DONE   | Client test: `HealthStatusPanel/index.spec.tsx` shows the py-service label. | tester | task 4 | `pnpm client test` is green. | `aaa-testing` |
