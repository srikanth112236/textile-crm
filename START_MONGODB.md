# How to Start MongoDB

## 🚀 Quick Start Options

### Option 1: Using Docker (Recommended)

```bash
# Start MongoDB container
docker compose up -d mongodb

# Verify it's running
docker compose ps
```

You should see:
```
NAME              STATUS
ecom-mongodb      Up
```

---

### Option 2: Using Local MongoDB Installation

#### Windows:
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Install MongoDB
3. Start MongoDB service:
   ```powershell
   # As Administrator
   net start MongoDB
   ```

#### Mac (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

### Option 3: MongoDB Atlas (Cloud - Free Tier Available)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `server/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecom
   ```

---

## ✅ Verify MongoDB is Running

### Check Connection:
```bash
# Using MongoDB shell (if installed)
mongo mongodb://localhost:27017/ecom

# Or test connection
mongosh mongodb://localhost:27017/ecom
```

### Check Docker Container:
```bash
docker compose ps
docker compose logs mongodb
```

---

## 🔧 Configuration

Your `server/.env` should have:
```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/ecom

# Or MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecom
```

---

## 🐛 Troubleshooting

### "ECONNREFUSED" Error

**Problem:** MongoDB is not running or not accessible.

**Solutions:**
1. **Check if MongoDB is running:**
   ```bash
   # Docker
   docker compose ps
   
   # Local service (Windows)
   services.msc  # Look for MongoDB service
   
   # Local service (Linux/Mac)
   sudo systemctl status mongod
   ```

2. **Start MongoDB:**
   ```bash
   # Docker
   docker compose up -d mongodb
   
   # Local (Windows - as Admin)
   net start MongoDB
   
   # Local (Linux/Mac)
   sudo systemctl start mongod
   ```

3. **Check MongoDB port:**
   - Default port: 27017
   - Verify nothing else is using it:
     ```bash
     # Windows
     netstat -ano | findstr :27017
     
     # Mac/Linux
     lsof -i :27017
     ```

### "Authentication Failed" Error

**Problem:** Wrong username/password or connection string.

**Solution:**
- Verify connection string in `server/.env`
- For MongoDB Atlas: Ensure IP is whitelisted
- For local MongoDB: Remove username/password if authentication is disabled

---

## 📝 Quick Reference

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

**Restart MongoDB (Docker):**
```bash
docker compose restart mongodb
```

---

**Once MongoDB is running, restart your server:**
```bash
cd server
npm run dev
```

You should see: `✅ MongoDB connected successfully`

