# Coding Conventions

Derived from the current setup. When these notes and the code disagree, the code and its lint/format
configs win — update this file to match.

---

## 1. Project structure

```
.
├── apps/
│   ├── server/                     # NestJS API
│   │   ├── prisma/
│   │   │   ├── schema/             # Multi-file schema, ONE MODEL PER FILE
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── core/               # Cross-cutting infra; every module is @Global
│   │       │   ├── bull/  cache/  config/  event-emitter/  http/  mail/
│   │       │   ├── prisma/  schedule/  security/  throttler/  websocket/  winston/
│   │       │   └── core.module.ts  # Aggregates every Core* module
│   │       ├── feature/            # Domain modules (health, cache, auth, user…)
│   │       │   └── feature.module.ts
│   │       ├── shared/             # Reusable primitives
│   │       │   ├── config/         # handle*(app) bootstrap helpers
│   │       │   ├── dto/  guards/  pipes/
│   │       ├── generated/prisma/   # GENERATED — never edit, never lint, never cover
│   │       ├── app.module.ts
│   │       └── main.ts
│   └── client/                     # Next.js App Router front-end
│       └── src/
│           ├── app/(routes)/[locale]/   # Every page lives under a locale segment
│           ├── assets/css/              # globals.css (Tailwind v4 entry point)
│           ├── components/              # Atomic Design: atoms → molecules → organisms → templates
│           ├── constants/               # apiEndpoints, storageKeys
│           ├── hooks/                   # Shared client hooks
│           ├── libs/                    # Third-party wrappers: shadcn-ui, lucide, next-intl, next-themes
│           ├── utils/                   # httpUtils, cookieUtils, cacheUtils, logUtils
│           └── proxy.ts                 # Must sit beside app/; delegates to libs/next-intl/configs/proxy
├── packages/                       # Shared workspace packages (none yet)
└── docs/                           # Agent plan files: <YYYY-MM-DD-HH-MM-SS>-<slug>.md
```

**Placement rules**

- Server: infrastructure everyone needs → `core/`. A business domain → `feature/`. A reusable
  primitive with no infrastructure of its own → `shared/`.
- Client: presentational building blocks → `components/` (by atomic level). Anything that exists to
  adapt a third-party package → `libs/<package-name>/`. Framework-agnostic logic → `utils/`.
- **No barrel files.** There is no `index.ts` re-export layer; import each symbol from its own file
  (`@/utils/httpUtils`, not `@/utils`). The one exception is a component folder's own
  `index.tsx`, which *is* the component.

---

## 2. Formatting

Both apps ship an identical `.prettierrc` (the client adds a Tailwind plugin). Do not hand-format —
run `pnpm server format` / `pnpm client format`.

| Setting          | Value                    |
| ---------------- | ------------------------ |
| `singleQuote`    | `true`                   |
| `semi`           | `true`                   |
| `trailingComma`  | `all`                    |
| `tabWidth`       | `2` (spaces)             |
| `printWidth`     | `100`                    |
| `bracketSpacing` | `true`                   |
| `arrowParens`    | `always`                 |
| `endOfLine`      | `lf`                     |

Client only: `plugins: ["prettier-plugin-tailwindcss"]` with
`tailwindStylesheet: "./src/assets/css/globals.css"` — Tailwind class order is sorted for you.

---

## 3. Linting

ESLint 9 flat config, one per app. Prettier runs *through* ESLint (`prettier/prettier: error`), so
`pnpm lint` fixes formatting too.

**Shared by both apps**

- `simple-import-sort/imports` and `simple-import-sort/exports` — **error**. Never hand-order
  imports; let the fixer group them (node builtins → external → internal → relative).
- `no-unsanitized/method`, `no-unsanitized/property`, `no-eval`, `no-new-func`, `no-script-url`.

**Server extras** — `typescript-eslint` `recommendedTypeChecked` (type-aware, `projectService: true`)
plus `eslint-plugin-security`. Deliberate deviations, keep them:

- `@typescript-eslint/no-explicit-any`: **off**
- `@typescript-eslint/no-floating-promises`, `no-unsafe-argument`: **warn**
- `security/detect-object-injection`: **off** — too many false positives on `obj[key]`; TS key types
  already constrain it.

