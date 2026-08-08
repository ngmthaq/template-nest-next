# syntax=docker/dockerfile:1
#
# Build context is the REPO ROOT (see docker-compose.yml), not apps/server,
# because the pnpm lockfile and workspace manifest live at the root.
#   docker build -f apps/server/Dockerfile .

# ---- Base: pnpm via corepack ----
FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate
WORKDIR /app

# ---- Dependencies (with toolchain for native modules like bcrypt) ----
FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- Build, then produce an isolated production bundle ----
FROM deps AS build
COPY apps/server ./apps/server
RUN pnpm --filter @nestjs-template/server build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter @nestjs-template/server deploy --prod --legacy /prod/server

# ---- Runtime ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /prod/server/node_modules ./node_modules
COPY --from=build --chown=node:node /prod/server/dist ./dist
COPY --from=build --chown=node:node /prod/server/package.json ./package.json
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
