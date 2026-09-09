# PROJECT OVERVIEW

---

- **Project Name**: `template-nest-next`
- **Project Description**: `A pnpm-workspace monorepo template pairing a NestJS 11 API (apps/server) with a Next.js 16 App Router front-end (apps/client). It is a starting point, not a product — cross-cutting infrastructure (config, cache, queues, logging, security, i18n, theming, Storybook, Docker) is wired up and the domain layer is intentionally empty, so a real product is built on top of it later.`
- **Programming Languages**: `TypeScript` (with `.mjs` config/loader scripts, `SQL` migrations, `Shell` for one Prisma helper script)
- **Frameworks**: `NestJS 11` (apps/server), `Next.js 16 App Router + React 19` (apps/client)
- **Package Managers**: `pnpm 10.25.0` (pinned via `packageManager`, `corepack enable`; single `pnpm-lock.yaml`, workspaces `apps/*` and `packages/*`)
- **Key Libraries**: `Prisma 7`, `class-validator` + `class-transformer`, `@nestjs/swagger`, `@nestjs/throttler`, `@nestjs/bullmq` + `bullmq`, `@nestjs/cache-manager` + `keyv`/`@keyv/redis`, `nest-winston` + `winston`, `socket.io`, `helmet`, `bcrypt`, `nodemailer`, `axios`, `next-intl`, `next-themes`, `shadcn/ui` (Radix + `@base-ui/react`), `Tailwind CSS v4`, `formik` + `yup`, `@tanstack/react-table`, `Storybook 10`, `Jest 30` (server), `Vitest 3` + Testing Library (client)
- **Database**: `MySQL 8` via Prisma 7 (`@prisma/adapter-mariadb`, `mysql2`) + `Redis` for cache and BullMQ queues. Multi-file schema in `apps/server/prisma/schema/`; connection URL assembled in `apps/server/prisma.config.ts` from `MYSQL_*` env keys. Local infra runs from `docker-compose-infra.yml`.
- **Doc Directory**: `/docs`
- **Testing Workflow**: `Code-First` <!-- Code-First | Test-First | Skip-Testing -->
- **Playwright Check**: `Ask-User` <!-- Always | None | Ask-User -->

> Note: DO NOT edit the checklist template above.

## Additional Informations

### Repository layout

```
.
├── apps/
│   ├── server/           # NestJS API — see apps/server/README.md
│   └── client/           # Next.js front-end — see apps/client/README.md
├── packages/             # Shared packages (declared in pnpm-workspace.yaml, none yet)
├── docs/                 # Agent-generated plan files, named <YYYY-MM-DD-HH-MM-SS>-<slug>.md
├── .claude/              # AI instructions, references/, skills/
├── docker-compose.yml        # server + client containers
├── docker-compose-infra.yml  # local MySQL + Redis
└── pnpm-workspace.yaml
```

Node `>=24` is required by every workspace.

### Commands

Run from the repo root; `pnpm server <script>` / `pnpm client <script>` proxy into an app.

| Task    | Server                                   | Client                       |
| ------- | ---------------------------------------- | ---------------------------- |
| Dev     | `pnpm server start:dev`                  | `pnpm client start:dev`      |
| Build   | `pnpm server build`                      | `pnpm client build`          |
| Lint    | `pnpm server lint` (`lint:check` for CI) | `pnpm client lint`           |
| Format  | `pnpm server format`                     | `pnpm client format`         |
| Test    | `pnpm server test` (Jest)                | `pnpm client test` (Vitest)  |
| Cover   | `pnpm server test:cov`                   | `pnpm client test:cov`       |
| Types   | — (SWC `typeCheck: true` during build)   | `pnpm client typecheck`      |
| Stories | —                                        | `pnpm client storybook`      |
| DB      | `pnpm server db:migrate` / `db:push` / `db:seed` / `prisma:generate` | — |

Workspace-wide: `pnpm -r build`, `pnpm -r lint`, `pnpm -r test`.

### Server architecture (`apps/server/src`)

- `core/` — one `@Global` `Core*Module` per cross-cutting concern (config, prisma, winston, cache, http, mail, schedule, event-emitter, bull, throttler, security, websocket), all aggregated by `core.module.ts`.
- `feature/` — domain modules aggregated by `feature.module.ts`. Present today: `health`, `cache`, plus empty `auth`/`user` shells.
- `shared/` — `config/` bootstrap helpers (`handle*(app)` for cors, helmet, compression, cookie-parser, prefix, swagger, versioning), `dto/`, `guards/`, `pipes/`.
- `generated/prisma/` — Prisma client output; **generated, never edited, excluded from lint/tsconfig/coverage**.
- API uses header-based versioning (`X-API-Version`, default `1`). Swagger at `/swagger` — disabled when `NODE_ENV=production`.

### Client architecture (`apps/client/src`)

- `app/(routes)/[locale]/` — every page lives under a locale segment; `global-error.tsx` and `global-not-found.tsx` sit at the `app/` root.
- `components/` — Atomic Design: `atoms/`, `molecules/`, `organisms/`, `templates/`. Own components are folders with `index.tsx`.
- `libs/` — third-party integration wrappers: `shadcn-ui/` (flat files, shadcn CLI target), `lucide/`, `next-intl/`, `next-themes/`.
- `constants/`, `hooks/`, `utils/` (`httpUtils`, `httpUtilsAuth`, `httpUtilsHelper`, `cookieUtils`, `cacheUtils`, `logUtils`) — no barrel files; import each from its own path.
- `proxy.ts` — locale negotiation, delegates to `libs/next-intl/configs/proxy.ts`.
- `@/*` maps to `src/*`. Cache Components are on (`cacheComponents: true`) with `cacheLife` profiles `api` / `apiShort` / `apiLong` / `apiPrivate`.

### Environment

Neither app reads a `.env` chosen by a file — the **start script** sets the environment variable that selects it.

- Server: `NODE_ENV` (set by `cross-env` in each `start:*` script) → loads `.env.<NODE_ENV>.local` → `.env.<NODE_ENV>` → `.env`, first match wins.
- Client: `APP_ENV` (same order, via `load-env.mjs` / `load-env-cli.mjs`).
- Only `.env.example` is committed. Server keys are documented in `apps/server/README.md`; client needs `PORT`, `API_URL`, `LOG_LEVEL`.

### Git hooks

`husky` `pre-commit` runs `lint-staged` (ESLint `--fix` on the touched app), then bumps the root patch version and re-stages `package.json`.

### Where to read more

- `apps/server/README.md` — env matrix, Docker, security hardening, Swagger, versioning, SWC build.
- `apps/client/README.md` — structure, Storybook, `httpUtils`/`cookieUtils`/`cacheUtils` usage, i18n, caching and revalidation.
