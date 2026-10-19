# How to Start the Servers

## 🚀 Quick Start

You need **TWO terminals** - one for backend, one for frontend.

### Terminal 1: Backend Server

```bash
cd server
npm run dev
```

**Expected output:**
```
✅ MongoDB connected successfully
🚀 Server running on port 5000 in development mode
```

**If you see Redis errors:** That's OK - the app works without Redis for basic features.

---

### Terminal 2: Frontend Server

```bash
cd app
npm run dev
```

**Expected output:**
```
  ▲ Next.js 15.0.0
  - Local:        http://localhost:3001
  - ready started server on 0.0.0.0:3001
```

---

## ✅ Verify Both Servers Are Running

### Backend Health Check:
Open browser or use curl:
```
http://localhost:5000/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### Frontend:
Open browser:
```
http://localhost:3001
```

---

## 🐛 Troubleshooting

### "ERR_CONNECTION_REFUSED" Error

**Problem:** Backend server is not running.

**Solution:**
1. Open a new terminal
2. Navigate to server directory: `cd server`
3. Start the server: `npm run dev`
4. Wait for "Server running on port 5000" message
5. Try registration/login again

---

### "reCAPTCHA error" Warning

**Problem:** reCAPTCHA not configured (development mode).

**Solution:** This is OK for development! The app will work without reCAPTCHA. To fix:
1. Get reCAPTCHA keys from Google (see `ENV_SETUP_GUIDE.md`)
2. Add to `app/.env.local`:
   ```env
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key
   ```
3. Add to `server/.env`:
   ```env
   RECAPTCHA_SECRET_KEY=your-secret-key
   ```

---

### Port Already in Use

**Backend (port 5000):**
```bash
# Find process
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <pid> /F

# Or change port in server/.env
PORT=5001
```

**Frontend (port 3001):**
```bash
# Find process
netstat -ano | findstr :3001

# Kill process (Windows)
taskkill /PID <pid> /F

# Or change port in app/package.json scripts
"dev": "next dev -p 3001"
```

---

## 📋 Startup Checklist

Before testing registration/login:

- [ ] Backend server running (`npm run dev` in server/)
- [ ] Frontend server running (`npm run dev` in app/)
- [ ] MongoDB running (Docker: `docker compose up -d` or local MongoDB)
- [ ] Backend shows "Server running on port 5000"
- [ ] Frontend shows "ready started server on 0.0.0.0:3001"
- [ ] Health check works: http://localhost:5000/api/health

---

## 🎯 Test Flow

1. **Start backend** (Terminal 1)
2. **Start frontend** (Terminal 2)
3. **Open browser**: http://localhost:3001/register
4. **Fill form** and submit
5. **Should redirect** to login page on success

---

**Both servers must be running for the app to work!** 🚀