**Client extras** — `eslint-config-next` (core-web-vitals + typescript), `jsx-a11y` **strict**
(the project targets WCAG 2.1 AA), `better-tailwindcss`, `eslint-plugin-storybook`, and:

- `eqeqeq: ['error', 'smart']`, `no-var`, `prefer-const`, `object-shorthand` (warn)
- `no-console: ['warn', { allow: ['warn', 'error'] }]` — use `logUtils`, not bare `console.log`
- `@typescript-eslint/no-unused-vars` warns unless the name starts with `_`
- `react/no-danger` is an **error** — no `dangerouslySetInnerHTML`
- `better-tailwindcss/enforce-canonical-classes` and `no-duplicate-classes` are errors; class
  *ordering* rules are off because Prettier already sorts them.

**Ignored paths** — server: `dist/`, `coverage/`, `src/generated/`, `eslint.config.mjs`.
Client: `.next/`, `out/`, `build/`, `coverage/`, `next-env.d.ts`, `AGENTS.md`, `CLAUDE.md`.

---

## 4. Naming

### Files

| Kind                          | Pattern                        | Example                              |
| ----------------------------- | ------------------------------ | ------------------------------------ |
| NestJS building block         | `name.role.ts` (kebab-case)    | `health.service.ts`, `cache.controller.ts`, `non-production.guard.ts`, `validation.pipe.ts`, `pagination-query.dto.ts` |
| NestJS core infra module      | `core-<concern>.module.ts`     | `core-cache.module.ts`, `core-throttler.module.ts` |
| NestJS domain module          | `<domain>.module.ts`           | `health.module.ts`                   |
| Bootstrap helper              | `<concern>.config.ts`          | `cors.config.ts`, `swagger.config.ts` |
| DI token file                 | `<domain>.constants.ts`        | `health.constants.ts`                |
| Prisma model                  | one model per `<model>.prisma` | `user.prisma`                        |
| Client hook                   | `use<Thing>.ts` (camelCase)    | `useClickOutside.ts`                 |
| Client util                   | `<thing>Utils.ts` (camelCase)  | `cookieUtils.ts`, `httpUtilsAuth.ts` |
| Own client component          | `PascalCase/index.tsx` folder  | `templates/AppStatusTemplate/index.tsx` |
| shadcn/ui component           | flat kebab-case `.tsx`         | `libs/shadcn-ui/button.tsx`          |
| Test                          | `<source>.spec.ts(x)`, colocated | `hash.service.spec.ts`, `index.spec.tsx` |
| Story                         | `<source>.stories.tsx`, colocated | `button.stories.tsx`, `index.stories.tsx` |
| Plan doc                      | `<YYYY-MM-DD-HH-MM-SS>-<slug>.md` | `docs/2026-08-25-14-30-08-root-version-scripts-and-husky-pre-commit.md` |

> **Why shadcn components stay flat:** the shadcn CLI always writes `<aliases.ui>/<name>.tsx`. Given
> `button/index.tsx` it would not find your file, would write a fresh `button.tsx` beside it, and
> that file would win module resolution and silently shadow yours.

### Symbols

- `PascalCase` — classes, React components, types, interfaces, enums. NestJS classes end in their
  role (`HealthService`, `CacheController`, `NonProductionGuard`).
- `camelCase` — variables, functions, methods, object keys, i18n namespaces and message keys.
- `SCREAMING_SNAKE_CASE` — DI tokens (`HEALTH_MYSQL_POOL`) and env keys (`CORS_ORIGIN`).
- Component prop interfaces are `<ComponentName>Props`; hook option interfaces are
  `Use<HookName>Options`.
- Boolean names read as predicates: `isCopied`, `enabled`, `detectFocus`.
- `_`-prefix marks an intentionally unused binding.

---

## 5. Ordering inside a file

1. Imports — sorted by `simple-import-sort`; `import type` for type-only imports.
2. Constants and DI tokens.
3. Types / interfaces / DTO or response classes used by the main export.
4. The main exported class or component.
5. Module-private helpers last.

**Class member order** (server services, controllers, gateways):

