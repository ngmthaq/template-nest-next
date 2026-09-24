# Title: Plan — Server uses APP_ENV instead of NODE_ENV

- Classification: feature
- Description: Replace `NODE_ENV` with `APP_ENV` in `apps/server`, rename the `nodeEnv` config key to `appEnv`, and rename the Compose/deploy-script selector from `NODE_ENV` to `APP_ENV`.

---

## Approach Summary / Goal

- The server reads only `APP_ENV` (default `development`) to pick `.env.<APP_ENV>` files and to switch dev/prod behaviour. This is the same pattern as the client and py-service.
- The server no longer sets `NODE_ENV` anywhere: not in the start scripts and not in the Dockerfile. The user chose this.
- Compose files, deploy scripts and docs use `APP_ENV` as the environment selector for all apps.
- Goal: `APP_ENV` is the one name for "which environment" across the whole repo.

## Functional Requirements

- FR1: `start:dev`/`start:debug`/`start:staging`/`start:prod` in `apps/server/package.json` set `APP_ENV=<env>` through `cross-env`. None of them set `NODE_ENV`.
- FR2: `core-config.module.ts`, `configuration.ts`, `prisma.config.ts` and `prisma/seed.ts` read `process.env.APP_ENV ?? 'development'`.
- FR3: The config key is `appEnv`. The throttler, winston, helmet, swagger and `NonProductionGuard` read `config.get('appEnv', 'development')`. Behaviour does not change.
- FR4: `apps/server/Dockerfile` runtime stage has `ENV APP_ENV=production` and no `ENV NODE_ENV`.
- FR5: In `docker-compose.yml` and `docker-compose-infra.yml`, every `${NODE_ENV:-development}` becomes `${APP_ENV:-development}`. The server service environment is `APP_ENV: ${APP_ENV:-development}` (no `NODE_ENV`). The client keeps `NODE_ENV: production`, because Next needs it, and gets `APP_ENV: ${APP_ENV:-development}`.
- FR6: `scripts/01_run_docker_infra.sh` and `scripts/02_deploy_docker_vm.sh` use `APP_ENV` in place of `NODE_ENV`.
- FR7: The docs use `APP_ENV`: `apps/server/.env.example` header, `apps/server/README.md`, root `README.md`, `apps/py-service/README.md` line 85, and `.claude/references/PROJECT_OVERVIEW.md` line 57.
- FR8: The server specs use `APP_ENV`/`appEnv`, and all tests pass.

## Non-Functional Requirements

- The server's `lint:check`, `format:check`, `typecheck` and `test` pass. `APP_ENV=production docker compose config` and `bash -n` on both scripts succeed.
- Short JSDoc only, in the existing style.

## Files in Scope

- `apps/server/package.json`, `Dockerfile`, `.env.example`, `README.md`, `prisma.config.ts`, `prisma/seed.ts`
- `apps/server/src/core/config/{configuration.ts,core-config.module.ts,core-config.module.spec.ts}`
- `apps/server/src/core/throttler/core-throttler.module{,.spec}.ts`, `src/core/winston/core-winston.module{,.spec}.ts`
- `apps/server/src/shared/config/{helmet,swagger}.config.ts`, `src/shared/guards/non-production.guard{,.spec}.ts`
- `docker-compose.yml`, `docker-compose-infra.yml`, `scripts/01_run_docker_infra.sh`, `scripts/02_deploy_docker_vm.sh`, `README.md`
- `apps/py-service/README.md`, `.claude/references/PROJECT_OVERVIEW.md`

## Risks & Assumptions

- **Risk:** without `NODE_ENV=production`, Express and some libraries run in their default "development" mode in production containers (for example, less caching of views). Nest's own error handling does not change. The user accepted this.
- **Breaking for operators:** commands like `NODE_ENV=production docker compose up` stop picking the env. After this change, it must be `APP_ENV=production …`. Containers and images keep the same names and tags.
- Assumption: the local `apps/server/.env.development` is gitignored and will not be touched. Its comments still say `NODE_ENV`, so the user may want to update them by hand.
- Assumption: old plan files in `.claude/plans/` are history and will not be changed. The client's `httpUtilsHelper.ts` (`NODE_ENV` for the cookie `secure` flag) and the client Dockerfile stay as they are, because Next sets `NODE_ENV` itself.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | ------ | ---- | ---------------- | ------------ | ------------------- | ------ |
| 1   | DONE   | Server source: package.json scripts, Dockerfile, `.env.example` header, `prisma.config.ts`, `prisma/seed.ts`, `configuration.ts` (key `appEnv`), `core-config.module.ts`, and the throttler/winston/helmet/swagger/guard callers | developer | none | FR1–FR4 met; `grep -rn NODE_ENV\|nodeEnv apps/server/src apps/server/prisma* apps/server/package.json apps/server/Dockerfile` finds nothing outside specs; typecheck + lint pass | `clean-code` |
| 2   | DONE   | Update the specs: `core-config.module.spec.ts`, `core-throttler.module.spec.ts`, `core-winston.module.spec.ts`, `non-production.guard.spec.ts` → `APP_ENV`/`appEnv` | tester | task 1 | FR8: `pnpm server test` passes; no `NODE_ENV`/`nodeEnv` in the specs | `aaa-testing` |
| 3   | DONE   | Compose, scripts and docs: both compose files, scripts 01/02, root README, server README, py-service README, PROJECT_OVERVIEW.md | developer | none | FR5–FR7 met; `APP_ENV=production docker compose config` shows `-production` names, the server has no `NODE_ENV`; `bash -n` passes on both scripts; no stale `NODE_ENV` selector left in these files (except the client's `NODE_ENV: production` with its comment) | `clean-code` |
