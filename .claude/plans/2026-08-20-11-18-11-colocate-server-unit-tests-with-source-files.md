# Title: Plan — Colocate server unit tests with source files (v2)

- Classification: `feature`
- Description: Repoint Jest at `src/` so unit tests live beside the code they test, delete the `__test__/` folder, and write 12 colocated `*.spec.ts` files covering every logic-bearing unit in the server.

> **Revision note (v2)**: v1 was config-only. Per the user's clarification, this version adds the 12 test files (services, controllers, guard, pipe, websocket gateway + adapter) and flips `PROJECT_OVERVIEW.md` to `Code-First`. Nest modules and `main.ts` remain out of scope — they are DI wiring with nothing to assert.

---

## Approach Summary / Goal

- The `__test__/` folder is enforced by one line — `"testRegex": "__test__/.*\\.spec\\.ts$"` in `apps/server/jest.config.json`. Repointing it at `src/` is the core change; the rest is cleaning up config that assumed the old layout, then populating the new one.
- Config lands **before** tests: the 12 specs are only discoverable once `testRegex` points at `src/`, so the developer's work is a hard dependency of the tester's.
- Test-writing is split across **two tester sub-agents running in parallel** over disjoint file sets, since no spec depends on another.
- Every spec mocks its I/O boundary. No test may open a real MySQL, Redis, SMTP, or Socket.IO connection — the suite must pass on a machine with no infrastructure running (`docker-compose-infra.yml` not up).
- **Goal**: `pnpm --filter @template-nest-next/server test` runs 12 colocated suites green with no external services, and a developer adding `src/feature/order/order.service.ts` writes its test at `src/feature/order/order.service.spec.ts` with zero config changes.

## Functional Requirements

- `pnpm test` discovers and runs `*.spec.ts` anywhere under `apps/server/src/`, and nothing outside it.
- All 12 spec files pass with **no** external infrastructure running.
- `pnpm test:e2e` still works unchanged against `__e2e__/*.e2e-spec.ts`.
- `apps/server/__test__/` no longer exists.
- `nest g <schematic> <name>` scaffolds a colocated `*.spec.ts` beside the generated source.
- `pnpm build` succeeds and emits no `*.spec.js` into `dist/`.
- `pnpm lint:check` passes on every changed file — including the specs, which are subject to the same `eslint-plugin-security` and `simple-import-sort` rules as production code.
- `.claude/references/PROJECT_OVERVIEW.md` records Testing Workflow as `Code-First`.

## Non-Functional Requirements

- **Hermetic tests**: no network, no DB, no Redis, no SMTP, no real socket server. All boundaries mocked.
- **AAA structure**: every test follows Arrange-Act-Assert with one Act per test, per the `aaa-testing` skill.
- **Fast**: whole unit suite well under 30s. `bcrypt` must run at a low cost factor via a mocked `ConfigService` — the real default of 10 rounds is deliberately slow.
- **Coverage accuracy**: specs excluded from `collectCoverageFrom` so they don't inflate the denominator.
- **No production-code changes**: not one file under `src/` that ships is modified. If a unit proves untestable without a source change, that is a blocker to surface — not a licence to edit.

## Files in Scope

**Modified (4)**

- `apps/server/jest.config.json` — `testRegex`, `collectCoverageFrom`, `passWithNoTests`
- `apps/server/nest-cli.json` — `generateOptions.spec: false` → `true`
- `apps/server/tsconfig.build.json` — drop dead `"__test__"` exclude
- `.claude/references/PROJECT_OVERVIEW.md` — Testing Workflow → `Code-First`

**Deleted (2)**

- `apps/server/__test__/app.controller.spec.ts` + the `__test__/` folder

**Created (12)**

| #   | Spec file                                          | Unit under test        |
| --- | -------------------------------------------------- | ---------------------- |
| 1   | `src/core/security/hash.service.spec.ts`           | `HashService`          |
| 2   | `src/core/security/encryption.service.spec.ts`     | `EncryptionService`    |
| 3   | `src/feature/health/health.service.spec.ts`        | `HealthService`        |
| 4   | `src/feature/health/health.controller.spec.ts`     | `HealthController`     |
| 5   | `src/shared/guards/non-production.guard.spec.ts`   | `NonProductionGuard`   |
| 6   | `src/shared/pipes/validation.pipe.spec.ts`         | `handleValidationPipe` |
| 7   | `src/feature/cache/cache.service.spec.ts`          | `CacheService`         |
| 8   | `src/feature/cache/cache.controller.spec.ts`       | `CacheController`      |
| 9   | `src/core/mail/mail.service.spec.ts`               | `MailService`          |
| 10  | `src/core/prisma/prisma.service.spec.ts`           | `PrismaService`        |
| 11  | `src/core/websocket/websocket.gateway.spec.ts`     | `WebsocketGateway`     |
| 12  | `src/core/websocket/websocket.adapter.spec.ts`     | `ConfiguredIoAdapter`  |

