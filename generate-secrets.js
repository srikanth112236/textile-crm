// Node.js script to generate secrets for .env files
// Run this script: node generate-secrets.js

const crypto = require('crypto');

console.log('=== Generating Secrets for E-Commerce Platform ===\n');

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(32).toString('base64');
console.log('JWT_SECRET=' + jwtSecret);
console.log('');

// Generate NextAuth Secret
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
console.log('NEXTAUTH_SECRET=' + nextAuthSecret);
console.log('');

console.log('=== Instructions ===');
console.log('1. Copy JWT_SECRET to server/.env');
console.log('2. Copy NEXTAUTH_SECRET to:');
console.log('   - app/.env.local');
console.log('   - server/.env (optional)');
console.log('');
console.log('Values generated successfully!');

