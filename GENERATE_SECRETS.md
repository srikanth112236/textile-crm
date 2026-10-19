# How to Generate Secrets - Quick Guide

## ✅ Method 1: Using Node.js Script (Easiest - Works on All Platforms)

```bash
node generate-secrets.js
```

This will output:
```
=== Generating Secrets for E-Commerce Platform ===

JWT_SECRET=abc123xyz789...
NEXTAUTH_SECRET=xyz789abc123...

=== Instructions ===
1. Copy JWT_SECRET to server/.env
2. Copy NEXTAUTH_SECRET to:
   - app/.env.local
   - server/.env (optional)
```

---

## ✅ Method 2: Using PowerShell (Windows)

### Option A: Run the PowerShell Script
```powershell
.\generate-secrets.ps1
```

### Option B: Run PowerShell Command Directly
```powershell
# Generate JWT Secret
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Generate NextAuth Secret (run again for different value)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## ✅ Method 3: Using Node.js One-Liner

```bash
# Generate JWT Secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"

# Generate NextAuth Secret
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
```

---

## ✅ Method 4: Using Bash Script (Linux/Mac)

```bash
chmod +x generate-secrets.sh
./generate-secrets.sh
```

---

## 📝 After Generating Secrets

1. **Copy JWT_SECRET** to `server/.env`:
   ```env
   JWT_SECRET=your-generated-secret-here
   ```

2. **Copy NEXTAUTH_SECRET** to `app/.env.local`:
   ```env
   NEXTAUTH_SECRET=your-generated-secret-here
   ```

3. **Optional**: Also add NEXTAUTH_SECRET to `server/.env` if needed

---

## ⚠️ Important Notes

- **Never commit** these secrets to Git (already in `.gitignore`)
- **Use different values** for JWT_SECRET and NEXTAUTH_SECRET
- **Keep secrets secure** - don't share them publicly
- **Regenerate** if you suspect they've been compromised

---

## 🎯 Quick Start

**Recommended for Windows**: Use Method 1 (Node.js script)
```bash
node generate-secrets.js
```

Copy the output values to your `.env` files and you're done!

