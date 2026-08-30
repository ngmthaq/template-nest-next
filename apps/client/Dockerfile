# syntax=docker/dockerfile:1
#
# Build context is the REPO ROOT (see docker-compose.yml), not apps/client,
# because the pnpm lockfile and workspace manifest live at the root.
#   docker build -f apps/client/Dockerfile .
#
# This image is environment-agnostic, like apps/server/Dockerfile: it is
# built once and configured at container start via runtime env vars (see
# docker-compose.yml's client.env_file), not via build args.

# ---- Base: pnpm via corepack ----
FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/client/package.json ./apps/client/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- Build the standalone Next.js output ----
FROM deps AS build
ENV NODE_ENV=production
COPY apps/client ./apps/client
RUN pnpm --filter @template-nest-next/client build

# ---- Runtime ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3001
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/client/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/client/.next/static ./apps/client/.next/static
COPY --from=build --chown=node:node /app/apps/client/public ./apps/client/public
USER node
EXPOSE 3001
CMD ["node", "apps/client/server.js"]