1. `public constructor(...)` — injected deps as `private readonly`.
2. Lifecycle hooks (`onModuleInit`, `onModuleDestroy`).
3. Public API methods, in the order they are meaningful to a caller.
4. Private helpers, in call order.

Access modifiers are **explicit** (`public` / `private`), including on the constructor.

**React components:** `'use client'` directive first (only when the component genuinely needs the
client), then imports, then the props interface, then the component. Server Components are the
default — do not add `'use client'` reflexively.

---

## 6. Documentation and comments

### Every comment is at most two lines

**One line by default, two when the "why" genuinely needs it, never three.** This is a hard cap and
it applies to every comment in the repo — JSDoc, inline `//`, YAML `#`, Dockerfile headers, Prisma
schema notes.

"Two lines" means two lines of **content**. The `/**` and `*/` delimiters do not count, so a
one-line JSDoc is three physical lines and that is fine:

```ts
/** Verify a value against a stored hash. Constant-time, per bcrypt. */

/**
 * Reversible AES-256-GCM for data you must recover later — never passwords, which belong in
 * `HashService`. Key derived via scrypt from `ENCRYPTION_KEY`; encrypt/decrypt throw without it.
 */
```

The cap forces the comment to carry only what the code cannot say for itself. It is not licence to
delete the reasoning — compress it. Everything that survives the squeeze is the part that was
actually load-bearing.

**When two lines are not enough, the explanation does not belong in a comment.** Put it in the
app's README and point at it from the code:

```ts
/**
 * The shared {@link CorsOptions}, consumed by both REST and WebSocket so one policy covers both.
 * Throws when credentials meet a reflecting origin — see "CORS origins and credentials" in the README.
 */
```

That keeps long-form prose in one place, where it can be read in order and stays discoverable,
instead of a wall of text a reader has to scroll past to reach the code.

### What to write

- JSDoc on every exported class and on any method whose behaviour is not obvious from the signature.
  Skip it where the name and types already say everything (`removeAccessToken`, a `*.module.ts`
  with no non-obvious wiring).
- Lead with the verb and the subject, not the ceremony. Write "Broadcast to every connected client",
  not "This method is responsible for broadcasting…".
- Use `{@link OtherThing}` to cross-reference rather than restating what the other thing does.
- Inline `//` comments explain **why**, never what:
  `// Low cost factor keeps bcrypt fast enough for the unit suite.`
  `// jsdom has no window.matchMedia, which next-themes calls eagerly on mount.`
- Do not restate the type signature, list a class's own members, enumerate what a module imports, or
  repeat a config value that sits three lines below. All of that drifts the moment the code changes.
- Swagger decorators (`@ApiOperation`, `@ApiOkResponse`, `@ApiQuery`, `@ApiParam`, `@ApiProperty`)
  are the API's public documentation — every controller route and response class carries them, with
  a realistic `example`. Their `description` strings are prose for API consumers, not code comments,
  so the two-line cap does not apply to them.
- `// Arrange` / `// Act` / `// Assert` markers are structural, not prose — see §15.

---

## 7. Validation

- **Server** — `class-validator` + `class-transformer` DTOs under `shared/dto/` or the owning
  feature. The global `ValidationPipe` (`shared/pipes/validation.pipe.ts`) whitelists and transforms.
  Reuse the shared DTOs (`IdParamDto`, `UuidParamDto`, `EmailDto`, `PaginationQueryDto`) instead of
  redeclaring the same params.
- **Client** — `formik` + `yup` for forms. Never trust the client alone; the server DTO is the
  authority.
- i18n keys are type-checked against `messages/en.json`, so a typo is a compile error.

---

## 8. Error handling

**Server** — throw NestJS `HttpException` subclasses (`BadRequestException`, `ForbiddenException`,
…) and let the framework serialise them. Guards enforce access (`NonProductionGuard` blocks
dev-only routes in production). Health-style probes that must never throw catch per-indicator and
report `{ status: 'down', error }` instead of failing the whole request.

**Client** — `utils/httpUtils` throws named error classes; narrow with `instanceof`:

| Class                            | Meaning                                        |
| -------------------------------- | ---------------------------------------------- |
| `HttpUtilsResponseError`         | Non-2xx; carries `status` and parsed `body`.   |
| `HttpUtilsTimeoutError`          | Exceeded the configured timeout (60s default). |
| `HttpUtilsNetworkError`          | Connection failed before a response.           |
| `HttpUtilsRequestCanceledError`  | Aborted via an `AbortSignal`.                  |

