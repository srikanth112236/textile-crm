# Testing Login and Registration for All Three Roles

## 🎯 Overview

This guide explains how to test login and registration for all three user roles (Superadmin, Admin, User) and verify logout functionality.

---

## 👥 User Roles

1. **Superadmin** - Full CRUD access to all resources
2. **Admin** - Partial CRUD access (permission-based)
3. **User** - Shopping only

---

## 🧪 Testing Registration

### Step 1: Register a User (Default Role: USER)

1. Navigate to: `http://localhost:3001/register`
2. Fill in the form:
   - Email: `user@example.com`
   - Password: `password123` (min 8 characters)
3. Click "Sign Up"
4. **Expected:** Redirects to `/user/dashboard`

### Step 2: Register an Admin User

**Note:** By default, registration creates a USER role. To create Admin/Superadmin:

**Option A: Use Backend Seed Script**
```bash
cd server
npm run seed:superadmin
```

**Option B: Manually Update in MongoDB**
1. Register a user normally
2. Update role in MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

**Option C: Create via Backend API (if you have admin access)**
```bash
# This would require admin endpoint (to be implemented)
```

### Step 3: Register a Superadmin User

Same as Admin - use seed script or manually update in MongoDB.

---

## 🔐 Testing Login

### Test Case 1: User Login

1. Navigate to: `http://localhost:3001/login`
2. Enter credentials:
   - Email: `user@example.com`
   - Password: `password123`
3. Click "Sign In"
4. **Expected:**
   - Redirects to `/user/dashboard`
   - Header shows user email and "User" badge
   - Logout button visible

### Test Case 2: Admin Login

1. Navigate to: `http://localhost:3001/login`
2. Enter admin credentials
3. Click "Sign In"
4. **Expected:**
   - Redirects to `/admin/dashboard`
   - Header shows user email and "Admin" badge
   - Logout button visible

### Test Case 3: Superadmin Login

1. Navigate to: `http://localhost:3001/login`
2. Enter superadmin credentials
3. Click "Sign In"
4. **Expected:**
   - Redirects to `/superadmin/dashboard`
   - Header shows user email and "Superadmin" badge
   - Logout button visible

---

## 🚪 Testing Logout

### Logout Button Locations

1. **Header Navigation** - Top right corner (all dashboards)
2. **Standalone LogoutButton Component** - Can be used anywhere

### Test Logout Flow

1. **Login** as any role
2. **Navigate** to respective dashboard
3. **Click** "Logout" button in header
4. **Expected:**
   - Session cleared
   - Tokens removed from localStorage
   - Redirect to `/login`
   - Cannot access protected routes

### Verify Logout Success

1. After logout, try accessing:
   - `/superadmin/dashboard` → Should redirect to `/login`
   - `/admin/dashboard` → Should redirect to `/login`
   - `/user/dashboard` → Should redirect to `/login`

---

## 📋 Quick Test Checklist

### Registration Tests
- [ ] Register as User → Redirects to `/user/dashboard`
- [ ] Register with duplicate email → Shows error
- [ ] Register with invalid email → Shows validation error
- [ ] Register with short password → Shows validation error

### Login Tests
- [ ] Login as User → Redirects to `/user/dashboard`
- [ ] Login as Admin → Redirects to `/admin/dashboard`
- [ ] Login as Superadmin → Redirects to `/superadmin/dashboard`
- [ ] Login with wrong password → Shows error
- [ ] Login with non-existent email → Shows error

### Logout Tests
- [ ] Logout from User dashboard → Redirects to `/login`
- [ ] Logout from Admin dashboard → Redirects to `/login`
- [ ] Logout from Superadmin dashboard → Redirects to `/login`
- [ ] After logout, cannot access protected routes

### Role-Based Access Tests
- [ ] User cannot access `/admin/dashboard` → Redirects to `/user/dashboard`
- [ ] User cannot access `/superadmin/dashboard` → Redirects to `/user/dashboard`
- [ ] Admin cannot access `/superadmin/dashboard` → Redirects to `/user/dashboard`
- [ ] Superadmin can access all dashboards

---

## 🛠️ Creating Test Users

### Using Seed Script (Superadmin)

```bash
cd server
npm run seed:superadmin
```

This creates:
- Email: `superadmin@example.com`
- Password: `SuperAdmin123!`
- Role: `superadmin`

### Manual MongoDB Update

```javascript
// Connect to MongoDB
mongosh mongodb://localhost:27017/ecom

// Update user role to admin
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)

// Update user role to superadmin
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "superadmin" } }
)
```

---

## 🎨 Dashboard Features

### Superadmin Dashboard (`/superadmin/dashboard`)
- System Settings
- User Management
- Products Management
- Analytics
- Security Settings
- **Logout button in header**

### Admin Dashboard (`/admin/dashboard`)
- Products Management
- Orders Management
- Users View
- Analytics
- **Logout button in header**

### User Dashboard (`/user/dashboard`)
- My Orders
- Wishlist
- Payment Methods
- Shop
- **Logout button in header**

---

## 🔍 Debugging Tips

### Check Session
```javascript
// In browser console
localStorage.getItem('accessToken')
```

### Check User Role
```javascript
// In browser console (after login)
// The session should contain role information
```

### Check Backend Logs
```bash
# In server terminal
# Look for login/registration logs
```

---

## ✅ Expected Behavior Summary

| Action | User Role | Redirect To | Logout Available |
|--------|-----------|-------------|-----------------|
| Register | USER | `/user/dashboard` | ✅ Yes |
| Login | USER | `/user/dashboard` | ✅ Yes |
| Login | ADMIN | `/admin/dashboard` | ✅ Yes |
| Login | SUPERADMIN | `/superadmin/dashboard` | ✅ Yes |
| Logout | Any | `/login` | ✅ Yes |

---

**All three roles can now login, access their dashboards, and logout properly!** 🎉

