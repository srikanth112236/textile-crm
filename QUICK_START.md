# Quick Start Guide

## Starting the Application

### 1. Start Backend Server

Open a terminal and run:

```bash
cd server
npm run dev
```

The backend server will start on `http://localhost:5000`

### 2. Start Frontend Server

Open another terminal and run:

```bash
cd app
npm run dev
```

The frontend will start on `http://localhost:3001`

## Common Issues

### ERR_CONNECTION_REFUSED

**Problem**: Frontend can't connect to backend

**Solution**: 
1. Make sure backend server is running on port 5000
2. Check `http://localhost:5000/api/health` in your browser - should return `{"status":"ok"}`
3. Verify `NEXT_PUBLIC_API_URL` in `app/.env.local` is set to `http://localhost:5000`

### WebSocket Connection Failed

**Problem**: Socket.io can't connect

**Solution**:
1. Backend server must be running (Socket.io is initialized in backend)
2. Check that Redis is running (if using Redis adapter)
3. Verify Socket.io is properly initialized in `server/src/config/socket.ts`

### Port Already in Use

**Problem**: Port 5000 or 3001 is already in use

**Solution**:
1. Find and kill the process using the port:
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```
2. Or change the port in `.env` files

## Development Workflow

1. **Always start backend first** - Frontend depends on it
2. **Check backend health** - Visit `http://localhost:5000/api/health`
3. **Check frontend** - Visit `http://localhost:3001`
4. **Monitor logs** - Both servers show errors in console

## Environment Variables

### Backend (`server/.env`)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecom
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Frontend (`app/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3001
```

## Troubleshooting Checklist

- [ ] Backend server is running (`cd server && npm run dev`)
- [ ] Frontend server is running (`cd app && npm run dev`)
- [ ] MongoDB is running (if using local MongoDB)
- [ ] Redis is running (if using Redis)
- [ ] Ports 5000 and 3001 are available
- [ ] Environment variables are set correctly
- [ ] Dependencies are installed (`npm install` in both directories)

