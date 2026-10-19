# Deployment — Textile CRM / Mentoos storefront on Render

## Live URLs

| Service | URL | Runtime |
|---------|-----|---------|
| Frontend (Next.js) | https://textile-crm-frontend.onrender.com | Docker — `frontend.Dockerfile` |
| Backend (Express + Socket.IO) | https://textile-crm-backend.onrender.com | Docker — `backend.Dockerfile` |
| Repo | https://github.com/srikanth112236/textile-crm | branch `main` |

Health check: https://textile-crm-backend.onrender.com/api/health

## Repository layout (why the Dockerfiles are at the root)

```
ecom/
├── app/                  # Next.js frontend
├── server/               # Express + Socket.IO backend
├── frontend.Dockerfile   # builds app/   (context = repo root)
├── backend.Dockerfile    # builds server/ (context = repo root)
├── render.yaml           # Render Blueprint
└── docker-compose.yml    # local development
```

Both Dockerfiles use the **repository root as the build context** and copy the
`app/` or `server/` subfolder in. That means the Render services must be
configured with `dockerContext: .` (the default) — not with a root directory of
`app/` or `server/`.

---

## ⚠️ Read this first: the existing Render services run a DIFFERENT app

At the time of writing, both live URLs still serve the old **Textile ERP**
application (the backend answers `/api/health` with
`"Textile ERP Enterprise Backend Server is running!"`, and the frontend serves a
Vite SPA). Those services were created from the previous contents of this repo.

Pushing this code does **not** automatically make them run this storefront,
because their build/runtime settings still point at the old app. Choose one:

### Option A — Recreate from the Blueprint (recommended)

1. Render Dashboard → **New +** → **Blueprint**
2. Select `srikanth112236/textile-crm` (Render reads `render.yaml`)
3. Render prompts for every `sync: false` secret (see the table below)
4. Delete the two old services (this also frees the `textile-crm-*` names,
   which are required for the URLs above)

### Option B — Reconfigure the two existing services

For **each** service: Settings → change to these values, then Manual Deploy →
Clear build cache & deploy.

| Setting | Backend (`textile-crm-backend`) | Frontend (`textile-crm-frontend`) |
|---------|--------------------------------|-----------------------------------|
| Language / Runtime | **Docker** | **Docker** |
| Dockerfile Path | `./backend.Dockerfile` | `./frontend.Dockerfile` |
| Docker Build Context Directory | `.` (repo root) | `.` (repo root) |
| Health Check Path | `/api/health` | *(leave empty — `/`)* |
| Start Command | *(none — from the Dockerfile)* | *(none)* |
| **PORT** env var | **delete it** | **delete it** |

> **Why delete `PORT`?** Render injects its own `PORT` and routes traffic to it.
> Overriding it with `5000` makes the service listen on the wrong port and the
> deploy fails with "no open ports detected". Both apps read `process.env.PORT`
> (`next start` honours it automatically; the API falls back to 5000 only when
> it is unset).

### Option C — Keep the Node runtime (what the current services use)

If you leave both services on the Node runtime, set these values instead:

| Setting | Backend (`textile-crm-backend`) | Frontend (`textile-crm-frontend`) |
|---------|--------------------------------|-----------------------------------|
| Runtime | **Node** | **Node** |
| Root Directory | `server` | `app` |
| Build Command | `npm ci --include=dev; npm run build \|\| true; test -f dist/server.js` | `npm ci --include=dev; npm run build` |
| Start Command | `node dist/server.js` | `npm start` |
| Health Check Path | `/api/health` | *(leave empty)* |

