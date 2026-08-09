# TEMPLATE NEST NEXT

## Environment Configuration

The app uses [`@nestjs/config`](https://docs.nestjs.com/techniques/configuration), wired up
in `src/core/core.module.ts` (a global module). Configuration values are exposed through the
typed factory in `src/core/configuration.ts` and injected via `ConfigService`.

### How the environment is selected

`NODE_ENV` is set by the **npm start script** — not by any `.env` file — so it is the single
source of truth for which environment is running and which `.env.<NODE_ENV>` file is loaded:

| Script               | `NODE_ENV`    | Command              | Env file loaded    |
| -------------------- | ------------- | -------------------- | ------------------ |
| `pnpm start`         | `development` | `nest start`         | `.env.development` |
| `pnpm start:dev`     | `development` | `nest start --watch` | `.env.development` |
| `pnpm start:debug`   | `development` | `nest start --debug` | `.env.development` |
| `pnpm start:staging` | `staging`     | `node dist/main`     | `.env.staging`     |
| `pnpm start:prod`    | `production`  | `node dist/main`     | `.env.production`  |

> `cross-env` sets `NODE_ENV` so the scripts work on Windows, macOS, and Linux.

### Env file load order

For a given `NODE_ENV`, files are loaded in this order (**first match wins**):

1. `.env.<NODE_ENV>.local` — git-ignored; machine-specific secrets/overrides
2. `.env.<NODE_ENV>` — git-ignored; per-environment defaults
3. `.env` — git-ignored; local fallback

All `.env*` files are git-ignored **except `.env.example`**, which is committed as the
reference template. Copy it to create your local files:

```bash
cp .env.example .env.development
```

### Available variables

See `.env.example` for the authoritative, commented list. Every key is optional — the
default in `src/core/configuration.ts` applies when it is unset.

| Variable                | Default                                  | Description                                                                                   |
| ----------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| `NODE_ENV`              | `development`                            | Set by the start script (not the file). Selects the `.env` file and gates dev-only behaviour. |
| `PORT`                  | `3000`                                   | HTTP server port.                                                                             |
| `LOG_LEVEL`             | `debug`                                  | Minimum level emitted by the Winston logger.                                                  |
| `CACHE_TTL`             | `3600000`                                | Redis-backed cache entry TTL, in milliseconds.                                                |
| `CACHE_MAX`             | `100`                                    | Desired max cache entries (not enforced by the cache-manager v7 store).                       |
| `HTTP_TIMEOUT`          | `60000`                                  | Outbound `HttpService`/axios request timeout, in milliseconds.                                |
| `HTTP_MAX_REDIRECTS`    | `5`                                      | Outbound HTTP max redirects before failing.                                                   |
| `CORS_ORIGIN`           | `*`                                      | Allowed origins (`*` reflects any, or a comma-separated allow-list). REST + WebSocket.        |
| `CORS_METHODS`          | `GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS` | Allowed HTTP methods.                                                                         |
| `CORS_ALLOWED_HEADERS`  | _(empty)_                                | Allowed request headers; empty reflects the browser's requested headers.                      |
| `CORS_CREDENTIALS`      | `false`                                  | Allow cookies/Authorization cross-origin. Cannot combine with a literal `*` origin.           |
| `CORS_MAX_AGE`          | _(empty)_                                | Preflight cache duration in seconds.                                                          |
| `THROTTLE_SHORT_TTL`    | `1000`                                   | Rate-limit short tier window, in milliseconds.                                                |
| `THROTTLE_SHORT_LIMIT`  | `3`                                      | Rate-limit short tier: max requests per window.                                               |
| `THROTTLE_MEDIUM_TTL`   | `10000`                                  | Rate-limit medium tier window, in milliseconds.                                               |
| `THROTTLE_MEDIUM_LIMIT` | `20`                                     | Rate-limit medium tier: max requests per window.                                              |
| `THROTTLE_LONG_TTL`     | `60000`                                  | Rate-limit long tier window, in milliseconds.                                                 |
| `THROTTLE_LONG_LIMIT`   | `100`                                    | Rate-limit long tier: max requests per window.                                                |
| `COOKIE_SECRET`         | _(empty)_                                | Secret to sign cookies (enables `request.signedCookies`); empty = unsigned.                   |
| `COMPRESSION_THRESHOLD` | `1024`                                   | Minimum response size (bytes) before compressing.                                             |
| `COMPRESSION_LEVEL`     | `-1`                                     | zlib level `0`–`9`, or `-1` for the default.                                                  |
| `HASH_SALT_ROUNDS`      | `10`                                     | bcrypt cost factor (2^rounds) for `HashService`.                                              |
| `ENCRYPTION_KEY`        | _(empty)_                                | Secret the AES key is derived from; required only to use `EncryptionService`.                 |
| `ENCRYPTION_SALT`       | `salt`                                   | Salt for encryption key derivation; change per deployment.                                    |
| `REDIS_HOST`            | `localhost`                              | Redis host (BullMQ queues + cache store).                                                     |
| `REDIS_PORT`            | `6379`                                   | Redis port.                                                                                   |
| `REDIS_PASSWORD`        | _(empty)_                                | Redis password (empty if none).                                                               |
| `MYSQL_HOST`            | `localhost`                              | MySQL host (`localhost` from the host machine, `mysql` from other containers).                |
| `MYSQL_PORT`            | `3306`                                   | MySQL port.                                                                                   |
| `MYSQL_DATABASE`        | `template_nest_next`                     | Application database name (created on the container's first start).                           |
| `MYSQL_USER`            | `nestjs`                                 | Application user.                                                                             |
| `MYSQL_PASSWORD`        | `nestjs`                                 | Application user password.                                                                    |
| `MYSQL_ROOT_PASSWORD`   | `root`                                   | Root password; used only by the container's healthcheck / admin access.                       |

> The `MYSQL_*` keys use the official `mysql` image's own variable names, so
> `docker-compose-infra.yml` passes the env file straight through with no remapping.

### Accessing config in code

```ts
import { ConfigService } from '@nestjs/config';

constructor(private readonly config: ConfigService) {}

const port = this.config.get<number>('port', 3000);
const env = this.config.get<string>('nodeEnv');
```

### Adding a new environment

1. Add a `start:<name>` script with `cross-env NODE_ENV=<name> ...` in `package.json`.
2. Create a matching `.env.<name>` file (git-ignored automatically).

## Docker

> **Run all Compose commands from the repository root** (`../../`). Both Compose files live
> at the monorepo root and reference this app via `apps/server` for the build context and
> env files.

Two independent Compose files, both selecting their environment through `NODE_ENV` (no
`--env-file` flag). `NODE_ENV` picks which `.env.<NODE_ENV>` file each service loads and
defaults to `development` when unset.

| File                       | Contains       | When to use                                                             |
| -------------------------- | -------------- | ----------------------------------------------------------------------- |
| `docker-compose-infra.yml` | MySQL + Redis  | Local development — run these in Docker while the app runs on the host. |
| `docker-compose.yml`       | The NestJS app | On the server, where MySQL/Redis are managed externally.                |

### Local infrastructure (MySQL + Redis)

```bash
# Start MySQL + Redis for the development environment
NODE_ENV=development docker compose -f docker-compose-infra.yml up -d

# Stop them
NODE_ENV=development docker compose -f docker-compose-infra.yml down

# Stop and wipe all data (drops the volumes)
NODE_ENV=development docker compose -f docker-compose-infra.yml down -v
```

Containers are named per environment (`template-nest-next-mysql-<NODE_ENV>`,
`template-nest-next-redis-<NODE_ENV>`). The `MYSQL_*` / `REDIS_*` values come from
`.env.<NODE_ENV>`, so the app database and user are created from that file on first start.

### Application container

Multi-stage `Dockerfile` (pnpm via corepack, native-module toolchain for `bcrypt`, prod-pruned
runtime on `node:24-alpine`). MySQL/Redis are **not** included here — their hosts come from
`.env.<NODE_ENV>`.

```bash
# Build and run the development image
NODE_ENV=development docker compose up -d --build

# Other environments
NODE_ENV=uat        docker compose up -d --build
NODE_ENV=production docker compose up -d --build

docker compose down
```

The image tag and container name are suffixed with `NODE_ENV`
(`template-nest-next:<NODE_ENV>`, `template-nest-next-app-<NODE_ENV>`).

### Ports

The app always listens on **3000 inside** the container; `PORT` sets only the **published host
port** (default `3000`), letting environments run side by side on one host:

```bash
PORT=8080 NODE_ENV=uat docker compose up -d --build   # reachable on host :8080
```

> **Infra ports are read from your shell, not the env file.** Compose resolves the `ports:`
> mapping before `env_file` loads, so `MYSQL_PORT` / `REDIS_PORT` in `.env.<NODE_ENV>` set where
> the **app connects**, while the published host ports come from the shell (defaulting to
> `3306` / `6379`). To publish a non-default port, pass it inline and keep it in sync with the
> env file, e.g. `MYSQL_PORT=3307 NODE_ENV=development docker compose -f docker-compose-infra.yml up -d`.

## Security & HTTP Hardening

Cross-cutting middleware is applied during bootstrap in `src/main.ts`, each wrapped in a
`handle*(app)` helper under `src/shared/config/` and driven by the `ConfigService` values
above.

| Concern           | Where                                       | Notes                                                                                                         |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **CORS**          | `shared/config/cors.config.ts`              | One policy shared by REST (`app.enableCors`) and WebSocket (`websocket/websocket.adapter.ts`).                |
| **Helmet**        | `shared/config/helmet.config.ts`            | Security headers. CSP is disabled outside production (where Swagger UI is served).                            |
| **Rate limiting** | `core/core.module.ts` (`@nestjs/throttler`) | Three tiers (`short`/`medium`/`long`) applied together via a global `ThrottlerGuard`; skipped in development. |
| **cookie-parser** | `shared/config/cookie-parser.config.ts`     | Populates `request.cookies`; signs cookies when `COOKIE_SECRET` is set.                                       |
| **Compression**   | `shared/config/compression.config.ts`       | gzip/deflate responses over `COMPRESSION_THRESHOLD` bytes.                                                    |

Per-route rate-limit control uses the throttler decorators, e.g. `@Throttle({ long: { limit, ttl } })`
or `@SkipThrottle({ short: true })`.

### Cryptographic services

`SecurityModule` (`src/core/security/`, global) provides two injectable services:

- **`HashService`** — one-way bcrypt hashing for passwords: `hash(value)` and
  `compare(value, hashed)`.
- **`EncryptionService`** — reversible AES-256-GCM for recoverable secrets:
  `encrypt(text)`, `decrypt(payload)`, and `compare(text, payload)`. GCM is authenticated,
  so tampered payloads are rejected. Requires `ENCRYPTION_KEY`.

```ts
constructor(
  private readonly hash: HashService,
  private readonly encryption: EncryptionService,
) {}

const hashed = await this.hash.hash(password);
const ok = await this.hash.compare(password, hashed);

const token = this.encryption.encrypt(secret);
const plain = this.encryption.decrypt(token);
```

## API Documentation (Swagger)

Interactive [OpenAPI/Swagger](https://docs.nestjs.com/openapi/introduction) docs are configured
in `src/shared/config/swagger.config.ts` and mounted during bootstrap:

- **UI:** `GET /swagger`
- **OpenAPI JSON:** `GET /swagger-json`
- **OpenAPI YAML:** `GET /swagger-yaml`

The document (titled _"Template Nest Next API"_) is built by scanning controllers and their
`@nestjs/swagger` decorators. The `X-API-Version` header (see header-based versioning below) is
registered as a global parameter, so you can set the requested API version directly from the UI,
and authorization is persisted across page reloads (`persistAuthorization`).

> **Disabled in production.** When `NODE_ENV=production` the docs are not mounted, so they are
> never exposed there. They are available in development and staging.

### API versioning

Routes use header-based versioning (`src/shared/config/versioning.config.ts`): clients send the
requested version in the `X-API-Version` header (default `1`). Undecorated routes fall back to
the default version, and handlers opt into a specific version with `@Version('2')`.

## Build & Compilation

The project compiles with **[SWC](https://docs.nestjs.com/recipes/swc)** (`builder: "swc"` in
`nest-cli.json`) for fast builds. `typeCheck: true` keeps full TypeScript type-checking in a
parallel process, since SWC only transpiles. The `nest build` / `nest start` scripts pick this
up automatically.

> `bcrypt` and `@swc/core` are native modules; `pnpm.onlyBuiltDependencies` in `package.json`
> allows their install scripts to run so the native addons compile.
