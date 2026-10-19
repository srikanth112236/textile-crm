# Environment Variables Setup Guide

This guide will help you configure all required environment variables for the e-commerce platform.

## 📋 Quick Start

1. **Generate all secrets** (see below)
2. **Copy example files** to create your `.env` files
3. **Fill in the values** using the generated secrets
4. **Start the application**

---

## 🔐 Secret Generation Guide

### 1. JWT Secret (Backend)

**What it is**: Secret key used to sign and verify JWT tokens. Must be strong and random.

**How to generate**:
```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Example output**: `aBc123XyZ789...` (64 characters)

**Add to**: `server/.env` as `JWT_SECRET`

---

### 2. NextAuth Secret (Frontend)

**What it is**: Secret key for NextAuth.js session encryption. Must be strong and random.

**How to generate**: Same as JWT Secret (use different value!)
```bash
openssl rand -base64 32
```

**Example output**: `XyZ789aBc123...` (64 characters)

**Add to**: 
- `app/.env.local` as `NEXTAUTH_SECRET`
- `server/.env` as `NEXTAUTH_SECRET` (optional, if backend needs it)

---

### 3. Google reCAPTCHA Keys (Optional for Development)

**What it is**: Google reCAPTCHA v3 keys to prevent bots.

**How to get**:
1. Go to https://www.google.com/recaptcha/admin/create
2. Register a new site:
   - **Label**: E-Commerce Platform (or any name)
   - **reCAPTCHA type**: Select **reCAPTCHA v3**
   - **Domains**: 
     - For development: `localhost`
     - For production: `yourdomain.com`
   - Accept terms and submit
3. Copy the keys:
   - **Site Key** (Public): Starts with `6L...` (add to frontend)
   - **Secret Key** (Private): Starts with `6L...` (add to backend)

**Add to**:
- `server/.env` as `RECAPTCHA_SECRET_KEY`
- `app/.env.local` as `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

**Note**: You can skip this for development - the middleware will skip verification if keys are not set.

---

### 4. MongoDB Connection String

**Option A: Local MongoDB (Docker)** - Recommended for Development
```
MONGODB_URI=mongodb://localhost:27017/ecom
```

**Option B: MongoDB Atlas (Cloud)** - For Production
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user (Database Access)
4. Whitelist your IP (Network Access) - use `0.0.0.0/0` for development
5. Click "Connect" → "Connect your application"
6. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/ecom?retryWrites=true&w=majority
   ```
   Replace `<password>` with your actual password.

**Add to**: `server/.env` as `MONGODB_URI`

---

## 📝 Complete Environment Variables List

### Backend (`server/.env`)

Create the file:
```bash
cd server
cp ../env.example .env
```

Required variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ecom
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecom

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration (GENERATE - see above)
JWT_SECRET=your-generated-jwt-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3001

# Google reCAPTCHA v3 (OPTIONAL for development)
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key-here
RECAPTCHA_SITE_KEY=your-recaptcha-site-key-here

# MFA Configuration
MFA_ISSUER=E-Commerce Platform

# Security
HTTPS_ENABLED=false

# NextAuth Secret (OPTIONAL for backend)
NEXTAUTH_SECRET=your-generated-nextauth-secret-here

# Superadmin Seed (for initial user creation)
SUPERADMIN_EMAIL=superadmin@example.com
SUPERADMIN_PASSWORD=SuperAdmin123!@#

# Stripe (Phase 5 - Leave commented for now)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 (Phase 3 - Leave commented for now)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=
# AWS_S3_BUCKET=

# Elasticsearch (Phase 3 - Leave commented for now)
# ELASTICSEARCH_NODE=http://localhost:9200

# Email (Phase 2 - Leave commented for now)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=

# Sentry (Phase 7 - Leave commented for now)
# SENTRY_DSN=

# OpenExchangeRates (Phase 2 - Leave commented for now)
# OPENEXCHANGERATES_API_KEY=
```

---

### Frontend (`app/.env.local`)

Create the file:
```bash
cd app
cp ../env.example .env.local
```

Required variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# NextAuth Configuration (GENERATE - see above)
NEXTAUTH_SECRET=your-generated-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3001

# Google reCAPTCHA v3 (OPTIONAL for development)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key-here

# Environment
NODE_ENV=development
```

---

## 🚀 Step-by-Step Setup

### Step 1: Generate Secrets

Open a terminal and run:

```bash
# Generate JWT Secret
echo "JWT_SECRET=$(openssl rand -base64 32)"

