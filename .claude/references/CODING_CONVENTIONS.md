# Coding Conventions

## Project Structure

```
.
├── apps/
│   ├── server/                  # NestJS API
│   │   ├── prisma/
│   │   │   ├── schema/          # schema.prisma + one <model>.prisma per model
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── main.ts          # bootstrap: calls handleXxx(app) setup functions
│   │       ├── app.module.ts
│   │       ├── core/            # global infra modules (config, prisma, cache, bull, mail, ...)
│   │       ├── feature/         # business modules (auth, user, cache, health)
│   │       ├── shared/          # config/, dto/, guards/, pipes/
│   │       └── generated/       # Prisma client (generated, do not edit)
│   └── client/                  # Next.js app
│       ├── vitest.helpers.tsx   # shared test helpers, imported as `@vitest-helpers`
│       └── src/
│           ├── app/(routes)/[locale]/   # pages, layouts, error, not-found, route-only actions.ts
│           ├── components/      # atoms/, molecules/, organisms/, templates/
│           ├── hooks/           # useXxx.ts
│           ├── utils/           # xxxUtils.ts
│           ├── schemas/         # xxxSchema.ts: Yup schema factories + inferred form types
│           ├── constants/       # camelCase `as const` objects
│           ├── libs/            # third-party wrappers: shadcn-ui/, next-intl/, next-themes/, lucide/
│           ├── assets/css/      # globals.css (Tailwind entry)
│           └── proxy.ts         # request proxy: next-intl routing + production gate for dev-only routes
├── packages/                    # shared packages (empty for now)
├── scripts/                     # docker infra and deploy scripts
└── docs/                        # agent plan files
```

## Formatting (Prettier + ESLint)

Both apps use the same Prettier config:

- Single quotes, semicolons, trailing commas everywhere.
- 2 spaces, max line width 100, LF line endings.
- Always use parens on arrow args: `(x) => x`.
- Imports and exports are sorted by `simple-import-sort`. Packages first, then a blank line, then local imports.
- Run `pnpm <server|client> lint` and `format` before you finish. Husky runs ESLint on staged files.

Client only:

- Tailwind classes are sorted by `prettier-plugin-tailwindcss`. No duplicate or conflicting classes.
- `jsx-a11y` strict rules are on. Target WCAG 2.1 AA.
- No `console.log`. Use `logUtils`. Only `console.warn` / `console.error` are allowed.
- Use `const`, never `var`. Use `===` (`== null` is allowed).
- Unused vars and args must start with `_`.
- No `dangerouslySetInnerHTML`, no `javascript:` URLs, no `target="_blank"` without `rel`.

Server only:

- `eslint-plugin-security` is on. No `eval`, `new Function`, unsafe regex, non-literal regex, non-literal `fs` paths, or `child_process`.
- `any` is allowed but avoid it. Floating promises give a warning — use `await` or `void`.

## Comments

- Add short JSDoc (`/** ... */`) to exported classes, public methods, DTOs, and constants, like the current code.
- Keep JSDoc to one or two lines. Say what it does or why, not how.
- Add inline `//` comments only for non-obvious reasons (a workaround, a gotcha).
- Put an `eslint-disable-next-line <rule> -- <reason>` comment when you must turn off a rule.

## Server (NestJS)

### Naming

| Item                    | Rule                                             | Example                                          |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Files                   | kebab-case + type suffix                         | `cache.service.ts`, `id-param.dto.ts`            |
| Core wrapper modules    | `core-<name>.module.ts`, class `Core<Name>Module` | `core-cache.module.ts` → `CoreCacheModule`       |
| Classes                 | PascalCase + type suffix                         | `CacheService`, `PaginationQueryDto`, `NonProductionGuard` |
| Setup functions         | `handle<Thing>(app)` in `shared/config/`         | `handleCors`, `handleSwagger`                    |
| DI tokens               | `UPPER_SNAKE_CASE` in `<feature>.constants.ts`   | `HEALTH_MYSQL_POOL`                              |
| Static class constants  | `UPPER_SNAKE_CASE`, `private static readonly`    | `MAX_PATTERN_LENGTH`                             |
| Variables and methods   | camelCase                                        | `compileMatcher`, `starKeyIndex`                 |

### Module layout

- One folder per feature in `feature/<name>/`: `<name>.module.ts`, `<name>.controller.ts`, `<name>.service.ts`, `<name>.constants.ts` if needed.
- Register new feature modules in `feature/feature.module.ts`. Register new infra modules in `core/core.module.ts` (they are `@Global`).
- Shared DTOs, guards, and pipes go in `shared/`.
- Use relative imports. There is no path alias on the server.

### Code order in a class

1. Static constants.
2. Instance fields (e.g. `private readonly logger = new Logger(X.name)`).
3. `public constructor(...)` with `private readonly` injected deps.
4. Public methods (lifecycle hooks like `onModuleInit` go with them).
5. Private helpers last.

Always write `public` / `private` / `protected` on members.

In a service file, response classes (e.g. `CacheEntry`) may sit above the service class.

### Controllers and Swagger

