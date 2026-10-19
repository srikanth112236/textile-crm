# Local MongoDB Setup Guide

## 🚀 Quick Setup for Local Development

### Option 1: Using Docker (Recommended - Easiest)

```bash
# Start MongoDB container
docker compose up -d mongodb

# Verify it's running
docker compose ps
```

**Expected output:**
```
NAME              STATUS
ecom-mongodb      Up
```

---

### Option 2: Using Local MongoDB Installation

#### Windows:
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Install MongoDB
3. Start MongoDB service:
   ```powershell
   # Run PowerShell as Administrator
   net start MongoDB
   ```

#### Verify MongoDB is Running:
```bash
# Check if MongoDB is listening on port 27017
netstat -ano | findstr :27017
```

---

## 📝 Environment Configuration

### Step 1: Create `.env` file in `server/` directory

Copy from `env.example`:
```bash
cd server
copy ..\env.example .env
```

### Step 2: Update MongoDB URI in `server/.env`

For **local MongoDB** (default):
```env
MONGODB_URI=mongodb://localhost:27017/ecom
```

For **MongoDB Atlas** (cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecom
```

---

## ✅ Verify Configuration

### Check if `.env` is loaded:
1. Start your server: `npm run dev`
2. Look for this message:
   ```
   🔌 Attempting to connect to MongoDB: mongodb://localhost:27017/ecom
   ✅ MongoDB connected successfully
      Database: ecom
   ```

### If you see connection errors:
1. **Check MongoDB is running:**
   ```bash
   # Docker
   docker compose ps
   
   # Local service (Windows)
   services.msc  # Look for MongoDB service
   ```

2. **Check your `.env` file:**
   - File should be in `server/.env` (not root directory)
   - Should contain: `MONGODB_URI=mongodb://localhost:27017/ecom`

3. **Verify MongoDB port:**
   - Default: `27017`
   - Check if port is in use:
     ```bash
     netstat -ano | findstr :27017
     ```

---

## 🐛 Troubleshooting

### Error: "ECONNREFUSED"

**Problem:** MongoDB is not running or not accessible.

**Solutions:**
1. **Start MongoDB:**
   ```bash
   # Docker
   docker compose up -d mongodb
   
   # Local (Windows - as Admin)
   net start MongoDB
   ```

2. **Check MongoDB service status:**
   ```bash
   # Windows
   sc query MongoDB
   
   # Or check Services app
   services.msc
   ```

### Error: "Operation buffering timed out"

**Problem:** MongoDB connection is taking too long.

**Solutions:**
1. Ensure MongoDB is actually running
2. Check firewall settings
3. Verify `MONGODB_URI` in `.env` is correct
4. Try connecting manually:
   ```bash
   mongosh mongodb://localhost:27017/ecom
   ```

### Error: "Duplicate schema index"

**Status:** ✅ Fixed - This warning should no longer appear after the latest update.

---

## 📋 Quick Reference

**Start MongoDB (Docker):**
```bash
docker compose up -d mongodb
```

**Stop MongoDB (Docker):**
```bash
docker compose stop mongodb
```

**View MongoDB Logs (Docker):**
```bash
docker compose logs mongodb
```

**Check MongoDB Connection:**
```bash
mongosh mongodb://localhost:27017/ecom
```

---

## 🎯 Next Steps

1. **Create `.env` file** in `server/` directory
2. **Set `MONGODB_URI`** to your MongoDB connection string
3. **Start MongoDB** (Docker or local service)
4. **Restart your server:** `npm run dev`
5. **Verify connection:** Look for "✅ MongoDB connected successfully"

---

**Once MongoDB is connected, your server will work fully!** 🚀