**Unchanged** — `apps/server/jest-e2e.json`, `apps/server/package.json` (all five test scripts keep working as-is)

## Risks & Assumptions

Reading the sources surfaced six units that resist naive unit-testing. Each has a stated mocking strategy so the testers don't improvise:

- **`PrismaService`** — extends the generated `PrismaClient` and calls `config.getOrThrow('database.url')` plus `new PrismaMariaDb(...)` **in the constructor**. Its spec must `jest.mock` both `@prisma/adapter-mariadb` and `../../generated/prisma/client`, or instantiation attempts a real connection. Coverage will necessarily be shallow: construction succeeds, `onModuleInit` calls `$connect`, `onModuleDestroy` calls `$disconnect`.
- **`MailService`** — builds a nodemailer transporter in the constructor. Requires `jest.mock('nodemailer')` with `createTransport` returning a stub exposing `sendMail`/`verify`.
- **`WebsocketGateway`** — `server` is a `private readonly` field populated by `@WebSocketServer()` at runtime. Outside a live gateway, DI never fills it, so the spec must assign a mock `Server` directly. This is a test-only reach into a private field; it's the standard Nest approach, but flagged as a deliberate choice.
- **`ConfiguredIoAdapter`** — `createIOServer` calls `super.createIOServer`, which constructs a real Socket.IO server. The spec should assert the **CORS wiring** (that `buildCorsOptions` output is merged into the options passed to `super`) by spying on the prototype, rather than actually booting a server.
- **`HashService`** — `bcrypt` is a native module and genuinely slow at the default cost of 10. The mocked `ConfigService` must return a low `hash.saltRounds` (e.g. 4) to keep the suite fast.
- **`handleValidationPipe`** — a bare function, not a class. Its spec asserts that `app.useGlobalPipes` is called with a `ValidationPipe` configured `whitelist`/`forbidNonWhitelisted`/`transform: true`, using a mock `INestApplication`.

Other risks and assumptions:

- **Assumption**: deleting `__test__/app.controller.spec.ts` loses nothing — verified, its only uncommented code is an empty `describe`, and the `src/app.controller.ts` / `src/app.service.ts` it references do not exist.
- **Risk (medium)**: specs are linted under `eslint-plugin-security` and `recommendedTypeChecked`. Mock-heavy test code commonly trips `@typescript-eslint/no-unsafe-*`. If lint proves genuinely incompatible with idiomatic mocking, the right fix is a scoped ESLint override block for `**/*.spec.ts` — but that edits `eslint.config.mjs`, which is **outside the file scope above**. Made a blocker rather than pre-authorised; task 15 surfaces it to the Root Agent, which returns to the user.
- **Assumption**: no `coverageThreshold` is added. The user asked for test files, not an enforced coverage gate.
- **Risk (low)**: `passWithNoTests` (task 3) is now largely moot once 12 specs exist, but stays as a safety net for anyone who deletes them from this template.
- **Confirmed**: no CI workflow files exist (`.github/` absent), so no pipeline references the `__test__` path.

## Open Questions / Blockers

- None. Both revision questions are answered; every inferred decision is listed under Risks & Assumptions and is covered by the approval gate.

## Status

- [x] Ready to execute
- [ ] Blocked — requires user input on: —

## Task List