Route-level failures surface through `error.tsx` / `not-found.tsx` under `[locale]`, with
`global-error.tsx` and `global-not-found.tsx` as the last resort.

---

## 9. Logging

- **Server** — `nest-winston`; level from `LOG_LEVEL`. Inject the logger, never `console.log`.
- **Client** — `utils/logUtils`. `no-console` warns; only `console.warn` / `console.error` are
  allowed, and even those should be a last resort.
- Never log secrets, tokens, cookie values, or full request bodies containing credentials.

---

## 10. Database

- Prisma 7, multi-file schema in `prisma/schema/` — **one model per file**, plus `schema.prisma`
  holding only `generator` and `datasource`.
- The connection URL is built in `prisma.config.ts` from the `MYSQL_*` env keys; it is **not** in
  `schema.prisma`.
- Access the DB only through `PrismaService` (`core/prisma/`), which is global.
- Workflow: edit a `*.prisma` model → `pnpm server db:migrate` → `pnpm server prisma:generate`.
- `src/generated/prisma/**` is build output. Never edit it, never import Prisma types from anywhere
  else, and keep it out of lint, tsconfig, and coverage.
- Migrations are committed; `db:push` is for throwaway local iteration only.

---

## 11. Cache

- **Server** — `@nestjs/cache-manager` over Redis (`keyv` + `@keyv/redis`). TTL from `CACHE_TTL`.
  The `cache` feature module exposes search/delete endpoints, guarded by `NonProductionGuard`.
- **Client** — Cache Components are on (`cacheComponents: true`). Opt in per function with
  `'use cache'` and always pair it with a `cacheLife` profile (`api`, `apiShort`, `apiLong`,
  `apiPrivate`) and a `cacheUtils.tag(path, params)` call.
- `cacheUtils` tags hierarchically: caching `/items/1` writes `path:/`, `path:/items`,
  `path:/items/1`, so revalidating a parent busts everything beneath it.
- A `use cache` scope cannot read cookies — so it fits **unauthenticated or user-identical** data
  only. Per-user data uses `'use cache: private'` with the `apiPrivate` profile, or no cache at all
  behind `<Suspense>`.
- Never pass a user access token as a cached function argument — it becomes part of the cache key.
- Invalidate inside the Server Action that performed the write: `cacheUtils.update()` for
  read-your-own-writes, `revalidate()` for background refresh, `revalidateRoute()` for a whole route.
- `cacheUtils` is server-only; a Client Component must never import it.

---

## 12. Client ↔ server integration

- All calls go through `utils/httpUtils` (axios with the fetch adapter, wrapped in
  `httpUtilsHelper` / `httpUtilsAuth`). It imports `server-only`, so it runs on the server only —
  importing it from a Client Component is a build error.
- Endpoint paths belong in `constants/apiEndpoints.ts`; cookie/storage keys in
  `constants/storageKeys.ts`.
- `httpUtils` owns the `access_token` / `refresh_token` cookies (`path: '/'`,
  `sameSite: 'strict'`, `secure` in production) and delegates storage to `cookieUtils`.
- `get`/`delete` take `Record<string, string>` query params; `post`/`put`/`patch` take a JSON body;
  the `*FormData` variants leave `Content-Type` alone so the browser sets the multipart boundary.
- The API base URL comes from `API_URL` (including its `/api` prefix) — never hardcode a host.
- Send `X-API-Version` when a route is version-pinned; the server defaults to `1`.

---

## 13. Third-party integrations

- Every third-party package that needs configuration gets its own folder under `libs/` — never
  scatter its setup across the app. Current: `shadcn-ui/`, `lucide/`, `next-intl/`, `next-themes/`.
- Import navigation helpers (`Link`, `redirect`, `usePathname`, `useRouter`) from
  `@/libs/next-intl/configs/navigation`, **not** from `next/link` or `next/navigation`, so the
  active locale stays in the URL.
- Add shadcn components with `pnpm client shadcn-ui:add <name>` so `components.json` aliases apply
  (`ui` → `@/libs/shadcn-ui`, `utils` → `@/libs/shadcn-ui/cn`).
