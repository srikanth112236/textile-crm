# Troubleshooting Guide

## Common Issues and Solutions

### 1. Mongoose Duplicate Schema Index Warning ✅ FIXED

**Warning:**
```
[MONGOOSE] Warning: Duplicate schema index on {"email":1} found.
[MONGOOSE] Warning: Duplicate schema index on {"role":1} found.
```

**Solution:** ✅ Fixed in `server/src/models/User.ts`
- Removed `index: true` from field definitions (using `unique: true` for email and explicit `schema.index()` calls instead)

---

### 2. Redis Connection Errors

**Error:**
```
❌ Redis connection error: ECONNREFUSED
```

**Cause:** Redis service is not running.

**Solution:**

#### Option A: Start Docker Services (Recommended)

```bash
# From project root
docker-compose up -d
```

Verify services are running:
```bash
docker-compose ps
```

You should see:
```
NAME              STATUS
ecom-mongodb      Up
ecom-redis        Up
```

#### Option B: Run Redis Locally

If you don't want to use Docker:

**Windows:**
1. Download Redis from: https://github.com/microsoftarchive/redis/releases
2. Install and start Redis service

**Mac (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

---

### 3. MongoDB Connection Errors

**Error:**
```
MongoDB connection error: ECONNREFUSED
```

**Solution:**

1. **Check Docker is running:**
   ```bash
   docker ps
   ```

2. **Start MongoDB (if using Docker):**
   ```bash
   docker-compose up -d mongodb
   ```

3. **Verify MongoDB URI in `server/.env`:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/ecom
   ```

4. **For MongoDB Atlas:**
   - Ensure your IP is whitelisted
   - Verify connection string format
   - Check username/password are correct

---

### 4. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**

1. **Find process using the port:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Mac/Linux
   lsof -i :5000
   ```

2. **Kill the process or change port:**
   - Kill: `taskkill /PID <pid> /F` (Windows) or `kill -9 <pid>` (Mac/Linux)
   - Or change port in `server/.env`: `PORT=5001`

---

### 5. Environment Variables Not Loaded

**Symptoms:**
- "JWT_SECRET is not defined"
- "MONGODB_URI is not defined"

**Solution:**

1. **Check `.env` file exists:**
   ```bash
   # Backend
   ls server/.env
   
   # Frontend
   ls app/.env.local
   ```

2. **Verify file location:**
   - Backend: `server/.env` (in server directory)
   - Frontend: `app/.env.local` (in app directory)

3. **Restart server after editing `.env` files:**
   - Stop the server (Ctrl+C)
   - Start again: `npm run dev`

---

### 6. Module Not Found Errors

**Error:**
```
Cannot find module 'xyz'
```

**Solution:**

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   
   cd ../app
   npm install
   ```

2. **Check package.json includes the module**

3. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

### 7. TypeScript Compilation Errors

**Error:**
```
Type errors found
```

**Solution:**

1. **Run type checking:**
   ```bash
   cd server
   npm run type-check
   ```

2. **Check tsconfig.json is correct**

3. **Ensure all @types packages are installed**

---

### 8. Database Connection Timeout

**Error:**
```
MongooseServerSelectionError: connection timeout
```

**Solution:**

1. **Check MongoDB is accessible:**
   ```bash
   # Test MongoDB connection
   mongo mongodb://localhost:27017/ecom
   ```

2. **Increase timeout in connection options** (if needed)

3. **Check firewall/network settings**

---

### 9. JWT Token Errors

**Error:**
```
Token expired
Invalid token
```

**Solution:**

1. **Check JWT_SECRET is set correctly in `.env`**
2. **Verify token hasn't expired** (15min for access tokens)
3. **Clear localStorage and login again** (frontend)
4. **Regenerate JWT_SECRET if compromised**

---

### 10. CORS Errors

**Error:**
```
Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3001' has been blocked by CORS
```

**Solution:**

1. **Verify FRONTEND_URL in `server/.env`:**
   ```env
   FRONTEND_URL=http://localhost:3001
   ```

2. **Check CORS middleware is loaded before routes**

3. **Ensure credentials are enabled in CORS config**

---

## Quick Diagnostic Commands

```bash
# Check Docker services
docker-compose ps

# Check MongoDB connection
docker-compose exec mongodb mongo --eval "db.adminCommand('ping')"

# Check Redis connection
docker-compose exec redis redis-cli ping
# Should return: PONG

# Verify environment variables are loaded
cd server
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set')"

# Check if ports are in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                  # Mac/Linux
```

---

## Getting Help

If issues persist:

1. Check logs for detailed error messages
2. Verify all services are running (Docker, MongoDB, Redis)
3. Ensure all environment variables are set
4. Check network/firewall settings
5. Review `SETUP.md` for complete setup instructions

---

**Last Updated**: After fixing Mongoose duplicate index warnings and improving Redis connection handling.

