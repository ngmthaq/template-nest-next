# Coding Conventions

When these notes and the code disagree, the code and its lint/format configs win — update this file.

---

## 1. Structure

```
apps/server/src/
  core/        # Cross-cutting infra, every module @Global; core.module.ts aggregates them
               # bull cache config event-emitter http mail prisma schedule security
               # throttler websocket winston
  feature/     # Domain modules (health, cache, auth, user…)
  shared/      # Reusable primitives: config/ (handle*(app) helpers), dto/ guards/ pipes/
  generated/   # GENERATED — never edit, lint, or cover
apps/server/prisma/schema/   # Multi-file schema, ONE MODEL PER FILE
apps/client/src/
  app/(routes)/[locale]/   # Every page lives under a locale segment
  assets/css/    # globals.css (Tailwind v4 entry)
  components/    # Atomic Design: atoms → molecules → organisms → templates
  constants/  hooks/  utils/
  libs/          # Third-party wrappers: shadcn-ui, lucide, next-intl, next-themes
  proxy.ts       # Must sit beside app/; delegates to libs/next-intl/configs/proxy
packages/   # Shared workspace packages (none yet)
docs/       # Agent plan files: <YYYY-MM-DD-HH-MM-SS>-<slug>.md
```

- Server: infra everyone needs → `core/`; a business domain → `feature/`; a reusable primitive with
  no infra of its own → `shared/`.
- Client: presentational → `components/` (by atomic level); third-party adapters →
  `libs/<package>/`; framework-agnostic logic → `utils/`.
- **No barrel files** — import from the owning file (`@/utils/httpUtils`, not `@/utils`). The one
  exception is a component folder's `index.tsx`, which _is_ the component.

---

## 2. Formatting and linting

Never hand-format. `pnpm <app> format` / `pnpm <app> lint` (Prettier runs through ESLint, so lint
fixes formatting too).

Prettier, identical in both apps: `singleQuote`, `semi`, `trailingComma: all`, `tabWidth: 2`,
`printWidth: 100`, `bracketSpacing`, `arrowParens: always`, `endOfLine: lf`. The client adds
`prettier-plugin-tailwindcss`, so class order is sorted for you.

ESLint 9 flat config, one per app. Both: `simple-import-sort` for imports _and_ exports (**error** —
never hand-order), `no-unsanitized/*`, `no-eval`, `no-new-func`, `no-script-url`.

- **Server** — `recommendedTypeChecked` + `eslint-plugin-security`. Deliberate deviations, keep
  them: `no-explicit-any` off; `no-floating-promises` and `no-unsafe-argument` warn;
  `security/detect-object-injection` off (false positives on `obj[key]`; TS key types constrain it).
- **Client** — `eslint-config-next`, `jsx-a11y` **strict** (target is WCAG 2.1 AA),
  `better-tailwindcss`, `eslint-plugin-storybook`, plus `eqeqeq` smart, `no-var`, `prefer-const`,
  `object-shorthand`. `no-console` warns except `warn`/`error` — use `logUtils`. `react/no-danger`
  is an error. Unused vars warn unless `_`-prefixed. Tailwind _ordering_ rules are off (Prettier
  sorts); `enforce-canonical-classes` and `no-duplicate-classes` are errors.
- **Ignored** — server: `dist/`, `coverage/`, `src/generated/`, `eslint.config.mjs`. Client:
  `.next/`, `out/`, `build/`, `coverage/`, `next-env.d.ts`, `AGENTS.md`, `CLAUDE.md`.

---

## 3. Naming

| Kind                     | Pattern                                           | Example                                        |
| ------------------------ | ------------------------------------------------- | ---------------------------------------------- |
| NestJS building block    | `name.role.ts` (kebab-case)                       | `health.service.ts`, `pagination-query.dto.ts` |
| NestJS core infra module | `core-<concern>.module.ts`                        | `core-cache.module.ts`                         |
| NestJS domain module     | `<domain>.module.ts`                              | `health.module.ts`                             |
| Bootstrap helper         | `<concern>.config.ts`                             | `cors.config.ts`                               |
| DI token file            | `<domain>.constants.ts`                           | `health.constants.ts`                          |
| Prisma model             | one model per `<model>.prisma`                    | `user.prisma`                                  |
| Client hook              | `use<Thing>.ts`                                   | `useClickOutside.ts`                           |
| Client util              | `<thing>Utils.ts`                                 | `cookieUtils.ts`                               |
| Own client component     | `PascalCase/index.tsx` folder                     | `templates/AppStatusTemplate/index.tsx`        |
| shadcn/ui component      | flat kebab-case `.tsx`                            | `libs/shadcn-ui/button.tsx`                    |
| Test / story             | `<source>.spec.ts(x)` / `.stories.tsx`, colocated | `hash.service.spec.ts`                         |
| Plan doc                 | `<YYYY-MM-DD-HH-MM-SS>-<slug>.md`                 | `docs/2026-08-25-14-30-08-husky-hook.md`       |

> shadcn components stay flat because its CLI always writes `<aliases.ui>/<name>.tsx` — given
> `button/index.tsx` it writes a fresh `button.tsx` that silently shadows yours.