| #   | Status | Task                                                                                                                          | Responsible Role | Dependencies | Acceptance Criteria                                                                                                                                                                                                                                                                                                                                          | Skills                      |
| --- | ------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| 1   | DONE   | `jest.config.json`: `testRegex` → `"src/.*\\.spec\\.ts$"`                                                                     | developer        | none         | `jest --listTests` resolves only files under `src/`; JSON valid + Prettier-clean                                                                                                                                                                                                                                                                               | `clean-code`                |
| 2   | DONE   | `jest.config.json`: `collectCoverageFrom` → `["src/**/*.(t\|j)s", "!src/**/*.spec.ts", "!src/generated/**"]`                   | developer        | 1            | `pnpm test:cov` report lists no `*.spec.ts` and no `src/generated/**` row                                                                                                                                                                                                                                                                                      | `clean-code`                |
| 3   | DONE   | `jest.config.json`: add `"passWithNoTests": true`                                                                             | developer        | 1            | `pnpm test` exits `0` when no specs exist                                                                                                                                                                                                                                                                                                                      | `clean-code`                |
| 4   | DONE   | Delete `apps/server/__test__/app.controller.spec.ts` and the `__test__/` directory                                            | developer        | 1            | Folder gone; `grep -r "__test__" apps/server --exclude-dir=node_modules` clean apart from task 5's file                                                                                                                                                                                                                                                        | `clean-code`                |
| 5   | DONE   | `tsconfig.build.json`: remove `"__test__"` from `exclude`, keep `"__e2e__"` and `"**/*spec.ts"`                                | developer        | 4            | `pnpm build` succeeds; `find dist -name "*.spec.js"` empty                                                                                                                                                                                                                                                                                                     | `clean-code`                |
| 6   | DONE   | `nest-cli.json`: `generateOptions.spec` → `true`                                                                              | developer        | none         | `nest g service feature/tmp --dry-run` reports both `.service.ts` and `.service.spec.ts`; nothing written                                                                                                                                                                                                                                                       | `clean-code`                |
| 7   | DONE   | `PROJECT_OVERVIEW.md`: Testing Workflow → `Code-First`                                                                        | developer        | none         | Line reads `` `Code-First` ``; template checklist comment left intact                                                                                                                                                                                                                                                                                          | `clean-code`                |
| 8   | DONE   | Write `hash.service.spec.ts` + `encryption.service.spec.ts`                                                                   | tester A         | 1–5          | Both pass. Hash: round-trip verify, wrong-password false, salt makes two hashes differ, low cost factor. Encryption: round-trip, distinct ciphertexts per call, `compare` true/false, tampered payload → `false` not throw, missing key → clear throw                                                                                                            | `aaa-testing`, `clean-code` |
| 9   | DONE   | Write `health.service.spec.ts` + `health.controller.spec.ts`                                                                  | tester A         | 1–5          | Pass with mocked `HEALTH_MYSQL_POOL` / `HEALTH_REDIS_CLIENT`. Service: all-up → `ok`; mysql throws → `error` + `down` w/ message; redis throws → same; `AggregateError` unwrapped to first cause; `onModuleDestroy` ends both. Controller: `ok` returns body; `error` throws `ServiceUnavailableException` carrying the result                                     | `aaa-testing`, `clean-code` |
| 10  | DONE   | Write `non-production.guard.spec.ts` + `validation.pipe.spec.ts`                                                              | tester A         | 1–5          | Guard: `production` → `ForbiddenException`; `development`/`staging`/unset → `true`. Pipe: `useGlobalPipes` called once with a `ValidationPipe` whose options are `whitelist`, `forbidNonWhitelisted`, `transform`, `enableImplicitConversion` all `true`                                                                                                          | `aaa-testing`, `clean-code` |
| 11  | DONE   | Write `cache.service.spec.ts` + `cache.controller.spec.ts`                                                                    | tester B         | 1–5          | Service: glob `*`/`?`/literal matching incl. anchoring, dedupe across stores, stores without `iterator` skipped, empty pattern → `BadRequestException`, >200 chars → `BadRequestException`, `delete` true only when key existed. Controller: delegates `search`, returns `{key, deleted}` from `remove`                                                           | `aaa-testing`, `clean-code` |
| 12  | DONE   | Write `mail.service.spec.ts` + `prisma.service.spec.ts`                                                                       | tester B         | 1–5          | Mail (`jest.mock('nodemailer')`): `send` passes mapped fields, applies `defaultFrom` when `from` omitted, respects explicit `from`, rejects on transport failure, `verify` delegates. Prisma (adapter + generated client mocked): constructs from `database.url`, `onModuleInit`→`$connect`, `onModuleDestroy`→`$disconnect`. No real connection attempted        | `aaa-testing`, `clean-code` |
| 13  | DONE   | Write `websocket.gateway.spec.ts` + `websocket.adapter.spec.ts`                                                               | tester B         | 1–5          | Gateway (mock `Server` injected): `broadcast`, `broadcastExcept`, `emitToRoom`, `emitToRoomExcept`, `emitToClient` each target the right room/except chain; `handlePing` → `{event:'pong'}` echoing payload; `room:join`/`room:leave` call `join`/`leave` and return `room:joined`/`room:left`. Adapter: `createIOServer` merges `buildCorsOptions` into options passed to `super` (prototype spied, no real server booted) | `aaa-testing`, `clean-code` |
| 14  | DONE   | Run full sweep in `apps/server`: `pnpm test`, `test:cov`, `test:e2e`, `build`, `lint:check` — report every exit code, with **all infrastructure containers stopped** | tester B         | 8–13         | All five exit `0`; report states each command's outcome, pasting output for any non-zero                                                                                                                                                                                                                                                                        | `aaa-testing`               |
| 15  | DONE   | If specs cannot satisfy `eslint.config.mjs` without an override, do **not** edit it — report the exact rule violations to the Root Agent as a blocker | tester A + B     | 14           | Either `lint:check` passes untouched, or a precise list of offending rules + files is returned with `eslint.config.mjs` unmodified                                                                                                                                                                                                                              | `clean-code`                |