- Use `@Controller({ path, version })`. Versioning is on.
- Every controller has `@ApiTags`. Every endpoint has `@ApiOperation` and `@Api*Response`. Add `@ApiParam` / `@ApiQuery` for inputs.
- Controllers stay thin. Business logic goes in the service.
- Return typed values (`Promise<CacheEntry[]>`), not `any`.

### Validation

- Use DTO classes with `class-validator` and `class-transformer` decorators.
- Every DTO field also has `@ApiProperty` or `@ApiPropertyOptional`.
- Use `!` for required fields and defaults for optional ones (`page: number = 1`).
- The global `ValidationPipe` uses `whitelist`, `forbidNonWhitelisted`, and `transform`. Do not add per-route pipes for the same job.

### Error handling

- Throw Nest HTTP exceptions (`BadRequestException`, `NotFoundException`, …) with a clear message.
- Use try/catch only when a failure must become a normal value (e.g. health indicators return `down`).
- Catch errors as `unknown`. Check `instanceof Error` before reading `.message`.

### Config and env

- Read config only through `ConfigService` (`config.get<T>('key', default)` or `config.getOrThrow<T>('key')`).
- Add new env vars in `core/config/configuration.ts` and in `.env.example` (key only).
- Do not read `process.env` inside services.

### Database (Prisma)

- Inject `PrismaService` and use its model delegates (`this.prisma.user`).
- Add one model per file in `prisma/schema/<model>.prisma`.
- After a schema change: `pnpm server prisma:generate`, then `pnpm server db:migrate`.
- Never edit `src/generated/`.

### Cache, queues, logging, security

- Cache: inject `CACHE_MANAGER` (`Cache` from cache-manager). Redis store via Keyv.
- Queues: BullMQ via `@nestjs/bullmq`. Events: `@nestjs/event-emitter`. Cron: `@nestjs/schedule`.
- Logging: `new Logger(ClassName.name)`. Winston is the global logger.
- Hashing and encryption: use `HashService` and `EncryptionService` from `core/security`.
- Mail: use `MailService` from `core/mail`.
- Outgoing HTTP: use `HttpService` from `@nestjs/axios` (set up in `core/http`).

## Client (Next.js)

> This Next.js version has breaking changes. Read `apps/client/AGENTS.md` and `node_modules/next/dist/docs/` before you write client code.

### Naming

| Item                | Rule                                            | Example                                  |
| ------------------- | ----------------------------------------------- | ---------------------------------------- |
| Components          | PascalCase folder with `index.tsx`              | `components/templates/AppStatusTemplate/index.tsx` |
| Props type          | `<Component>Props` interface                    | `AppStatusTemplateProps`                 |
| Hooks               | `useXxx.ts`, camelCase                          | `useCopyToClipboard.ts`                  |
| Hook types          | `Use<Name>Options`, `Use<Name>Result`, exported | `UseCopyToClipboardResult`               |
| Utils               | `xxxUtils.ts`: a class + one exported instance  | `LogUtils` → `logUtils`                  |
| Constants           | camelCase object with `as const`                | `apiEndpoints`, `storageKeys`            |
| Schemas             | `src/schemas/xxxSchema.ts`: `createXxxSchema(t)` + `XxxFormValues` | `createCacheSearchSchema`, `CacheSearchFormValues` |
| Route-only code     | `actions.ts` next to `page.tsx`                 | `health/actions.ts`, `cache/actions.ts`  |
| shadcn-ui files     | kebab-case (shadcn default)                     | `libs/shadcn-ui/dropdown-menu.tsx`       |
| Next.js route files | Next.js names                                   | `page.tsx`, `layout.tsx`, `error.tsx`    |

### Components

- Follow Atomic Design: `atoms` → `molecules` → `organisms` → `templates`. Pages live in `app/`.
- Each component folder holds `index.tsx`, `index.spec.tsx`, and `index.stories.tsx`.
- Use named exports (`export function X`). Next.js route files use `export default`.
- Take `props` as one argument, then destructure it on the first line: `const { a, b } = props;`.
- Add `'use client'` only when the file needs client features (state, effects, browser APIs).
- Build UI from `@/libs/shadcn-ui/*`. Style with Tailwind and `cn()`.
- Do not edit shadcn-ui files unless the task needs it. Add new ones with `pnpm client shadcn-ui:add`.
- Delete a level's `.gitkeep` once that folder has a real file in it.
- Small components used by only one route (e.g. a Suspense child and its fallback) stay as local functions in that route's `page.tsx`. Do not move them to `components/`.
- Shared components must not import from `src/app`. Pass route data or actions in as props.

### Routes, Cache Components, and env

