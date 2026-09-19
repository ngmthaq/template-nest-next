# Title: Plan — Add unit tests for all server module files

- Classification: feature
- Description: Add a `*.module.spec.ts` next to every server `*.module.ts` that has none (18 files), mock every outside connection, and write the rule into the coding conventions.

---

## Approach Summary / Goal

- Each module gets the kind of test that fits what it does:
  - **Factory modules** (cache, bull, http, throttler, health, config): test the settings they build from config, including default values.
  - **Provider modules** (mail, prisma, security, websocket, feature cache, auth, user): compile with `Test.createTestingModule` and check that the right providers and controllers resolve and are exported.
  - **Aggregate modules** (app, core, feature): read the `@Module` metadata (`Reflect.getMetadata('imports' | 'exports', X)`) and check the list of child modules. We don't compile them, because that would load the whole app.
- All Redis, MySQL, Prisma and mail clients are mocked, so tests run without Docker.
- Goal: every `*.module.ts` has a spec, `pnpm server test` passes, and the conventions say this is required.

## Functional Requirements

- 18 new spec files, one next to each module that has no spec (`core-winston.module.spec.ts` already exists and stays as it is).
- Cache: the Keyv store gets `redis://host:port` with no password, and `redis://:<encoded>@host:port` with a password (a special character like `@` is encoded). The `ttl` comes from `cache.ttl`, with 3600000 as the default.
- Bull: the connection `host`/`port`/`password` come from config, and the defaults are `localhost:6379`.
- Http: `HttpService.axiosRef.defaults` has `timeout`/`maxRedirects` from config, and the defaults are 60000 / 5.
- Throttler: 3 throttlers named `short`, `medium`, `long` with values from config or the defaults. `skipIf` returns true only when `nodeEnv` is `development`. `ThrottlerGuard` is registered as `APP_GUARD`.
- Health: `createPool` and `new Redis` are called with values from config and the fixed options (`connectionLimit: 2`, `enableOfflineQueue: false`, …). An `'error'` listener is attached to the Redis client. `HealthService` and `HealthController` resolve.
- Config: `ConfigService` resolves and `configuration` values load, and the `envFilePath` order follows `NODE_ENV` (default `development`).
- Provider modules: each exported provider resolves from the compiled module. Auth and User modules compile, even though they are empty.
- Aggregates: `AppModule` imports `CoreModule` and `FeatureModule`. `CoreModule` imports and exports the same 12 core modules. `FeatureModule` imports and exports User, Auth, Cache and Health.
- `CODING_CONVENTIONS.md` Testing section gets a rule that says which module test to write for each kind of module (factory, provider, aggregate).

## Non-Functional Requirements

- No test opens a real network connection. External libraries are mocked with `jest.mock` (`@keyv/redis`, `ioredis`, `mysql2/promise`, the Prisma adapter and generated client, `nodemailer`), or with `overrideProvider(...).useValue(...)`.
- Follow the AAA comments (`// Arrange`, `// Act`, `// Assert`) and behavior-style test names, like the existing `core-winston.module.spec.ts`.
- Config is fed with `ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => config] })`, the same pattern as the winston spec.
- The suite stays fast, with no real timers or sleeps.

## Files in Scope

Created (all in `apps/server/src/`):
- `app.module.spec.ts`
- `core/core.module.spec.ts`
- `core/bull/core-bull.module.spec.ts`
- `core/cache/core-cache.module.spec.ts`
- `core/config/core-config.module.spec.ts`
- `core/event-emitter/core-event-emitter.module.spec.ts`
- `core/http/core-http.module.spec.ts`
- `core/mail/mail.module.spec.ts`
- `core/prisma/prisma.module.spec.ts`
- `core/schedule/core-schedule.module.spec.ts`
- `core/security/security.module.spec.ts`
- `core/throttler/core-throttler.module.spec.ts`
- `core/websocket/websocket.module.spec.ts`
- `feature/feature.module.spec.ts`
- `feature/auth/auth.module.spec.ts`
- `feature/cache/cache.module.spec.ts`
- `feature/health/health.module.spec.ts`
- `feature/user/user.module.spec.ts`

Modified:
- `.claude/references/CODING_CONVENTIONS.md` (Testing section)

No production code changes.

## Risks & Assumptions

- **Assumption:** Aggregate modules are tested through metadata only, not by compiling. Compiling them would need every child's external dependency mocked at once, which makes the test brittle and adds little value.
- **Assumption:** If a factory value can't be read from a public API (for example the Bull root options), the tester may read it through the library's exported options token. The tester may not change production code to make testing easier. If this turns out to be impossible, they return an open question instead.
- **Risk:** `CoreConfigModule` reads real `.env*` files from disk and uses `process.env.NODE_ENV`. The test must set and restore `process.env` values and must not depend on the developer's local `.env`.
- **Risk:** `ScheduleModule` and `EventEmitterModule` register global listeners. Specs must `close()` the module after each test so Jest exits cleanly.
- **Risk:** Some tests check Nest wiring more than our own logic. You chose this on purpose (option b).

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | ------ | ---- | ---------------- | ------------ | ------------------- | ------ |
| 1   | DONE   | Write specs for `core-cache`, `core-bull`, `core-http` modules | tester | none | Each spec checks config-driven values and defaults, as listed in Functional Requirements. Cache checks password URL-encoding. No real Redis connection. Specs pass. | `aaa-testing`, `clean-code` |
| 2   | DONE   | Write specs for `core-throttler`, `health`, `core-config` modules | tester | none | Throttler: 3 named throttlers, defaults, `skipIf` true/false, `APP_GUARD`. Health: `ioredis` + `mysql2/promise` mocked, constructor args checked, `'error'` listener attached. Config: env path order for set/unset `NODE_ENV`, `process.env` restored. Specs pass. | `aaa-testing`, `clean-code` |
| 3   | DONE   | Write specs for provider modules: `mail`, `prisma`, `security`, `websocket`, `core-schedule`, `core-event-emitter`, feature `cache`, `auth`, `user` | tester | none | Each module compiles with outside deps mocked. Exported providers and controllers resolve. Empty modules compile. Modules are closed after each test. Specs pass. | `aaa-testing`, `clean-code` |
| 4   | DONE   | Write specs for aggregate modules: `app`, `core`, `feature` | tester | none | Metadata check of `imports`/`exports` with exact module lists. No compile. Specs pass. | `aaa-testing`, `clean-code` |
| 5   | DONE   | Add the module-testing rule to the `CODING_CONVENTIONS.md` Testing section | developer | none | A short bullet in plain English (per WRITING_STYLE) that names the 3 module kinds and the test style for each, and that says external clients must be mocked. | `clean-code` |

Tasks 1–5 are independent, so they will run in parallel. After that I will run `pnpm server test`, `pnpm server test:cov` and `pnpm server lint` myself during review.
