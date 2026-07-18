# NESTJS TEMPLATE

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

| Variable   | Default       | Description                             |
| ---------- | ------------- | --------------------------------------- |
| `NODE_ENV` | `development` | Set by the start script (not the file). |
| `PORT`     | `3000`        | HTTP server port.                       |

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
