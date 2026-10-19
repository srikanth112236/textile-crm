# 🔐 Quick Secret Setup Guide

## ✅ Your Generated Secrets

From the command output above, you should have:

```
JWT_SECRET=0KXZf5MdDTXlR4cxyLvlzf4ihv7DkON33YER4n4xV9k=
NEXTAUTH_SECRET=Ofbrqg0ngTrDGoWAPuJmRFEGE4X1cEF/Alhbhpv49ao=
```

**⚠️ If you need to generate new ones, run:**
```bash
node -e "const crypto = require('crypto'); console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('base64')); console.log('NEXTAUTH_SECRET=' + crypto.randomBytes(32).toString('base64'));"
```

---

## 📝 Step-by-Step: Add Secrets to .env Files

### Step 1: Create Backend .env File

```bash
# From project root
cd server
copy ..\env.example .env
```

**Edit `server/.env`** and find this line:
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Replace it with:**
```env
JWT_SECRET=0KXZf5MdDTXlR4cxyLvlzf4ihv7DkON33YER4n4xV9k=
```

Also verify these lines are set:
```env
MONGODB_URI=mongodb://localhost:27017/ecom
FRONTEND_URL=http://localhost:3001
```

---

### Step 2: Create Frontend .env.local File

```bash
# From project root
cd app
copy ..\env.example .env.local
```

**Edit `app/.env.local`** and add these lines:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_SECRET=Ofbrqg0ngTrDGoWAPuJmRFEGE4X1cEF/Alhbhpv49ao=
NEXTAUTH_URL=http://localhost:3001
```

---

## ✅ Verification Checklist

After setting up your .env files, verify:

- [ ] `server/.env` exists and contains `JWT_SECRET=...` (your generated value)
- [ ] `server/.env` contains `MONGODB_URI=mongodb://localhost:27017/ecom`
- [ ] `app/.env.local` exists and contains `NEXTAUTH_SECRET=...` (your generated value)
- [ ] `app/.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:5000`

---

## 🚀 Next Steps

1. **Start Docker services:**
   ```bash
   docker-compose up -d
   ```

2. **Create superadmin user:**
   ```bash
   cd server
   npm run seed:superadmin
   ```

3. **Start backend server:**
   ```bash
   cd server
   npm run dev
   ```

4. **Start frontend server (new terminal):**
   ```bash
   cd app
   npm run dev
   ```

5. **Test the application:**
   - Open: http://localhost:3001
   - Register a new account
   - Login with your credentials

---

## 🎯 Quick Command Reference

### Generate New Secrets (if needed)
```bash
node -e "const crypto = require('crypto'); console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('base64')); console.log('NEXTAUTH_SECRET=' + crypto.randomBytes(32).toString('base64'));"
```

### Create .env Files
```bash
# Backend
cd server
copy ..\env.example .env

# Frontend
cd ..\app
copy ..\env.example .env.local
```

### Verify Docker Services
```bash
docker-compose ps
```

---

## 🐛 Troubleshooting

### "JWT_SECRET is not defined"
- ✅ Check `server/.env` exists
- ✅ Verify `JWT_SECRET=` line has your generated value (no quotes)
- ✅ Restart the server after editing `.env`

### "NEXTAUTH_SECRET missing"
- ✅ Check `app/.env.local` exists (not `.env`)
- ✅ Verify `NEXTAUTH_SECRET=` line has your generated value
- ✅ Restart Next.js dev server after editing `.env.local`

### "Cannot find module"
- ✅ Run `npm install` in both `server` and `app` directories

---

## 📚 More Information

- **Detailed Setup**: See `ENV_SETUP_GUIDE.md`
- **Quick Start**: See `QUICK_START.md`
- **Full Documentation**: See `README.md`

---

**You're all set!** 🎉 Copy the secrets to your .env files and start the servers!