- Merge Tailwind classes with `cn()` from `@/libs/shadcn-ui/cn`.
- On the server, third-party wiring lives in a `Core*Module` under `core/`.

---

## 14. Internationalization

- `next-intl` with locale-prefixed URLs; `routing.ts` is the single source of truth for locales.
- One namespace per component or screen; namespaces and keys are camelCase.
- Branching (plurals, `select`, date/number skeletons) lives in the ICU message, not in JSX.
- `useTranslations()` in Server *and* Client Components; `getTranslations()` in async server code.
- Format dates, numbers and currency with `useFormatter()` / `getFormatter()` — never
  `toLocaleString`.
- Route Handlers and Server Actions cannot resolve the locale implicitly — pass it explicitly:
  `getTranslations({ locale, namespace })`.
- Adding a locale = copy `messages/en.json`, translate, add the code to `routing.ts`. Missing keys
  are compile errors.

---

## 15. Testing

Workflow is **Code-First**: ship the implementation, then cover it.

- Tests are **colocated** with the source as `<source>.spec.ts(x)` — there is no `test/` tree and no
  e2e suite.
- Server: Jest 30 + ts-jest, `testEnvironment: node`, `testRegex: src/.*\.spec\.ts$`. Coverage
  excludes `src/generated/**`.
- Client: Vitest 3 + jsdom + Testing Library, `globals: true`, `@` alias, `server-only` replaced by
  `vitest.server-only-stub.ts`. Coverage excludes stories, `app/(routes)/**`, `constants/`, `libs/`.
- Both run with `passWithNoTests`.
- **Every test body carries explicit `// Arrange`, `// Act`, `// Assert` comments.** Shared setup
  goes in `beforeEach`; cleanup (`vi.useRealTimers()`, `vi.restoreAllMocks()`) in `afterEach`.
- Test names are full sentences describing behaviour, not method names:
  `it('returns false when comparing a wrong value against a stored hash')`.
- Prefer constructing the unit directly with a hand-rolled stub over spinning up a Nest testing
  module when the class has no framework dependency.
- Components under `src/components/` also get a colocated `*.stories.tsx`; `.storybook/preview.tsx`
  reproduces the root provider tree (theme + locale) so stories render with the app's real look.

---

## 16. Security

Non-negotiable, and mostly already enforced by lint:

- Never commit a `.env*` file other than `.env.example`, and never read env **values** — keys only.
- No `eval`, `new Function`, `javascript:` URLs, or `dangerouslySetInnerHTML`.
- Hash passwords with `HashService` (bcrypt); use `EncryptionService` (AES-256-GCM) only for
  secrets that must be recoverable.
- Bootstrap hardening lives in `shared/config/` — helmet, CORS, compression, cookie-parser — driven
  by `ConfigService`, not literals. Rate limiting is a global three-tier `ThrottlerGuard`.
- Swagger is not mounted when `NODE_ENV=production`; dev-only routes sit behind `NonProductionGuard`.
- A `'use server'` file's every export is a network-reachable endpoint — never accept an arbitrary
  path or identifier from the caller without an allowlist.

---

## 17. Environment and configuration

- The **start script** sets the environment variable, not a file: server uses `NODE_ENV`, client
  uses `APP_ENV`, both via `cross-env`.
- Load order, first match wins: `.env.<ENV>.local` → `.env.<ENV>` → `.env`.
- Read server config through `ConfigService` with a typed default —
  `this.config.get<number>('port', 3000)` — never `process.env` directly in feature code. Defaults
  live in `core/config/configuration.ts`.
- Adding a variable means: add it to `configuration.ts` with a default, document it in
  `.env.example`, and add a row to the table in `apps/server/README.md`.

---

## 18. Git

- `husky` `pre-commit` runs `lint-staged` (ESLint `--fix` on the touched app), then
  `pnpm version patch --no-git-tag-version` and re-stages the root `package.json`. Expect the
  version bump in every commit.
- Commit messages follow Conventional Commits with a scope:
  `refactor(client): move httpUtils onto axios with the fetch adapter`.
  Scopes in use: `client`, `server`, `root`.