> **Gotchas verified live (2026-10-19 deploys):**
> - Render sets `NODE_ENV=production` **before** the build, and modern npm skips
>   `devDependencies` in that mode. Without `--include=dev` there is no
>   TypeScript in `node_modules`, `tsc` falls through to a host's newer TS 7,
>   and the build dies with `TS5108 moduleResolution=node10 has been removed`.
> - `npm run build` (`tsc`) exits non-zero because of ~32 pre-existing type
>   errors, but still emits `dist/server.js` — hence the `|| true` + `test -f`
>   guard in the backend build command.
> - `Docker` runtime instead? The Dockerfiles already handle all of this
>   (`npm ci`, tolerant build) — Option A/B is then the better choice.
> - The `caniuse-lite` override in both `package.json` files pins a real,
>   published version; without it `npm ci` 404s on a corrupt registry pin
>   (`1.0.30011761` — a version that never existed).

## Seeding MongoDB Atlas from the local database

The complete local database (`mongodb://localhost:27017/ecom`) was copied to
Atlas with `server/scripts/copyLocalToAtlas.js` (21 collections, ~250 docs).

```bash
# Run from server/ — never put credentials in code
export SRC_URI="mongodb://localhost:27017/ecom"
export DST_URI="mongodb+srv://<user>:<pass>@cluster0.cht8d0g.mongodb.net/ecom?retryWrites=true&w=majority"
node scripts/copyLocalToAtlas.js
```

It drops each target collection first (exact mirror; set `KEEP_TARGET=1` to
append) and recreates all indexes (unique slugs/emails, TTLs, etc.).


---

## Environment variables

### Backend — `textile-crm-backend`

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `MONGODB_URI` | `mongodb+srv://…` | **Required.** MongoDB Atlas connection string |
| `FRONTEND_URL` | `https://textile-crm-frontend.onrender.com` | CORS + email links. Comma-separate to allow more origins |
| `API_BASE_URL` | `https://textile-crm-backend.onrender.com` | Base URL for uploaded-image links |
| `HTTPS_ENABLED` | `false` | Render terminates TLS at the edge; `true` breaks internal health checks |
| `JWT_SECRET` | *(generate)* | Render can generate it (`generateValue`) |
| `JWT_ACCESS_EXPIRY` | `15m` | |
| `JWT_REFRESH_EXPIRY` | `7d` | |
| `MFA_ISSUER` | `E-Commerce Platform` | Shown in authenticator apps |
| `ADMIN_REGISTRATION_SECRET` | `<secret>` | Needed to register admins |
| `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` | `<credentials>` | Seeded superadmin |
| `RECAPTCHA_SECRET_KEY` | `<key>` | Server-side reCAPTCHA verification |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | `<keys>` | Payments |
| `RAZORPAY_WEBHOOK_SECRET` | `<secret>` | Webhook signature check |
| `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` / `SHIPROCKET_PICKUP_LOCATION` | `<values>` | Shipments |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | *(optional)* | Leave blank to run without a cache |

Optional: `SMTP_*` (email), `MSG91_*` (SMS), `INSTAGRAM_*` (feed),
`PAYMENT_SWEEP_ENABLED`, `SHIPROCKET_SYNC_ENABLED`.

### Frontend — `textile-crm-frontend`

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `NEXT_PUBLIC_API_URL` | `https://textile-crm-backend.onrender.com` | **Build-time.** Baked into the browser bundle (see below) |
| `NEXTAUTH_URL` | `https://textile-crm-frontend.onrender.com` | |
| `NEXTAUTH_SECRET` | *(generate)* | Encrypts the NextAuth session cookie |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | `<site key>` | Note the `NEXT_PUBLIC_` prefix |
| `SITE_URL` | `https://textile-crm-frontend.onrender.com` | Sitemap/robots generation |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GSC_VERIFICATION` | *(optional)* | Analytics / Search Console |

> **Build-time vs runtime.** Next.js inlines `NEXT_PUBLIC_*` variables into the
> JavaScript bundle during `next build`, so `NEXT_PUBLIC_API_URL` must be present
> **when the image is built**. `frontend.Dockerfile` declares it with `ARG`, which
> is how Render forwards service env vars into a Docker build. As a safety net the
> code also falls back to `https://textile-crm-backend.onrender.com` when the
> variable is missing, so a client build can never silently point at localhost.

---

## Database — MongoDB Atlas