- `cacheComponents: true` is on. Request-time data (`connection()`, `cookies()`, `headers()`, uncached `fetch`) must sit inside `<Suspense>`, or the route must set `export const instant = false`. If not, `pnpm client build` fails with "Blocking Route".
- A `notFound()` that depends on request-time data runs after the static shell has started streaming, so the response keeps status 200. To send a real 404, decide it in `src/proxy.ts` and rewrite to the `[...rest]` catch-all.
- Route `actions.ts`: use `'use server'` for Server Actions that client components call. Use `import 'server-only'` for data loaders that only Server Components call, so they are not exposed as POST endpoints.
- Check the environment on the server only, with `envUtils.isProduction()` (reads `APP_ENV` on each call). Never expose it through `NEXT_PUBLIC_`.
- Dev-only routes (e.g. `/[locale]/cache`) are blocked in three places: `proxy.ts` (real 404), the page (`notFound()`), and each Server Action.
- Hidden routes (not linked from the UI) set `robots: { index: false, follow: false }` in their metadata.

### Code order in a component or hook

1. `'use client'` (if needed).
2. Imports.
3. Exported types and interfaces.
4. The component or hook.
5. Inside: destructure props/options → hooks (`useTranslations`, `useState`, `useRef`) → callbacks → effects → return.

### Imports

- Use the `@/` alias for `src/` (`@/libs/shadcn-ui/button`). Use `./` only for files in the same folder.
- Mark type-only imports with `import type`.

### HTTP and backend integration

- Call the API only through `httpUtils` (no auth) or `httpUtilsAuth` (with tokens). Both are `server-only`.
- Put endpoint paths in `constants/apiEndpoints.ts` under the HTTP method.
- Handle the typed errors: `HttpUtilsResponseError`, `HttpUtilsTimeoutError`, `HttpUtilsNetworkError`, `HttpUtilsRequestCanceledError`.
- Tokens live in `httpOnly` cookies. Use `cookieUtils`. Never read tokens in the browser.

### i18n

- All UI text goes in `libs/next-intl/messages/en.json` and `zh.json`. Add keys to both files.
- Keys are one level deep inside a namespace. Join a nested path in camelCase: `health.tableIndicator`, `cache.errorsProduction` — not `health.table.indicator`.
- Read text with `useTranslations('<namespace>')` (or the server version).
- Use `Link` and navigation helpers from `@/libs/next-intl/configs/navigation`, not `next/link`.

### Forms, state, logging

- Forms: Formik + Yup schemas. Put each schema in `src/schemas/xxxSchema.ts` as a factory that takes the namespaced translator: `createXxxSchema(t: ReturnType<typeof useTranslations<'ns'>>)`. Infer the form values type from it: `type XxxFormValues = InferType<ReturnType<typeof createXxxSchema>>`. Export shared limits (e.g. `MAX_CACHE_PATTERN_LENGTH`) from the same file.
- Async handlers: prefer `async` functions with `try/catch/finally`. Call them from JSX with `void`, e.g. `onClick={() => void handleDelete(key)}`.
- State: local React state and custom hooks. No global state library.
- Logging: `logUtils.error/warn/info/debug`.
- Error pages: `error.tsx` logs with `logUtils.error` and shows `AppStatusTemplate`.

## Testing

- Workflow: Code-First. Add or update tests for every change.
- Test files sit next to the source file: `x.service.spec.ts`, `useX.spec.ts`, `Component/index.spec.tsx`.
- Server: Jest + `@nestjs/testing` (`Test.createTestingModule`). Mock deps with `useValue`. No e2e tests.
- Server: every `*.module.ts` gets a `*.module.spec.ts` next to it. Pick the test style by module kind:
  - Factory modules (`useFactory`, `forRootAsync`, `registerAsync`): check the options built from config, including the defaults. Feed config with `ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => config] })`.
  - Provider modules: compile with `Test.createTestingModule` and check that the exported providers and controllers resolve. Call `close()` on the module after each test.
  - Aggregate modules (modules that only import and re-export other modules, e.g. `AppModule`, `CoreModule`, `FeatureModule`): check `imports`/`exports` with `Reflect.getMetadata`. Do not compile them.
  - All module tests must mock external clients (Redis, MySQL, Prisma, mail) with `jest.mock`. No test may open a real connection.
  - Reference example: `core-winston.module.spec.ts`.
- Client: Vitest + Testing Library (`render`, `renderHook`, `userEvent`). Use `vi.fn()` and `vi.useFakeTimers()`.
- Client components that read translations: render with `renderWithIntl(ui)` from `@vitest-helpers` (`apps/client/vitest.helpers.tsx`). Do not wrap `NextIntlClientProvider` in each spec.
- Client env: mock env with `vi.stubEnv` and reset it with `vi.unstubAllEnvs`. Specs that use `next/server` (e.g. `proxy.spec.ts`) add `// @vitest-environment node` at the top.
- No specs in `src/app/(routes)/**` (route files are also left out of coverage). Keep route files thin and test the logic they use in `utils/`, `schemas/`, or `components/`.
- Client page work is done only when `pnpm client build` passes. Typecheck and tests do not catch Cache Components errors.
- Every test follows AAA with `// Arrange`, `// Act`, `// Assert` comments.
- Test names read as behavior: `it('copies text and sets copiedText on success')`.
- Components also get a Storybook story (`index.stories.tsx`, `title: '<Level>/<Name>'`).
- Run: `pnpm <server|client> test`, coverage with `test:cov`.
