# Title: Plan — Remove the server's global `/api` prefix but keep the config

- Classification: feature
- Description: Set `GLOBAL_PREFIX` to `''` so routes mount at the root, and point the client's `API_URL` at the server root.

---

## Approach Summary / Goal

- Keep `prefix.config.ts` and `handleGlobalPrefix()`; only change the `GLOBAL_PREFIX` value to `''`. NestJS treats an empty prefix as "no prefix", so `GET /api/health` becomes `GET /health`.
- Update every place in the client that assumes the `/api` prefix (env files and README) so the client keeps reaching the server.
- Goal: no route prefix today, but one value to change to bring it back later.

## Functional Requirements

- `GLOBAL_PREFIX` equals `''` and `handleGlobalPrefix()` still exists and is still called.
- Server routes answer without a prefix (e.g. `GET /health`).
- Client `API_URL` defaults are `http://localhost:3000` (no `/api`) in `.env.example` and `.env.development`.
- Comments and README no longer say `API_URL` includes an `/api` prefix.

## Non-Functional Requirements

- No behaviour change except the route path. Swagger stays at `/swagger`.
- Server build, lint and unit tests still pass.

## Files in Scope

- Modify: `apps/server/src/shared/config/prefix.config.ts`
- Modify: `apps/client/.env.example`
- Modify: `apps/client/.env.development` (git-ignored, local only)
- Modify: `apps/client/README.md`

## Risks & Assumptions

- User decision: add an `if (GLOBAL_PREFIX)` guard so `setGlobalPrefix` is skipped when the prefix is empty.
- User decision: keep the py-service `__init__.py` files.
- Risk: other local/deploy env files that are not in git (e.g. the VM's client env with `http://server:3000/api`) must be updated by hand.
- No tester task: there is no spec for `prefix.config.ts` and the change is a constant value.

## Open Questions / Blockers

- none

## Status

- [x] Ready to execute
- [ ] Blocked — requires user input on: —

## Task List

| #   | Status | Task                                                                                                                  | Responsible Role | Dependencies | Acceptance Criteria                                                                                      | Skills       |
| --- | ------ | --------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | -------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | DONE   | In `prefix.config.ts` set `GLOBAL_PREFIX = ''` and guard the call with `if (GLOBAL_PREFIX)`; update JSDoc| developer        | none         | Constant is `''`, `setGlobalPrefix` skipped when empty, JSDoc correct; server `pnpm build` and `pnpm lint` pass | `clean-code` |
| 2   | DONE   | In client `.env.example` and `.env.development` set `API_URL=http://localhost:3000` and fix the comments about `/api` | developer        | none         | No `/api` in `API_URL` values or their comments; compose hint reads `http://server:3000`                 | `clean-code` |
| 3   | DONE   | In `apps/client/README.md` env table, drop "including its `/api` prefix" from the `API_URL` row                      | developer        | none         | Row describes `API_URL` as the server base URL; table still aligned                                      | `clean-code` |
