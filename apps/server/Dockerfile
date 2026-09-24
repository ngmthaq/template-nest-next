# syntax=docker/dockerfile:1
#
# Build from the REPO ROOT (`docker build -f apps/server/Dockerfile .`), where the lockfile lives.

# ---- pnpm-version: isolates the packageManager value so a version bump in package.json ----
# ---- does not bust the base layer's cache ----
FROM node:24-alpine AS pnpm-version
WORKDIR /app
COPY package.json ./
RUN node -p "require('./package.json').packageManager" > /pnpm-version

# ---- Base: pnpm via corepack, version read from the root package.json ----
FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
COPY --from=pnpm-version /pnpm-version /pnpm-version
RUN corepack enable && corepack prepare "$(cat /pnpm-version)" --activate

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
RUN pnpm --filter @template-nest-next/server build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter @template-nest-next/server deploy --prod --legacy /prod/server

# ---- Runtime ----
FROM node:24-alpine AS runtime
ENV APP_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /prod/server/node_modules ./node_modules
COPY --from=build --chown=node:node /prod/server/dist ./dist
COPY --from=build --chown=node:node /prod/server/package.json ./package.json
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
