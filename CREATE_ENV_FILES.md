# Create .env Files - Quick Guide

## 🎯 Quick Commands

### Windows (PowerShell)

```powershell
# Create backend .env
cd server
Copy-Item ..\env.example .env

# Create frontend .env.local
cd ..\app
Copy-Item ..\env.example .env.local
```

### Windows (CMD)

```cmd
# Create backend .env
cd server
copy ..\env.example .env

# Create frontend .env.local
cd ..\app
copy ..\env.example .env.local
```

### Linux/Mac

```bash
# Create backend .env
cd server
cp ../env.example .env

# Create frontend .env.local
cd ../app
cp ../env.example .env.local
```

---

## 📝 Then Edit the Files

### 1. Edit `server/.env`

Open `server/.env` and update:

```env
# Replace this line:
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# With your generated secret:
JWT_SECRET=0KXZf5MdDTXlR4cxyLvlzf4ihv7DkON33YER4n4xV9k=
```

Also ensure:
```env
MONGODB_URI=mongodb://localhost:27017/ecom
FRONTEND_URL=http://localhost:3001
```

### 2. Edit `app/.env.local`

Open `app/.env.local` and add/update:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_SECRET=Ofbrqg0ngTrDGoWAPuJmRFEGE4X1cEF/Alhbhpv49ao=
NEXTAUTH_URL=http://localhost:3001
```

---

## ✅ Done!

Your environment files are ready. Now you can:
1. Start Docker: `docker-compose up -d`
2. Start servers: `npm run dev` in both directories
3. Test the application!

