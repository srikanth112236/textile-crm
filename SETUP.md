# Setup Instructions - Phase 1 Complete

## Prerequisites
- Node.js 18+ installed
- Docker Desktop installed
- Git installed

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend (in another terminal)
cd app
npm install
```

### 2. Environment Configuration

#### Backend (.env in server/)
```bash
cd server
cp ../env.example .env
```

Edit `server/.env` with your configuration:
- `JWT_SECRET`: Generate a strong secret (use: `openssl rand -base64 32`)
- `MONGODB_URI`: Use local MongoDB (from Docker) or MongoDB Atlas
- `REDIS_HOST`: localhost (default)
- `RECAPTCHA_SECRET_KEY`: Optional for development
- `NEXTAUTH_SECRET`: Generate a strong secret

#### Frontend (.env.local in app/)
```bash
cd app
cp ../env.example .env.local
```

Edit `app/.env.local`:
- `NEXT_PUBLIC_API_URL`: http://localhost:5000
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`: Optional for development
- `NEXTAUTH_URL`: http://localhost:3001
- `NEXTAUTH_SECRET`: Same as backend

### 3. Start Docker Services

```bash
# From project root
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- Redis on port 6379

### 4. Seed Superadmin User

```bash
cd server
npm run seed:superadmin
```

Default credentials (change after first login):
- Email: `superadmin@example.com` (or set `SUPERADMIN_EMAIL` in .env)
- Password: `SuperAdmin123!@#` (or set `SUPERADMIN_PASSWORD` in .env)

### 5. Start Development Servers

#### Backend Server
```bash
cd server
npm run dev
```
Server runs on: http://localhost:5000

#### Frontend Server
```bash
cd app
npm run dev
```
App runs on: http://localhost:3001

## Testing

### Backend Tests
```bash
cd server
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Frontend E2E Tests
```bash
cd app
npm run cypress:open    # Interactive mode
npm run test:e2e       # Headless mode
```

**Note**: Make sure both backend and frontend servers are running before E2E tests.

## Health Check

Test the backend health endpoint:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## Quick Test Flow

1. Visit http://localhost:3001/register
2. Create a new account
3. Login at http://localhost:3001/login
4. You should be redirected to home page

## Troubleshooting

### MongoDB Connection Error
- Ensure Docker is running: `docker ps`
- Check MongoDB container: `docker-compose ps`
- Verify MONGODB_URI in .env

### Redis Connection Error
- Check Redis container: `docker-compose ps`
- Verify REDIS_HOST and REDIS_PORT in .env

### Port Already in Use
- Backend (5000): Change PORT in server/.env
- Frontend (3001): Change port in app/package.json scripts
- MongoDB (27017): Change port in docker-compose.yml

### Tests Fail
- Ensure MongoDB Memory Server is installed: `cd server && npm install`
- Check test environment variables in `server/tests/setup.ts`

## Next Steps

See `PLAN.md` for Phase 2 tasks:
- User profile management
- GDPR compliance
- Socket.io notifications
- i18n setup
