# PROJECT OVERVIEW

---

- **Project Name**: `template-nest-next`
- **Project Description**: `pnpm workspace monorepo template with a NestJS API (apps/server) and a Next.js front-end (apps/client)`
- **Programming Languages**: `TypeScript`
- **Frameworks**: `NestJS 11 (apps/server), Next.js 16 + React 19 (apps/client)`
- **Package Managers**: `pnpm >= 12.5.1 (workspaces)`
- **Key Libraries**: `server: Prisma 7, class-validator, class-transformer, BullMQ, cache-manager + Keyv/Redis, Socket.IO, Winston, Swagger, Nodemailer, Helmet, Throttler | client: Axios, Formik, Yup, next-intl, TanStack Table, shadcn/ui (Radix + Base UI), Tailwind CSS 4, Sonner`
- **Database**: `MySQL (Prisma with the MariaDB adapter), Redis (cache and BullMQ queues)`
- **Doc Directory**: `/.claude/plans`
- **Testing Workflow**: `Code-First` <!-- Code-First | Test-First | Skip-Testing -->
- **Playwright Check**: `Ask-User` <!-- Always | None | Ask-User -->

> Note: DO NOT change the checklist template above.

## Additional Information

### Layout

| Path                   | What it holds                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `apps/server`          | NestJS API. See `apps/server/README.md`.                                               |
| `apps/server/src/core` | Global infra modules: config, prisma, cache, bull, mail, http, security, winston, etc. |
| `apps/server/src/feature` | Feature modules: `auth`, `user`, `cache`, `health`.                                 |
| `apps/server/src/shared`  | Shared `config`, `dto`, `guards`, `pipes`.                                          |
| `apps/server/prisma`   | Prisma schema (one model per file in `prisma/schema/`), migrations, seed.              |
| `apps/client`          | Next.js app. See `apps/client/README.md`.                                              |
| `apps/client/src`      | `app/` (routes with `_components`, `_schemas`, `_constants`, …), `shared/` (`components`, `hooks`, `utils`), `libs/` (incl. `libs/shadcn-ui`), `assets/`, `proxy.ts`. |
| `apps/client/src/app/(routes)/[locale]/health`, `/cache` | Hidden dev pages (no UI links, `noindex`). `health` shows server/MySQL/Redis status. `cache` searches and deletes cache keys, and returns 404 in production. |
| `packages/`            | Shared packages. Declared in `pnpm-workspace.yaml`, but the folder does not exist yet.  |
| `scripts/`             | `01_run_docker_infra.sh` (local infra), `02_deploy_docker_vm.sh` (VM deploy).          |
| `docs/`                | Business documents written by people. Not for agent output.                            |
| `.claude/plans/`        | Agent-written files: plan files named `YYYY-MM-DD-HH-mm-ss-<slug>.md`, and PRDs.       |
| `.claude/references/`  | AI context: `PROJECT_OVERVIEW.md`, `CODING_CONVENTIONS.md`, `AGENT_RULES.md`, `WRITING_STYLE.md`. |

### Commands

- Run a script in one app: `pnpm server <script>` or `pnpm client <script>`.
- Common scripts in both apps: `start:dev`, `build`, `lint`, `lint:check`, `typecheck`, `format`, `format:check`, `test`, `test:cov`.
- Server only: `prisma:generate`, `db:push`, `db:migrate`, `db:seed`.
- Client only: `storybook`, `shadcn-ui:add`.
- Local MySQL + Redis: `pnpm infra` (uses `docker-compose-infra.yml`).

### Key facts

- Node.js `>=24` is required.
- Tests: Jest on the server (unit tests sit next to the source files, no e2e). Vitest + Testing Library on the client. Client specs use `renderWithIntl` from `@vitest-helpers` (`apps/client/vitest.helpers.tsx`). There are no specs for App Router files (`page.tsx`, `layout.tsx`, `actions.ts`, `error.tsx`, …); coverage skips them. Code in `_`-prefixed route folders (`_components`, `_schemas`, `_hooks`, `_utils`) is tested and counted in coverage, except `_constants` and `*Async` component folders.
- The client has `cacheComponents: true`. Request-time data must sit inside `<Suspense>` (or the route sets `export const instant = false`), or `pnpm client build` fails. Always run `pnpm client build` for client page work.
- `apps/client/src/proxy.ts` wraps the next-intl proxy. It also rewrites dev-only routes (`/cache`, `/<locale>/cache`) to a real 404 when `APP_ENV=production`. On the client, check the environment on the server only, with `envUtils.isProduction()`.
- Client i18n keys are one level deep inside a namespace (e.g. `health.tableIndicator`).
- Prisma client is generated into `apps/server/src/generated/prisma`. The DB URL is built in `src/core/config/database-url.ts` from `MYSQL_*` env vars, not in `schema.prisma`.
- Env files: each app has `.env.example`. The client loads env through `load-env-cli.mjs` with `APP_ENV`; the server uses `NODE_ENV`.
- The client uses a new Next.js version. Read `apps/client/AGENTS.md` and the docs in `node_modules/next/dist/docs/` before writing client code.
- Husky + lint-staged run ESLint on staged files before each commit.
- CI config exists for both GitHub (`.github/workflows`) and GitLab (`.gitlab`).
- Logs from both apps go to a self-hosted OpenObserve. The server ships them with a Winston transport (`src/core/winston/lib/openobserve-transport-options.ts`). The client batches them in `src/shared/utils/logUtils.ts` and POSTs to the `_json` ingest endpoint. Never use `console.log` in the client — use `logUtils`.
- Graphify graph lives in `graphify-out/`. Run `graphify update .` after code changes.
