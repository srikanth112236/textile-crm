# How to Create Admin and Superadmin Users

## 🎯 Overview

There are **three ways** to create admin and superadmin users:

1. **Admin Registration Page** (with secret key) - Recommended for Admin
2. **Seed Script** - Recommended for Superadmin
3. **Manual Database Update** - For existing users

---

## 🔐 Method 1: Admin Registration Page (Recommended)

### Step 1: Set Admin Registration Secret

Add to `server/.env`:
```env
ADMIN_REGISTRATION_SECRET=your-secure-secret-key-here
```

**Generate a secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 2: Register Admin/Superadmin

1. Navigate to: `http://localhost:3001/register-admin`
2. Select role: **Admin** or **Superadmin**
3. Enter **Admin Registration Secret** (from `.env`)
4. Fill in email and password
5. Click "Register"

**Note:** Only one Superadmin is allowed. If one exists, you'll get an error.

---

## 🌱 Method 2: Seed Script (Superadmin Only)

### Quick Setup

```bash
cd server
npm run seed:superadmin
```

**Default credentials:**
- Email: `superadmin@example.com`
- Password: `SuperAdmin123!@#`

**Custom credentials** (set in `server/.env`):
```env
SUPERADMIN_EMAIL=your-email@example.com
SUPERADMIN_PASSWORD=YourSecurePassword123!
```

Then run:
```bash
npm run seed:superadmin
```

---

## 🛠️ Method 3: Manual Database Update

### Update Existing User to Admin

1. **Connect to MongoDB:**
   ```bash
   mongosh mongodb://localhost:27017/ecom
   # Or for Atlas
   mongosh "your-connection-string"
   ```

2. **Update user role:**
   ```javascript
   // Update to Admin
   db.users.updateOne(
     { email: "user@example.com" },
     { $set: { role: "admin" } }
   )

   // Update to Superadmin
   db.users.updateOne(
     { email: "user@example.com" },
     { $set: { role: "superadmin" } }
   )
   ```

3. **Verify:**
   ```javascript
   db.users.findOne({ email: "user@example.com" })
   ```

---

## 📋 Registration Endpoints

### Regular User Registration
- **URL:** `/register`
- **Role:** Always creates `USER`
- **No secret required**

### Admin/Superadmin Registration
- **URL:** `/register-admin`
- **Role:** `ADMIN` or `SUPERADMIN`
- **Requires:** `ADMIN_REGISTRATION_SECRET`

### API Endpoint
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin",  // or "superadmin"
  "adminSecret": "your-admin-secret-from-env"
}
```

---

## ✅ Quick Test Guide

### Test Admin Registration

1. **Set secret in `server/.env`:**
   ```env
   ADMIN_REGISTRATION_SECRET=test-secret-123
   ```

2. **Restart server:**
   ```bash
   cd server
   npm run dev
   ```

3. **Register admin:**
   - Go to: `http://localhost:3001/register-admin`
   - Select: Admin
   - Secret: `test-secret-123`
   - Email: `admin@example.com`
   - Password: `password123`
   - Submit

4. **Login:**
   - Go to: `http://localhost:3001/login`
   - Login with admin credentials
   - Should redirect to `/admin/dashboard`

### Test Superadmin Registration

1. **Use seed script:**
   ```bash
   cd server
   npm run seed:superadmin
   ```

2. **Or use registration page:**
   - Go to: `http://localhost:3001/register-admin`
   - Select: Superadmin
   - Enter secret and credentials
   - Submit

3. **Login:**
   - Should redirect to `/superadmin/dashboard`

---

## 🔒 Security Notes

1. **Admin Registration Secret:**
   - Keep it secure and never commit to git
   - Use a strong, random secret
   - Change it regularly in production

2. **Superadmin:**
   - Only one superadmin allowed
   - Should be created via seed script in production
   - Admin registration page allows creation but validates uniqueness

3. **Role Assignment:**
   - Regular users cannot specify role during registration
   - Only admin/superadmin registration requires secret
   - All role assignments are validated server-side

---

## 📝 Environment Variables

Add to `server/.env`:

```env
# Admin Registration Secret
ADMIN_REGISTRATION_SECRET=your-secure-secret-key

# Superadmin Seed (optional - for seed script)
SUPERADMIN_EMAIL=superadmin@example.com
SUPERADMIN_PASSWORD=SuperAdmin123!@#
```

---

## 🎯 Summary

| Method | Role | Best For | Requires Secret |
|--------|------|----------|-----------------|
| `/register` | USER | Regular users | ❌ No |
| `/register-admin` | ADMIN/SUPERADMIN | Admin users | ✅ Yes |
| Seed Script | SUPERADMIN | Initial setup | ❌ No (uses env vars) |
| Manual DB Update | Any | Existing users | ❌ No |

---

**All three roles can now be created easily!** 🚀

