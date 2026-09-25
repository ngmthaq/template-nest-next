# Title: Plan — Log every incoming request on the server

- Classification: feature
- Description: Add a NestJS class middleware that writes one Winston log line per request when the response finishes, and apply it to every route in `AppModule`.

---

## Approach Summary / Goal

- Create `RequestLoggerMiddleware` in `apps/server/src/shared/middlewares/`, next to the existing `guards/` and `pipes/` folders. It uses `new Logger(RequestLoggerMiddleware.name)`, so logs go through the global Winston logger, including OpenObserve.
- The middleware notes the start time, then listens for the response `finish` event. On `finish` it writes one line with the method, URL, status, duration, IP, and user agent.
- `AppModule` implements `NestModule` and applies the middleware to all routes with `forRoutes('{*splat}')`. This is the NestJS 11 wildcard, and it avoids the old `'*'` deprecation warning.
- Goal: every HTTP request shows up in the logs, including 404s and requests that guards or the throttler block.

## Functional Requirements

- Every HTTP request writes exactly one log line when the response finishes. No path is skipped.
- The line contains: method, original URL (with query string), status code, duration in ms, client IP, and user agent.
- The level depends on the status: below 400 → `log` (info), 400–499 → `warn`, 500 and up → `error`.
- The request body and headers are never logged (the user agent is the only exception).
- Example message: `GET /health 200 12ms - ::1 "Mozilla/5.0 …"`.

## Non-Functional Requirements

- Performance: no extra work before the response. Only a timestamp and one event listener per request.
- Security: no body, no cookies, no `Authorization` header in the logs.
- Style: follows `CODING_CONVENTIONS.md` (JSDoc, `public`/`private` on members, kebab-case file name, AAA tests).
- `pnpm server lint`, `pnpm server typecheck`, and `pnpm server test` pass.

## Files in Scope

- Create: `apps/server/src/shared/middlewares/request-logger.middleware.ts`
- Create: `apps/server/src/shared/middlewares/request-logger.middleware.spec.ts`
- Modify: `apps/server/src/app.module.ts` (implement `NestModule`, add `configure()`)
- Modify: `apps/server/src/app.module.spec.ts` (only if needed for the new `configure()`)

## Risks & Assumptions

- Assumption: the new folder is `shared/middlewares/` (plural, like `guards/` and `pipes/`).
- Assumption: the message is a single string (see the example above). No separate structured JSON fields. In production Winston still wraps it as JSON with a timestamp and a context.
- Risk: the full URL includes the query string. Today no route takes secrets in the query (only `cache` uses `?pattern=`). If a future route puts a token in the query, it will be logged.
- Risk: the app does not set Express `trust proxy`. Behind a reverse proxy, the IP will be the proxy's IP, not the real client's. This plan does not change that.
- Risk: if a client disconnects before the response is sent, `finish` never fires, so that request is not logged.
- WebSocket (Socket.IO) traffic is not HTTP middleware traffic, so it is not logged. Only the first HTTP handshake may be logged.

## Open Questions / Blockers

- none

## Status

- [x] Ready to execute
- [ ] Blocked — requires user input on: —

## Task List

| #   | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | ------ | ---- | ---------------- | ------------ | ------------------- | ------ |
| 1 | DONE | Create `shared/middlewares/request-logger.middleware.ts`: an `@Injectable()` `RequestLoggerMiddleware implements NestMiddleware`. It uses `new Logger(RequestLoggerMiddleware.name)`, records the start time, and on `res.on('finish')` logs `METHOD originalUrl STATUS DURATIONms - IP "USER_AGENT"` at `log`/`warn`/`error` by status | developer | none | One line per request. Levels map correctly (<400 log, 4xx warn, ≥500 error). No body or headers logged except user agent. Has JSDoc. Lint and typecheck pass | `clean-code`, `security-scanner` |
| 2 | DONE | In `app.module.ts`, make `AppModule` implement `NestModule` and add `public configure(consumer: MiddlewareConsumer)` that applies `RequestLoggerMiddleware` with `forRoutes('{*splat}')` | developer | task 1 | Middleware runs on all routes (for example `/health`, unknown paths that return 404). No wildcard deprecation warning at startup. Existing `app.module.spec.ts` still passes | `clean-code` |
| 3 | DONE | Write `request-logger.middleware.spec.ts`: mock `req`/`res` (res as an `EventEmitter` with `statusCode`), spy on `Logger.prototype.log/warn/error`. Test: `next()` is called; 200 → `log`, 404 → `warn`, 500 → `error`; the message has method, URL, status, `ms`, IP, and user agent; nothing is logged before `finish` | tester | task 1 | All cases pass with AAA comments and behaviour-style test names. `pnpm server test` passes | `aaa-testing` |
| 4 | DONE | Update `app.module.spec.ts` to check that `AppModule` has a `configure` method and that it calls `consumer.apply(RequestLoggerMiddleware).forRoutes('{*splat}')` (use a mock consumer, do not compile the module) | tester | task 2 | Test passes and fails if the middleware registration is removed. Existing metadata checks still pass | `aaa-testing` |
