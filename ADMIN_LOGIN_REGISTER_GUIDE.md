# Admin and Superadmin Login & Registration Guide

## 🎯 Where Can Admin/Superadmin Login and Register?

### ✅ Login (All Roles)

**URL:** `http://localhost:3001/login`

**All three roles use the same login page:**
- ✅ **User** → Login → Redirects to `/user/dashboard`
- ✅ **Admin** → Login → Redirects to `/admin/dashboard`
- ✅ **Superadmin** → Login → Redirects to `/superadmin/dashboard`

**Login Flow:**
1. Go to `/login`
2. Enter email and password
3. Click "Sign In"
4. Automatically redirected to role-specific dashboard

---

### ✅ Registration

#### Regular User Registration
**URL:** `http://localhost:3001/register`
- Creates users with **USER** role
- No special requirements
- Available to everyone

#### Admin/Superadmin Registration
**URL:** `http://localhost:3001/register-admin`
- Creates users with **ADMIN** or **SUPERADMIN** role
- Requires **Admin Registration Secret**
- Link available on login and register pages

---

## 🔐 How to Register Admin/Superadmin

### Step 1: Set Admin Registration Secret

1. **Open `server/.env`**
2. **Add:**
   ```env
   ADMIN_REGISTRATION_SECRET=your-secure-secret-key-here
   ```
3. **Generate secure secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

### Step 2: Register Admin/Superadmin

1. **Navigate to:** `http://localhost:3001/register-admin`
2. **Select Role:**
   - Admin (administrative access)
   - Superadmin (full system access)
3. **Enter Admin Secret:** (from `server/.env`)
4. **Fill in:**
   - Email
   - Password (min 8 characters)
   - Confirm Password
5. **Click "Register"**

**Result:**
- Admin → Redirects to `/admin/dashboard`
- Superadmin → Redirects to `/superadmin/dashboard`

---

## 🌱 Alternative: Use Seed Script (Superadmin)

### Quick Superadmin Creation

```bash
cd server
npm run seed:superadmin
```

**Default Credentials:**
- Email: `superadmin@example.com`
- Password: `SuperAdmin123!@#`

**Custom Credentials** (set in `server/.env`):
```env
SUPERADMIN_EMAIL=your-email@example.com
SUPERADMIN_PASSWORD=YourPassword123!
```

---

## 📋 Complete Registration Flow

### Regular User
1. Go to `/register`
2. Enter email and password
3. Submit
4. → Redirects to `/user/dashboard`

### Admin
1. Go to `/register-admin`
2. Select "Admin"
3. Enter admin secret (from `.env`)
4. Enter email and password
5. Submit
6. → Redirects to `/admin/dashboard`

### Superadmin
**Option A: Registration Page**
1. Go to `/register-admin`
2. Select "Superadmin"
3. Enter admin secret
4. Enter email and password
5. Submit
6. → Redirects to `/superadmin/dashboard`

**Option B: Seed Script**
1. Set `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` in `.env`
2. Run `npm run seed:superadmin`
3. Login with credentials
4. → Redirects to `/superadmin/dashboard`

---

## 🔍 Quick Access Links

| Action | URL | Role Created |
|--------|-----|--------------|
| Login (All) | `/login` | - |
| Register User | `/register` | USER |
| Register Admin | `/register-admin` | ADMIN/SUPERADMIN |

---

## ✅ Testing Checklist

### Test Admin Registration
- [ ] Set `ADMIN_REGISTRATION_SECRET` in `server/.env`
- [ ] Restart server
- [ ] Go to `/register-admin`
- [ ] Select "Admin"
- [ ] Enter secret and credentials
- [ ] Submit
- [ ] Should redirect to `/admin/dashboard`
- [ ] Logout button visible

### Test Superadmin Registration
- [ ] Go to `/register-admin`
- [ ] Select "Superadmin"
- [ ] Enter secret and credentials
- [ ] Submit
- [ ] Should redirect to `/superadmin/dashboard`
- [ ] Logout button visible

### Test Login (All Roles)
- [ ] Go to `/login`
- [ ] Enter credentials
- [ ] Should redirect to role-specific dashboard
- [ ] Logout button visible

---

## 🎯 Summary

**Login:** All roles use `/login` - same page, different redirects

**Registration:**
- **Users:** `/register` (no secret needed)
- **Admin/Superadmin:** `/register-admin` (requires secret)

**All roles can:**
- ✅ Login at `/login`
- ✅ Access their dashboard
- ✅ Logout from header button

---

**Everything is set up and ready to use!** 🚀

