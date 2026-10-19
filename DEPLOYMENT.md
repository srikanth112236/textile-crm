# E-Commerce Deployment on Render

## Overview

This deployment uses Render with Docker containers:
- **Backend**: Express.js API on Render Web Service
- **Frontend**: Next.js on Render Web Service
- **Database**: MongoDB Atlas (or Render MongoDB)
- **Cache**: Redis (Render Redis or Upstash)

## Prerequisites

1. Render account: https://render.com
2. MongoDB Atlas cluster: https://mongodb.com/atlas
3. GitHub repository with this code

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## Step 2: Create MongoDB Database

1. Create a free cluster at MongoDB Atlas
2. Get your connection string: `mongodb+srv://user:pass@cluster.mongodb.net/ecom?retryWrites=true&w=majority`
3. Add your Render IP to Atlas network access (or allow 0.0.0.0/0)

## Step 3: Create Redis (Optional)

1. Create a Redis instance on Render or use Upstash
2. Get the connection details

## Step 4: Deploy via render.yaml

1. Connect your GitHub repo to Render
2. Use the `render.yaml` blueprint:
   - Go to Render Dashboard → Blueprints → Connect repo
   - Select `render.yaml`
   - Render will create both services automatically

## Step 5: Set Environment Variables

### Backend Service (ecom-backend)
Set these in Render Dashboard → Backend → Environment:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `REDIS_HOST` | Your Redis host |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | Your Redis password |
| `JWT_SECRET` | Generate a strong random string |
| `FRONTEND_URL` | `https://ecom-frontend.onrender.com` |
| `RECAPTCHA_SECRET_KEY` | Your reCAPTCHA secret key |
| `HTTPS_ENABLED` | `true` |
| `RAZORPAY_KEY_ID` | Your Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Your Razorpay key secret |

### Frontend Service (ecom-frontend)
Set these in Render Dashboard → Frontend → Environment:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | `https://ecom-backend.onrender.com` |
| `NEXTAUTH_SECRET` | Same as backend JWT_SECRET |
| `NEXTAUTH_URL` | `https://ecom-frontend.onrender.com` |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Your reCAPTCHA site key |

## Step 6: Verify Deployment

1. Wait for both services to build and deploy
2. Check backend health: `https://ecom-backend.onrender.com/api/health`
3. Open frontend: `https://ecom-frontend.onrender.com`

## Troubleshooting

### Backend 404 on /api/categories
- Ensure `NEXT_PUBLIC_API_URL` in frontend matches your backend URL
- Check backend is running: `https://ecom-backend.onrender.com/api/health`
- Verify CORS: `FRONTEND_URL` env var matches your frontend URL exactly

### Hydration Warning
- The `suppressHydrationWarning` prop on `<html>` fixes browser extension conflicts
- If you still see warnings, disable browser extensions and refresh

### Socket.IO Real-time
- Socket.IO is configured in `server/src/config/socket.ts`
- For production with multiple backend instances, enable Redis adapter
- Single Render instance works without Redis adapter

## Manual Deploy (Alternative to render.yaml)

### Backend
```bash
# In Render Dashboard, create a Web Service
# Runtime: Docker
# Dockerfile: ./backend.Dockerfile
# Health check: /api/health
```

### Frontend
```bash
# In Render Dashboard, create a Web Service
# Runtime: Docker
# Dockerfile: ./frontend.Dockerfile
```

## Local Development with Docker

```bash
# Build both images
docker build -f frontend.Dockerfile -t ecom-frontend .
docker build -f backend.Dockerfile -t ecom-backend .

# Run with docker-compose
docker compose up -d
```
