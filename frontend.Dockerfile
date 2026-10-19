# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# ---- Build ------------------------------------------------------------------
FROM base AS builder
RUN apk add --no-cache libc6-compat
COPY app/package*.json ./
RUN npm ci
COPY app/ ./
# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so the
# API URL must be present during `next build` (not just at runtime). Render
# passes the service's env vars to a Docker build as build args once they are
# declared with ARG.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG SITE_URL
ENV SITE_URL=$SITE_URL
RUN npm run build

# ---- Runtime ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Alpine's adduser/addgroup (BusyBox): note `--uid`, not `--nextuid`.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

# The app listens on $PORT (Render injects it; `next start` honours it).
EXPOSE 3001

CMD ["npm", "start"]