# Generate NextAuth Secret
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
```

**Windows PowerShell**:
```powershell
# Generate JWT Secret
$jwt = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "JWT_SECRET=$jwt"

# Generate NextAuth Secret  
$nextauth = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "NEXTAUTH_SECRET=$nextauth"
```

Copy the output values - you'll need them in Step 3.

### Step 2: Create .env Files

```bash
# From project root

# Backend
cd server
copy ..\env.example .env

# Frontend
cd ..\app
copy ..\env.example .env.local
```

**Linux/Mac**:
```bash
# Backend
cd server
cp ../env.example .env

# Frontend
cd ../app
cp ../env.example .env.local
```

### Step 3: Edit .env Files

#### Backend (`server/.env`)

Open `server/.env` in your editor and update:

1. **JWT_SECRET**: Paste the JWT secret from Step 1
2. **MONGODB_URI**: Use `mongodb://localhost:27017/ecom` (or your MongoDB Atlas connection string)
3. **NEXTAUTH_SECRET**: Paste the NextAuth secret from Step 1 (optional for backend)
4. **RECAPTCHA_SECRET_KEY**: (Optional) Add if you set up reCAPTCHA

#### Frontend (`app/.env.local`)

Open `app/.env.local` in your editor and update:

1. **NEXTAUTH_SECRET**: Paste the NextAuth secret from Step 1 (same as backend)
2. **NEXT_PUBLIC_RECAPTCHA_SITE_KEY**: (Optional) Add if you set up reCAPTCHA

### Step 4: Verify Configuration

Your `server/.env` should look like:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecom
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=YOUR_64_CHARACTER_GENERATED_SECRET_HERE
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=http://localhost:3001
MFA_ISSUER=E-Commerce Platform
HTTPS_ENABLED=false
```

Your `app/.env.local` should look like:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_SECRET=YOUR_64_CHARACTER_GENERATED_SECRET_HERE
NEXTAUTH_URL=http://localhost:3001
```

---

## ✅ Verification Checklist

Before starting the application, verify:

- [ ] `server/.env` exists and has `JWT_SECRET` set (64 characters)
- [ ] `server/.env` has `MONGODB_URI` set
- [ ] `app/.env.local` exists and has `NEXTAUTH_SECRET` set (64 characters)
- [ ] `app/.env.local` has `NEXT_PUBLIC_API_URL` set to `http://localhost:5000`
- [ ] Docker services are running (`docker-compose up -d`)
- [ ] MongoDB and Redis are accessible

---

## 🔒 Security Best Practices

1. **Never commit .env files**: Already in `.gitignore`
2. **Use different secrets**: JWT_SECRET and NEXTAUTH_SECRET should be different
3. **Rotate secrets**: Change secrets periodically in production
4. **Use environment-specific files**: 
   - Development: `.env` or `.env.local`
   - Production: Use your hosting platform's environment variables
5. **Keep secrets secure**: Don't share `.env` files or commit them to Git

---

## 🐛 Troubleshooting

### "JWT_SECRET is not defined"
- Check that `server/.env` exists
- Verify `JWT_SECRET` is set (no quotes, no spaces)
- Restart the server after editing `.env`

### "MongoDB connection failed"
- Check Docker is running: `docker ps`
- Verify MongoDB container: `docker-compose ps`
- Check `MONGODB_URI` format in `.env`

### "NextAuth secret missing"
- Check that `app/.env.local` exists
- Verify `NEXTAUTH_SECRET` is set
- Restart Next.js dev server after editing `.env.local`

### "CORS error"
- Verify `FRONTEND_URL` in `server/.env` matches your frontend URL
- Check that CORS middleware is loaded in `server.ts`

---

## 📚 Additional Resources

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)

---

## 🎯 Quick Reference: Command to Generate All Secrets

**Linux/Mac**:
```bash
echo "=== Secrets for .env files ==="
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo ""
echo "Copy these values to your .env files"
```

**Windows PowerShell**:
```powershell
Write-Host "=== Secrets for .env files ==="
$jwt = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
$nextauth = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "JWT_SECRET=$jwt"
Write-Host "NEXTAUTH_SECRET=$nextauth"
Write-Host ""
Write-Host "Copy these values to your .env files"
```

Save these values securely - you'll need them when setting up your environment!

