# nestjs-template (monorepo)

A [pnpm workspace](https://pnpm.io/workspaces) monorepo.

## Structure

```
.
├── apps/
│   └── backend/          # NestJS API (see apps/backend/README.md)
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

pnpm backend:dev             # run the backend in watch mode
pnpm backend <script>        # run any backend package.json script, e.g. `pnpm backend build`

pnpm -r build                # build every app
pnpm -r lint                 # lint every app
pnpm -r test                 # test every app
```

Each app is self-contained: `cd apps/backend` and use its own scripts (`pnpm start:dev`,
`pnpm db:migrate`, etc.). See [apps/backend/README.md](./apps/backend/README.md) for backend details.

## Docker

Both compose files run from the repo root and reference `apps/backend` for build context and
env files:

```bash
# Local infrastructure (MySQL + Redis)
NODE_ENV=development docker compose -f docker-compose-infra.yml up -d

# Application container
NODE_ENV=development docker compose up -d --build
```
