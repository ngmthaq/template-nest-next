# Title: Plan — Split the query from the URL, and log query and body behind an env flag

- Classification: feature
- Description: Log only the path in the main line. When `LOG_REQUEST_DATA=true`, add the masked and size-limited query and body as JSON at the end of the same line.

---

## Approach Summary / Goal

- Add a new config value, `log.requestData`, read from `LOG_REQUEST_DATA`. It follows the style of the other config values (`=== 'true'`, default `false`).
- `RequestLoggerMiddleware` injects `ConfigService` and reads the flag once in its constructor. The main line always shows the path without the query.
- When the flag is on, the middleware adds ` query={...}` and ` body={...}` to the end of the line. Secret values are masked first, and each JSON text is cut at 2000 characters.
- Goal: short, safe logs by default. Full request data is there when a developer turns it on.

## Functional Requirements

- Flag off (default): `GET /users 200 12ms - ::1 "UA"`. No query string, no query, no body.
- Flag on: `GET /users 201 12ms - ::1 "UA" query={"page":"1"} body={"name":"a","password":"***"}`.
- The `query=` part is left out when the query is empty. The `body=` part is left out when the body is missing or empty (`{}`).
- Masking: if a key contains `password`, `token`, `secret`, `authorization`, `apikey`, `otp`, or `captcha` (in any upper or lower case), its value becomes `"***"`. This covers `accessToken`, `newPassword`, `x-api-key`-like keys, and so on. Masking also works in nested objects and arrays. It applies to both the query and the body.
- Size limit: if the JSON text of the query or body is longer than 2000 characters, it is cut at 2000 and `…(truncated)` is added.
- The log level rules do not change: below 400 `log`, 400–499 `warn`, 500 and up `error`.
- Masking never changes the real `req.body` or `req.query`. It works on a copy.

## Non-Functional Requirements

- When the flag is off, there is no extra work per request (no JSON, no masking).
- Security: secret values are masked before any output. The default is off in every environment.
- Style: follows `CODING_CONVENTIONS.md`. The new env key goes in `configuration.ts` and `.env.example`, with a README row. The middleware reads the flag only through `ConfigService`.
- `pnpm server lint:check`, `pnpm server typecheck`, and `pnpm server test` pass.

## Files in Scope

- Modify: `apps/server/src/core/config/configuration.ts` (add `log.requestData`)
- Modify: `apps/server/.env.example` (add `LOG_REQUEST_DATA=false` with a comment, under `LOG_LEVEL`)
- Modify: `apps/server/.env.development` (set `LOG_REQUEST_DATA=true`; this file is git-ignored and local only)
- Modify: `apps/server/README.md` (add a `LOG_REQUEST_DATA` row to the env table next to `LOG_LEVEL`)
- Modify: `apps/server/src/shared/middlewares/request-logger.middleware.ts`
- Modify: `apps/server/src/shared/middlewares/request-logger.middleware.spec.ts`

## Risks & Assumptions

- Assumption: the path comes from `req.originalUrl` without the part after `?`. I don't use `req.path`, because Express can cut the mount path from it.
- Assumption: the query is logged as the parsed `req.query` object, not the raw string.
- Assumption: I chose the list of secret key words shown above. Tell me if you want more words.
- Assumption (user accepted): `otp` is a contains-match, so it also masks harmless keys like `footprint`.
- Risk: when the flag is on, personal data in bodies (names, emails, …) still reaches the logs and OpenObserve. Only the key words above are masked.
- Risk: a multipart or file upload body is not parsed into `req.body` here, so it logs as empty. That is fine.
- The known risks from the first plan still apply: the proxy IP, and no log line when the client disconnects.

## Open Questions / Blockers

- none

## Status

- [x] Ready to execute
- [ ] Blocked — requires user input on: —

## Task List

| #   | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | ------ | ---- | ---------------- | ------------ | ------------------- | ------ |
| 1 | DONE | Add `log.requestData: process.env.LOG_REQUEST_DATA === 'true'` in `configuration.ts`. Add `LOG_REQUEST_DATA=false` with a short comment under `LOG_LEVEL` in `.env.example`. Set `LOG_REQUEST_DATA=true` in `.env.development`. Add a README env table row next to `LOG_LEVEL` | developer | none | `config.get('log.requestData')` is `false` when unset and `true` only for `'true'`. Env example, dev env file, and README row are in place. The README table stays aligned | `clean-code` |
| 2 | DONE | (Change round: add `'otp'` and `'captcha'` to `SECRET_KEY_WORDS`.) Update `RequestLoggerMiddleware`: inject `ConfigService` and read `log.requestData` once in the constructor. Log the path without the query. When the flag is on, add ` query=<json>` and ` body=<json>` (each only when not empty), masked by the key word list and cut at 2000 chars + `…(truncated)`. Use `private static readonly` constants for the limit and the key words | developer | task 1 | Matches every functional requirement above. `req.body`/`req.query` are not changed. No JSON work when the flag is off. Lint and typecheck pass | `clean-code`, `security-scanner` |
| 3 | DONE | (Change round: also test that `otpCode` and `recaptchaResponse` in body or query are masked.) Update `request-logger.middleware.spec.ts` for the new constructor (mock `ConfigService`) and the new URL format. Add tests: flag off → no query/body and no query string; flag on → query and body JSON added; empty query/body are left out; nested and array secret keys (e.g. `password`, `accessToken`, `user.apiKey`) are masked; the original `req.body` is not changed; a body over 2000 chars is cut and ends with `…(truncated)` | tester | task 2 | All tests pass with AAA comments. The existing level/boundary tests still pass. `pnpm server test` passes | `aaa-testing` |