- `PascalCase` — classes, components, types, enums. NestJS classes end in their role
  (`HealthService`, `NonProductionGuard`).
- `camelCase` — variables, functions, object keys, i18n namespaces and keys.
- `SCREAMING_SNAKE_CASE` — DI tokens (`HEALTH_MYSQL_POOL`) and env keys (`CORS_ORIGIN`).
- `<ComponentName>Props` for prop interfaces, `Use<HookName>Options` for hook options.
- Booleans read as predicates (`isCopied`, `enabled`); `_` prefix marks an unused binding.

---

## 4. Inside a file

Order: imports (`import type` for type-only) → constants and DI tokens → types/interfaces/DTOs used
by the main export → the main export → private helpers.

**Server classes:** `public constructor` (deps `private readonly`) → lifecycle hooks → public
methods in caller-meaningful order → private helpers in call order. Access modifiers are always
explicit, constructor included.

**React components:** `'use client'` first _only_ when genuinely needed (Server Components are the
default), then imports, props interface, component.

**Props come in as one `props` object, destructured on the first line** — never in the parameter
list. It keeps the signature short as props grow and leaves `props` available to forward or log.
Exception: `libs/shadcn-ui/**`, which the CLI rewrites.

```tsx
export default function GlobalError(props: GlobalErrorProps) {
  const { error, retry } = props;
```

**Route metadata always uses `generateMetadata()`, never an exported `metadata` constant** — only
the function form can `await getTranslations()` or read `params`. A route with nothing to await
still uses the sync function form, so adding a translation later is not a rewrite.

---

## 5. Comments

**Every comment is at most two lines of content** — one by default, two when the "why" needs it,
never three. Applies everywhere: JSDoc, `//`, YAML `#`, Dockerfile, Prisma. The `/**` and `*/`
delimiters don't count. Compress the reasoning rather than deleting it; what survives the squeeze
was the load-bearing part. **When two lines aren't enough, it belongs in the app's README** — point
at it by section name from a JSDoc.

- JSDoc every exported class, and any method whose behaviour isn't obvious from its signature. Skip
  it where name and types already say everything (`removeAccessToken`, a wiring-free `*.module.ts`).
- Lead with verb and subject: "Broadcast to every connected client", not "This method is
  responsible for…". Cross-reference with `{@link Other}` instead of restating.
- Inline `//` explains **why**, never what: `// jsdom has no window.matchMedia, which next-themes
calls eagerly on mount.`
- Never restate a type signature, list a class's members, enumerate imports, or repeat a config
  value three lines below — all of it drifts.
- Swagger `description` strings are public API prose, not comments — the two-line cap exempts them.
- `// Arrange` / `// Act` / `// Assert` are structural markers, not prose (§10).

---

## 6. Validation and errors

- **Server** — `class-validator` + `class-transformer` DTOs in `shared/dto/` or the owning feature;
  the global `ValidationPipe` whitelists and transforms. Reuse `IdParamDto`, `UuidParamDto`,
  `EmailDto`, `PaginationQueryDto` rather than redeclaring params.
- **Client** — `formik` + `yup`. The server DTO is the authority; never trust the client alone.
- Every controller route and response class carries Swagger decorators (`@ApiOperation`,
  `@ApiOkResponse`, `@ApiQuery`, `@ApiParam`, `@ApiProperty`) with a realistic `example` — they are
  the API's public documentation.
- Throw NestJS `HttpException` subclasses and let the framework serialise. Guards enforce access.
  Probes that must never throw catch per-indicator and report `{ status: 'down', error }`.
- `utils/httpUtils` throws named classes — narrow with `instanceof`: `HttpUtilsResponseError`
  (non-2xx, carries `status` + parsed `body`), `HttpUtilsTimeoutError` (60s default),
  `HttpUtilsNetworkError`, `HttpUtilsRequestCanceledError`.
- Route failures surface via `error.tsx` / `not-found.tsx` under `[locale]`; `global-error.tsx` and
  `global-not-found.tsx` are the last resort.

---

## 7. Logging

Server: `nest-winston`, level from `LOG_LEVEL` — inject the logger, never `console.log`. Client:
`utils/logUtils`. Never log secrets, tokens, cookie values, or bodies carrying credentials.

---

## 8. Database and cache

- Prisma 7, multi-file schema, **one model per file**; `schema.prisma` holds only `generator` and
  `datasource`. The URL is built in `prisma.config.ts` from `MYSQL_*` — not in `schema.prisma`.
- Reach the DB only through the global `PrismaService`. Workflow: edit a model → `pnpm server
db:migrate` → `pnpm server prisma:generate`. Migrations are committed; `db:push` is throwaway
  local iteration only. Never import Prisma types from outside `src/generated/prisma/**`.
- **Server cache** — `@nestjs/cache-manager` over Redis, TTL from `CACHE_TTL`; the `cache` feature
  exposes search/delete behind `NonProductionGuard`.
