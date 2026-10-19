# Fix MongoDB Atlas Connection String

## 🔧 Problem

Your MongoDB Atlas connection string has a password with special characters (`@`) that need to be URL-encoded.

**Current (broken):**
```
mongodb+srv://steyziconnect_db_user:Steyzi@2002@cluster0.eemlaby.mongodb.net/?appName=Cluster0
```

**Issue:** The `@` in the password `Steyzi@2002` is being interpreted as the delimiter between credentials and hostname.

---

## ✅ Solution

### Step 1: URL-Encode Special Characters in Password

Special characters in passwords must be URL-encoded:
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `#` → `%23`
- `?` → `%3F`
- `&` → `%26`
- `=` → `%3D`

**Your password:** `Steyzi@2002`  
**Encoded password:** `Steyzi%402002`

### Step 2: Add Database Name

The connection string should include the database name:
```
mongodb+srv://username:password@host/database?options
```

### Step 3: Update `server/.env`

Update your `server/.env` file:

```env
# MongoDB Atlas (with URL-encoded password)
MONGODB_URI=mongodb+srv://steyziconnect_db_user:Steyzi%402002@cluster0.eemlaby.mongodb.net/ecom?appName=Cluster0
```

**Key changes:**
1. `Steyzi@2002` → `Steyzi%402002` (URL-encoded)
2. Added `/ecom` before `?` (database name)

---

## 🔍 Alternative: Use MongoDB Atlas Connection String Builder

1. Go to MongoDB Atlas Dashboard
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your URL-encoded password
6. Replace `<dbname>` with `ecom`

**Example from Atlas:**
```
mongodb+srv://steyziconnect_db_user:<password>@cluster0.eemlaby.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

**After replacement:**
```
mongodb+srv://steyziconnect_db_user:Steyzi%402002@cluster0.eemlaby.mongodb.net/ecom?retryWrites=true&w=majority&appName=Cluster0
```

---

## 🛠️ Quick Fix Script

If you have many special characters, use this Node.js script:

```javascript
// encode-password.js
const password = 'Steyzi@2002';
const encoded = encodeURIComponent(password);
console.log(`Original: ${password}`);
console.log(`Encoded:  ${encoded}`);
```

Run:
```bash
node encode-password.js
```

Output:
```
Original: Steyzi@2002
Encoded:  Steyzi%402002
```

---

## ✅ Verify Connection

After updating `.env`, restart your server:

```bash
cd server
npm run dev
```

**Expected output:**
```
🔌 Attempting to connect to MongoDB: mongodb+srv://steyziconnect_db_user:***@cluster0.eemlaby.mongodb.net/ecom?appName=Cluster0
✅ MongoDB connected successfully
   Database: ecom
```

---

## 🐛 Other Common Issues

### 1. IP Address Not Whitelisted

**Error:** `ENOTFOUND` or connection timeout

**Fix:**
1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Add `0.0.0.0/0` (allow all) for development
4. Or add your specific IP address

### 2. Database User Not Created

**Error:** Authentication failed

**Fix:**
1. Go to MongoDB Atlas → Database Access
2. Ensure user `steyziconnect_db_user` exists
3. User must have read/write permissions

### 3. Cluster Paused

**Error:** Connection timeout

**Fix:**
1. Go to MongoDB Atlas → Clusters
2. Ensure cluster is running (not paused)

---

## 📝 Final Connection String Format

```env
# Format
MONGODB_URI=mongodb+srv://username:URL_ENCODED_PASSWORD@host/database?options

# Your working connection string
MONGODB_URI=mongodb+srv://steyziconnect_db_user:Steyzi%402002@cluster0.eemlaby.mongodb.net/ecom?appName=Cluster0
```

---

**After fixing, restart your server and you should see "✅ MongoDB connected successfully"!** 🚀

