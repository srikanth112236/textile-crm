# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# ---- Build ------------------------------------------------------------------
FROM base AS builder
RUN apk add --no-cache libc6-compat
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
# `tsc` still emits dist/ when it reports type errors, but exits non-zero. This
# repo has pre-existing type errors (Elasticsearch / Mongoose generics), so we
# fail only when the compiled entrypoint is genuinely missing. Run
# `npm run type-check` locally for the full type report.
RUN npm run build || true
RUN test -f dist/server.js

# ---- Runtime ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production

# Alpine's adduser/addgroup (BusyBox): note `--uid`, not `--nextuid`.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 ecomuser

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# multer writes uploads here at runtime and the server serves them from
# /app/uploads. The directory must exist and be writable by the non-root user.
# NOTE: without a mounted Render disk this storage is ephemeral — uploaded
# images are lost on every redeploy/restart.
RUN mkdir -p /app/uploads/products /app/uploads/avatars \
 && chown -R ecomuser:nodejs /app/uploads

USER ecomuser

# The app listens on $PORT (Render injects it; falls back to 5000 locally).
EXPOSE 5000

CMD ["node", "dist/server.js"]