- **Client cache** — Cache Components are on. Opt in with `'use cache'` and _always_ pair it with a
  `cacheLife` profile (`api`, `apiShort`, `apiLong`, `apiPrivate`) and `cacheUtils.tag(path,
params)`. Tags are hierarchical, so revalidating a parent busts everything beneath it.
- A `use cache` scope can't read cookies — unauthenticated or user-identical data only. Per-user
  data uses `'use cache: private'` with `apiPrivate`, or no cache behind `<Suspense>`. Never pass an
  access token to a cached function; it becomes part of the key.
- Invalidate inside the Server Action that wrote: `cacheUtils.update()` for read-your-own-writes,
  `revalidate()` for background refresh, `revalidateRoute()` for a route. `cacheUtils` is
  server-only.

---

## 9. Client ↔ server, third-party, i18n

- All calls go through `utils/httpUtils` (axios on the fetch adapter). It imports `server-only`, so
  importing it from a Client Component is a build error. Endpoints live in `constants/apiEndpoints`,
  cookie/storage keys in `constants/storageKeys`.
- `httpUtils` owns the `access_token` / `refresh_token` cookies (`path: '/'`, `sameSite: 'strict'`,
  `secure` in production) via `cookieUtils`. `get`/`delete` take `Record<string, string>` params;
  `post`/`put`/`patch` take a JSON body; `*FormData` variants leave `Content-Type` alone. Base URL
  comes from `API_URL` — never hardcode a host. Send `X-API-Version` for version-pinned routes.
- Every configured third-party package gets one folder under `libs/` — never scatter its setup. On
  the server, that wiring is a `Core*Module`. Add shadcn parts with `pnpm client shadcn-ui:add
<name>`; merge classes with `cn()`.
- Import `Link`, `redirect`, `usePathname`, `useRouter` from `@/libs/next-intl/configs/navigation`,
  **not** `next/*`, so the locale stays in the URL.
- `next-intl` with locale-prefixed URLs; `routing.ts` is the single source of truth. One namespace
  per component or screen. Branching (plurals, `select`, skeletons) lives in the ICU message, not
  JSX. Format with `useFormatter()` / `getFormatter()`, never `toLocaleString`.
- `useTranslations()` in Server _and_ Client Components, `getTranslations()` in async server code.
  Route Handlers and Server Actions must pass the locale explicitly. Missing keys are compile
  errors, so adding a locale = copy `messages/en.json`, translate, add the code to `routing.ts`.

---

## 10. Testing

**Code-First**: ship the implementation, then cover it. Tests are **colocated** as
`<source>.spec.ts(x)` — no `test/` tree, no e2e suite. Both apps `passWithNoTests`.

- Server: Jest 30 + ts-jest, `testEnvironment: node`. Coverage excludes `src/generated/**` and
  `src/shared/config/**` (bootstrap helpers only hand a literal to the framework).
- Client: Vitest 3 + jsdom + Testing Library, `globals: true`, `server-only` stubbed. Coverage
  excludes stories, `app/(routes)/**`, `constants/`, `libs/`.
- **Every test body carries `// Arrange`, `// Act`, `// Assert`.** Shared setup in `beforeEach`,
  cleanup in `afterEach`. Names are full sentences about behaviour:
  `it('returns false when comparing a wrong value against a stored hash')`.
- **DTOs are tested**, colocated. Drive them as the global pipe does —
  `plainToInstance(Dto, input, { enableImplicitConversion: true })` then `validateSync` — and assert
  the failing constraint key (`min`, `isInt`), never the message. Cover the accepted case, every
  boundary, string coercion, and defaults on empty input.
- Prefer a hand-rolled stub over a Nest testing module when the class has no framework dependency.
- Components under `src/components/` also get `*.stories.tsx`; `.storybook/preview.tsx` reproduces
  the root provider tree so stories match the app.

---

## 11. Security

- Never commit a `.env*` other than `.env.example`, and never read env **values** — keys only.
- No `eval`, `new Function`, `javascript:` URLs, or `dangerouslySetInnerHTML`.
- `HashService` (bcrypt) for passwords; `EncryptionService` (AES-256-GCM) only for secrets that must
  be recoverable.
- Bootstrap hardening lives in `shared/config/` — helmet, CORS, compression, cookie-parser — driven
  by `ConfigService`, not literals. Rate limiting is a global three-tier `ThrottlerGuard`.
- Swagger is unmounted when `NODE_ENV=production`; dev-only routes sit behind `NonProductionGuard`.
- Every export of a `'use server'` file is a network-reachable endpoint — never accept an arbitrary
  path or identifier without an allowlist.

---

## 12. Environment

- The **start script** sets the variable, not a file: `NODE_ENV` (server), `APP_ENV` (client), via
  `cross-env`. Load order, first match wins: `.env.<ENV>.local` → `.env.<ENV>` → `.env`.
- Read config through `ConfigService` with a typed default —
  `this.config.get<number>('port', 3000)` — never `process.env` in feature code. Defaults live in
  `core/config/configuration.ts`.
- Adding a variable = default in `configuration.ts` + an entry in `.env.example` + a row in
  `apps/server/README.md`.

---

## 13. Git

See [GIT_CONVENTIONS](./GIT_CONVENTIONS.md).
