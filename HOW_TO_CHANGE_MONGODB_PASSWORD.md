# How to Change MongoDB Password

## 🔐 Step-by-Step Guide

### Step 1: Update Password in MongoDB Atlas (Optional)

If you want to change your MongoDB Atlas user password:

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Navigate to **Database Access** (left sidebar)
3. Find your user (e.g., `steyziconnect_db_user`)
4. Click **Edit** (pencil icon)
5. Click **Edit Password**
6. Enter new password and confirm
7. Click **Update User**

---

### Step 2: Update Password in `.env` File

#### Location
Your `.env` file should be in: `server/.env`

#### Current Format
```env
MONGODB_URI=mongodb+srv://username:OLD_PASSWORD@host/database?options
```

#### New Format
```env
MONGODB_URI=mongodb+srv://username:NEW_PASSWORD@host/database?options
```

---

### Step 3: URL-Encode Special Characters

**IMPORTANT:** If your new password contains special characters, you must URL-encode them:

| Character | Encoded | Example |
|-----------|---------|---------|
| `@` | `%40` | `pass@word` → `pass%40word` |
| `:` | `%3A` | `pass:word` → `pass%3Aword` |
| `/` | `%2F` | `pass/word` → `pass%2Fword` |
| `#` | `%23` | `pass#word` → `pass%23word` |
| `?` | `%3F` | `pass?word` → `pass%3Fword` |
| `&` | `%26` | `pass&word` → `pass%26word` |
| `=` | `%3D` | `pass=word` → `pass%3Dword` |
| ` ` (space) | `%20` | `pass word` → `pass%20word` |

---

### Step 4: Examples

#### Example 1: Simple Password (No Special Characters)
**Password:** `MyNewPassword123`

```env
MONGODB_URI=mongodb+srv://steyziconnect_db_user:MyNewPassword123@cluster0.eemlaby.mongodb.net/ecom?appName=Cluster0
```

#### Example 2: Password with @ Symbol
**Password:** `MyPass@2024`

**URL-encoded:** `MyPass%402024`

```env
MONGODB_URI=mongodb+srv://steyziconnect_db_user:MyPass%402024@cluster0.eemlaby.mongodb.net/ecom?appName=Cluster0
```

#### Example 3: Password with Multiple Special Characters
**Password:** `My:Pass@2024#Secure`

**URL-encoded:** `My%3APass%402024%23Secure`

```env
MONGODB_URI=mongodb+srv://steyziconnect_db_user:My%3APass%402024%23Secure@cluster0.eemlaby.mongodb.net/ecom?appName=Cluster0
```

---

### Step 5: Quick URL-Encoding (Node.js)

Create a helper script to encode your password:

**Create file:** `encode-password.js` (in project root)
```javascript
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your password: ', (password) => {
  const encoded = encodeURIComponent(password);
  console.log('\n✅ URL-Encoded Password:');
  console.log(encoded);
  console.log('\n📝 Full connection string:');
  console.log(`mongodb+srv://steyziconnect_db_user:${encoded}@cluster0.eemlaby.mongodb.net/ecom?appName=Cluster0`);
  rl.close();
});
```

**Run:**
```bash
node encode-password.js
```

**Enter your password when prompted** - it will show you the encoded version!

---

### Step 6: Update Your `.env` File

1. Open `server/.env` in your editor
2. Find the line with `MONGODB_URI=`
3. Replace the password part (between `username:` and `@`)
4. Make sure to URL-encode if needed
5. Save the file

**Before:**
```env
MONGODB_URI=mongodb+srv://steyziconnect_db_user:Steyzi%402002@cluster0.eemlaby.mongodb.net/ecom?appName=Cluster0
```

**After (example with new password `NewPass123`):**
```env
MONGODB_URI=mongodb+srv://steyziconnect_db_user:NewPass123@cluster0.eemlaby.mongodb.net/ecom?appName=Cluster0
```

---

### Step 7: Restart Server

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

## 🛠️ Online URL Encoder (Alternative)

If you don't want to use Node.js, use an online URL encoder:

1. Go to: https://www.urlencoder.org/
2. Paste your password
3. Click "Encode"
4. Copy the encoded result
5. Use it in your connection string

---

## ✅ Quick Checklist

- [ ] Updated password in MongoDB Atlas (if changing Atlas password)
- [ ] URL-encoded password if it contains special characters
- [ ] Updated `MONGODB_URI` in `server/.env`
- [ ] Saved the `.env` file
- [ ] Restarted the server
- [ ] Verified connection success message

---

## 🐛 Troubleshooting

### "Authentication failed" Error

- Double-check password is correct
- Ensure password is URL-encoded if it has special characters
- Verify user exists in MongoDB Atlas

### "ENOTFOUND" Error

- Check if password encoding is correct
- Verify connection string format
- Ensure cluster is running in Atlas

---

**That's it! Your password is now updated.** 🎉

