# Quick Password Change Guide

## 🚀 Fastest Way to Change MongoDB Password

### Option 1: Use the Encoding Script (Recommended)

1. **Run the script:**
   ```bash
   node encode-password.js
   ```

2. **Enter your new password** when prompted

3. **Copy the full connection string** it provides

4. **Paste it into `server/.env`:**
   ```env
   MONGODB_URI=mongodb+srv://steyziconnect_db_user:ENCODED_PASSWORD@cluster0.eemlaby.mongodb.net/ecom?appName=Cluster0
   ```

5. **Restart server:**
   ```bash
   cd server
   npm run dev
   ```

---

### Option 2: Manual Update

1. **Open `server/.env`**

2. **Find this line:**
   ```env
   MONGODB_URI=mongodb+srv://steyziconnect_db_user:OLD_PASSWORD@cluster0.eemlaby.mongodb.net/ecom?appName=Cluster0
   ```

3. **Replace `OLD_PASSWORD` with your new password**

4. **If password has special characters, encode them:**
   - `@` → `%40`
   - `:` → `%3A`
   - `/` → `%2F`
   - etc.

5. **Save and restart server**

---

### Option 3: Online Encoder

1. Go to: https://www.urlencoder.org/
2. Paste your password
3. Copy encoded result
4. Replace password in connection string

---

**Done! Your password is changed.** ✅

