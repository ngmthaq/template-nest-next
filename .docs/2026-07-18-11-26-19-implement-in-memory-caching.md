- Author: Root Agent
- Title: Plan — Implement in-memory caching (NestJS CacheModule)
- Classification: feature
- Description: Wire up `@nestjs/cache-manager` in-memory caching, registered globally in `CoreModule` with TTL/max sourced from the existing env-based `configuration.ts`, for manual use via injected `CACHE_MANAGER`.

---

## Approach Summary

- Install `@nestjs/cache-manager` (v3, NestJS 11-compatible) and `cache-manager` (v6). The default Keyv in-memory store needs no extra infra.
- Extend `configuration.ts` with a `cache` section (`ttl`, `max`) read from env, matching the current strongly-typed config factory pattern.
- Register `CacheModule.registerAsync({ isGlobal: true, useFactory })` inside the existing `CoreModule` — consistent with how `ConfigModule` is registered there — pulling values from `ConfigService`.
- Manual usage only: no global `CacheInterceptor`, no demo endpoint. Consumers inject `CACHE_MANAGER` to `get`/`set`.

## Functional Requirements

- App boots with `CacheModule` registered globally; `CACHE_MANAGER` is injectable in any provider without re-importing.
- Cache TTL and max entries are driven by env vars, with sensible defaults when unset.
- `pnpm build` and `pnpm lint:check` pass.

## Non-Functional Requirements

- No new required infrastructure (in-memory only; app boots with zero env config).
- Follow established conventions: env-typed `configuration.ts`, global registration in `CoreModule`, Prettier/ESLint clean.
- No secrets or env values read/committed (only keys documented in `.env.example`).

## Files in Scope

- `package.json` / `pnpm-lock.yaml` — add `@nestjs/cache-manager`, `cache-manager` (modified)
- `src/core/configuration.ts` — add `cache: { ttl, max }` section (modified)
- `src/core/core.module.ts` — register `CacheModule.registerAsync` global (modified)
- `.env.example` — document `CACHE_TTL`, `CACHE_MAX` keys (modified)

## Risks & Assumptions

- Assumption: In-memory store is sufficient (per user choice); Redis is explicitly out of scope.
- Risk: `cache-manager` v6 (Keyv/cacheable-based) changed option semantics from v5 — `ttl` is in milliseconds, and `max` may map differently than the old LRU `max`. The developer must verify the exact option names against the installed v6 API rather than assume v5 semantics, and confirm via a runtime smoke test.
- Assumption: Default TTL of 5000 ms and max 100 entries are acceptable placeholder defaults (tunable via env).

## Open Questions / Blockers

- None — all resolved during brainstorming.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status | Task                                                                                                                                             | Responsible Role | Dependencies | Skills       |
| --- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | ------------ |
| 1   | DONE   | Add `@nestjs/cache-manager` + `cache-manager` deps; add `cache: { ttl, max }` to `configuration.ts` reading `CACHE_TTL`/`CACHE_MAX` with defaults | developer        | none         | `clean-code` |
| 2   | DONE   | Register `CacheModule.registerAsync({ isGlobal: true, useFactory })` in `CoreModule`, sourcing ttl/max from `ConfigService`; verify option names against installed cache-manager v6 | developer        | task 1       | `clean-code` |
| 3   | DONE   | Document `CACHE_TTL` / `CACHE_MAX` keys in `.env.example`; verify `pnpm build` + `pnpm lint:check` pass and app boots with cache registered      | developer        | task 2       | `clean-code` |

> Note: installed `cache-manager` is **v7** (not v6 as anticipated) — same Keyv/cacheable architecture, ttl in ms. `max` has no top-level option in v7's default in-memory store; kept as documented config only. Review accepted the caching work; two out-of-scope edits (`.claude/PROJECT_OVERVIEW.md`, `.prettierignore`) are being handled by the user directly.