1. Create a free cluster at https://mongodb.com/atlas
2. Database Access → add a user
3. Network Access → allow `0.0.0.0/0` (Render's egress IPs are not static on
   free plans)
4. Copy the connection string into `MONGODB_URI`:
   `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/ecom?retryWrites=true&w=majority`

## Redis (optional)

The API logs `Redis connection failed … starting without Redis cache` and
continues. Add a Key Value / Redis instance only if you need caching or run more
than one backend instance (Socket.IO needs the Redis adapter to fan out messages
across instances). Note the free Render Redis plan is not reachable from Render
web services — use a paid Key Value instance or Upstash.

## First-run data (admin user, categories, settings)

Run these once against Atlas from your machine (with `MONGODB_URI` pointing at
Atlas in `server/.env`):

```bash
cd server
npm run seed:superadmin
npm run seed:settings
npm run seed:categories
npm run seed:products      # optional demo catalog
```

---

## Deploy

```bash
git add -A
git commit -m "…"
git push origin main
```

Render auto-deploys on push when **Auto-Deploy** is set to *Yes* (see
`autoDeploy: true` in `render.yaml`). Otherwise use **Manual Deploy → Deploy
latest commit**.

## Verify the deployment

```bash
# 1. API is alive and connected to Mongo
curl https://textile-crm-backend.onrender.com/api/health

# 2. Products and filters return data (this was the 404 report)
curl "https://textile-crm-backend.onrender.com/api/products?limit=1"
curl "https://textile-crm-backend.onrender.com/api/products/filters"
curl https://textile-crm-backend.onrender.com/api/categories

# 3. Socket.IO handshake answers (should return a session id string)
curl "https://textile-crm-backend.onrender.com/socket.io/?EIO=4&transport=polling"

# 4. Frontend renders the storefront (Next.js output, not an SPA shell)
curl -I https://textile-crm-frontend.onrender.com
```

In the browser: the homepage hero must crossfade between three slides every 6
seconds with a slow zoom, and DevTools → Console must be free of CORS/404 errors.

---

## Known limitations

- **Uploaded images are ephemeral.** The API writes to `/app/uploads` inside the
  container; without a mounted disk every redeploy erases them. To persist them,
  add a Render Disk (paid plan) to the backend service with **mount path
  `/app/uploads`**, or move uploads to S3/Cloudinary.
- **Free plan spins down.** Free web services sleep after ~15 minutes idle; the
  first request then takes ~30s and live Socket.IO connections drop. Use a paid
  instance for real-time features in production.
- **Pre-existing type errors.** `npm run type-check` in `server/` reports errors
  in Elasticsearch/Mongoose generics. They do not block the build (the Dockerfile
  only requires `dist/server.js` to be emitted) but should be cleaned up.

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| Deploy fails: *no open ports detected* | A `PORT` env var is overriding Render's. Delete it. |
| API 404s from the browser | `NEXT_PUBLIC_API_URL` wrong or not set at **build** time — redeploy the frontend after fixing it (**Clear build cache & deploy**). |
| CORS error in the console | Backend `FRONTEND_URL` must exactly match the frontend origin (scheme + host, no trailing slash). |
| Socket.IO `connect_error` | Token missing/expired (sockets require auth), or `FRONTEND_URL` does not match the browser origin. |
| Mongo connection timeout | Atlas Network Access missing `0.0.0.0/0`, or the password is not URL-encoded. |
| Images 404 after a redeploy | Ephemeral storage — see Known limitations. |
| Health check failing on the backend | Confirm `GET /api/health` returns 200 locally and that `HTTPS_ENABLED` is `false`. |

## Local development

```bash
# Backend  -> http://localhost:5000
cd server && npm run dev

# Frontend -> http://localhost:3001
cd app && npm run dev
```

Local `.env` files are **not** in Git — copy the examples:

```bash
cp app/.env.example app/.env.local
cp server/.env.example server/.env
```

Or run everything in Docker (no Docker Desktop daemon = not available here):

```bash
docker compose up -d
```
