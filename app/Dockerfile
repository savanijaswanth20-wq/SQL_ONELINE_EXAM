# ==============================================================================
# Dockerfile for MySQL Exam Studio (TanStack Start / React 19 / Bun)
# ==============================================================================
FROM oven/bun:1-debian AS base

WORKDIR /app

# Install base network/diagnostic dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------------------------
# 1. Dependencies Stage
# ------------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

# Copy root package files, vendored workspace packages, and verification scripts
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY scripts/ ./scripts/

# Install dependencies
RUN bun install --frozen-lockfile

# ------------------------------------------------------------------------------
# 2. Development Stage (Hot-reloading enabled)
# ------------------------------------------------------------------------------
FROM base AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "dev:docker"]

# ------------------------------------------------------------------------------
# 3. Builder Stage
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .

ENV NODE_ENV=production

# Run build pipeline
RUN bun run build

# ------------------------------------------------------------------------------
# 4. Production Runner Stage
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["bun", "run", "preview:docker"]
