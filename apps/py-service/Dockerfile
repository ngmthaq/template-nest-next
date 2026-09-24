# syntax=docker/dockerfile:1
#
# Build from the REPO ROOT (`docker build -f apps/py-service/Dockerfile .`), where the lockfile lives.

# ---- pnpm-version: isolates the packageManager value so a version bump in package.json ----
# ---- does not bust the base layer's cache ----
FROM node:24-slim AS pnpm-version
WORKDIR /app
COPY package.json ./
RUN node -p "require('./package.json').packageManager" > /pnpm-version

# ---- Base: pnpm via corepack, version read from the root package.json ----
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
COPY --from=pnpm-version /pnpm-version /pnpm-version
RUN corepack enable && corepack prepare "$(cat /pnpm-version)" --activate

# ---- Dependencies: pnpm resolves the Python venv here too. Its site-packages is copied out ----
# ---- in the same RUN, before the cache-mounted store (and the .venv symlink into it) disappears ----
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/py-service/package.json apps/py-service/pyproject.toml apps/py-service/pylock.toml apps/py-service/.python-version ./apps/py-service/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @template-nest-next/py-service --prod --ignore-scripts && \
    mkdir -p /site-packages && \
    cp -a "$(readlink -f apps/py-service/.venv)/lib/python3.13/site-packages/." /site-packages/

# ---- Runtime: Python only, no Node or pnpm ----
FROM python:3.13-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/opt/site-packages
ENV APP_ENV=production
ENV HOST=0.0.0.0
RUN useradd --system --create-home --shell /usr/sbin/nologin appuser
WORKDIR /app
COPY --from=deps --chown=appuser:appuser /site-packages /opt/site-packages
COPY --chown=appuser:appuser apps/py-service/app ./app
USER appuser
EXPOSE 8000
CMD ["python", "-m", "app"]
