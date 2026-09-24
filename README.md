# template-nest-next (monorepo)

A [pnpm workspace](https://pnpm.io/workspaces) monorepo.

## Structure

```
.
├── apps/
│   ├── server/           # NestJS API (see apps/server/README.md)
│   ├── client/           # Next.js front-end (see apps/client/README.md)
│   └── py-service/       # FastAPI service, Python deps managed by pnpm (see apps/py-service/README.md)
├── packages/             # Shared packages (added as needed)
├── docker-compose.yml        # Server + client + py-service container orchestration
├── docker-compose-infra.yml  # Local MySQL + Redis
├── pnpm-workspace.yaml
└── package.json          # Workspace root
```

## Requirements

- Node.js >= 24
- pnpm >= 12.6.0 (`corepack enable` picks up the pinned `packageManager` version)

## Getting started

```bash
pnpm install                 # install every workspace's dependencies

pnpm server start:dev        # run the API in watch mode
pnpm client start:dev        # run the front-end in watch mode
pnpm py-service start:dev    # run the Python service with auto-reload
pnpm server <script>         # run any server package.json script, e.g. `pnpm server build`
pnpm client <script>         # likewise for the client, e.g. `pnpm client storybook`
pnpm py-service <script>     # likewise for py-service, e.g. `pnpm py-service test`

pnpm -r build                # build every app
pnpm -r lint                 # lint every app
pnpm -r test                 # test every app
```

Each app is self-contained: `cd apps/server` and use its own scripts (`pnpm start:dev`,
`pnpm db:migrate`, etc.). See [apps/server/README.md](./apps/server/README.md),
[apps/client/README.md](./apps/client/README.md), and
[apps/py-service/README.md](./apps/py-service/README.md) for per-app details.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the branch/commit/PR workflow.

## Docker

Both compose files run from the repo root. `docker-compose.yml` defines a `server` service
(built from `apps/server`), a `client` service (built from `apps/client`), and a
`py-service` service (built from `apps/py-service`), each with its own env file;
`docker-compose-infra.yml` reads `apps/server` env files:

```bash
# Local infrastructure (MySQL + Redis)
APP_ENV=development docker compose -f docker-compose-infra.yml up -d

# Application containers (server + client)
APP_ENV=development docker compose up -d --build

# One service only
APP_ENV=development docker compose up -d --build client
```

Interactive alternative: `pnpm infra` / `pnpm deploy:vm` (or `bash scripts/01_run_docker_infra.sh` /
`bash scripts/02_deploy_docker_vm.sh`) prompt for the target and environment, including a full VM
deploy over SSH. See the Docker section of [apps/server/README.md](./apps/server/README.md) for
prerequisites, image tags, and rollback.