---

**Delegation shape**: developer runs first (tasks 1–7, config is a hard prerequisite), then testers A and B spawn **in parallel** over disjoint spec files (A: 6 specs, B: 6 specs + the sweep). All sub-agents on Sonnet per the party-mode contract.

---

## Addendum — Review-Driven Tasks (added at Step 6)

The Root Agent's review found that the approved plan's functional requirement "`pnpm build` succeeds and emits no `*.spec.js` into `dist/`" began FAILING once the 12 colocated specs landed under `src/`. Task 5's original acceptance criterion had legitimately passed when the developer ran it, because no `*.spec.ts` existed under `src/` at that point — the failure only became observable after the tester sub-agents completed.

**Root cause**: `nest-cli.json` uses `"builder": "swc"` with `"typeCheck": true`, producing two independent passes. The TSC type-check pass reads `tsconfig.build.json` and honours its `"**/*spec.ts"` exclude; the SWC compile/emit pass globs `src/**/*.ts` on its own and never consults that exclude. Impact was real, not theoretical: `apps/server/Dockerfile` does `COPY --from=build /prod/server/dist ./dist`, so 12 spec files were shipping into the production runtime image.

| #   | Status | Task                                                                                                          | Responsible Role | Dependencies | Acceptance Criteria                                                                                     | Skills       |
| --- | ------ | ------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | --------------------------------------------------------------------------------------------------------- | ------------ |
| 16  | DONE   | Investigate SWC-builder spec-exclusion mechanisms; choose the lowest-risk one that preserves decorator metadata | developer        | 8–13         | Chosen mechanism named, alternatives ruled out with concrete evidence                                       | `clean-code` |
| 17  | DONE   | Implement the chosen fix                                                                                       | developer        | 16           | `pnpm build` exits 0 AND `find dist -name "*.spec.js"` returns zero                                         | `clean-code` |
| 18  | DONE   | Prove production output unaffected apart from removed specs                                                    | developer        | 17           | Non-spec `dist/**/*.js` file set identical before/after; `design:paramtypes` metadata still emitted (DI OK) | `clean-code` |

**Resolution**: `apps/server/nest-cli.json` — `compilerOptions.builder` changed from the string `"swc"` to the object form `{ "type": "swc", "options": { "ignore": ["**/*.spec.ts"] } }`. This reaches `@swc/cli`'s `globSources` file-listing step, so spec files are never read or compiled. It sets `cliOptions.ignore`, a field disjoint from `swcOptions.jsc.transform` where `legacyDecorator`/`decoratorMetadata` live — hence it cannot disturb the decorator metadata NestJS DI depends on. Verified: 0 spec files in `dist/`, 55 non-spec `.js` files identical before and after, `design:paramtypes` still emitted.

**Scope note**: `apps/server/nest-cli.json` was already in the approved file scope (task 6), so no scope expansion was required. `apps/server/package.json` was NOT modified — the post-build-prune fallback proved unnecessary.

## Final Verification (Root Agent, Step 6)

| Check                            | Command                             | Result                                    |
| -------------------------------- | ----------------------------------- | ----------------------------------------- |
| Unit tests                       | `npx jest`                          | pass — 59 passed / 0 failed, 12 suites    |
| Build                            | `pnpm build`                        | pass — exit 0                             |
| No specs in dist                 | `find dist -name "*.spec.js" \| wc -l` | pass — `0` (was `12`)                  |
| Production output intact         | `find dist -name "*.js" ! -name "*.spec.js" \| wc -l` | pass — 55, `dist/main.js` present |
| Decorator metadata / DI          | `grep design:paramtypes dist/...`   | pass — present in compiled service + controller |
| Lint                             | `pnpm lint:check`                   | pass — exit 0                             |
| Secret scan                      | `scan-secrets.sh --diff`            | pass — exit 0, no secrets detected        |
| E2E                              | `pnpm test:e2e`                     | fail — PRE-EXISTING, see Follow-ups       |

## Follow-ups

- **`pnpm test:e2e` fails** with "Your test suite must contain at least one test" against `apps/server/__e2e__/app.e2e-spec.ts`, an entirely commented-out placeholder — the same shape as the `__test__` file deleted by task 4. Confirmed pre-existing by stashing all changes and re-running against unmodified `main`; this work introduced no regression. Left untouched because the user explicitly chose "Leave `__e2e__` untouched" during brainstorming. Fixing it would mean either deleting the placeholder, writing a real e2e test, or adding `"passWithNoTests": true` to `jest-e2e.json`. Not actioned — requires a user decision.
- The plan's "Files in Scope" recorded `__e2e__/` as empty; it in fact contains `app.e2e-spec.ts`. Corrected here for the record.
