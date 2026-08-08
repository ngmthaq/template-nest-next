# nestjs-template (monorepo)

A [pnpm workspace](https://pnpm.io/workspaces) monorepo.

## Structure

```
.
├── apps/
│   └── server/           # NestJS API (see apps/server/README.md)
├── packages/             # Shared packages (added as needed)
├── docker-compose.yml        # App container orchestration
├── docker-compose-infra.yml  # Local MySQL + Redis
├── pnpm-workspace.yaml
└── package.json          # Workspace root
```

A `apps/frontend` (Next.js) app will be added later.

## Requirements

- Node.js >= 24
- pnpm 10 (`corepack enable` picks up the pinned `packageManager` version)

## Getting started

```bash
pnpm install                 # install every workspace's dependencies

pnpm server:dev              # run the server in watch mode
pnpm server <script>         # run any server package.json script, e.g. `pnpm server build`

pnpm -r build                # build every app
pnpm -r lint                 # lint every app
pnpm -r test                 # test every app
```

Each app is self-contained: `cd apps/server` and use its own scripts (`pnpm start:dev`,
`pnpm db:migrate`, etc.). See [apps/server/README.md](./apps/server/README.md) for server details.

## Docker

Both compose files run from the repo root and reference `apps/server` for build context and
env files:

```bash
# Local infrastructure (MySQL + Redis)
NODE_ENV=development docker compose -f docker-compose-infra.yml up -d

# Application container
NODE_ENV=development docker compose up -d --build
```
