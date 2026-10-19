#!/usr/bin/env node

/**
 * Quick script to URL-encode passwords for MongoDB connection strings
 * Usage: node encode-password.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 MongoDB Password URL Encoder\n');
console.log('Enter your password to get the URL-encoded version for your connection string.\n');

rl.question('Password: ', (password) => {
  if (!password) {
    console.log('\n❌ Password cannot be empty!');
    rl.close();
    return;
  }

  const encoded = encodeURIComponent(password);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ RESULTS');
  console.log('='.repeat(60));
  console.log(`\nOriginal Password:  ${password}`);
  console.log(`Encoded Password:   ${encoded}`);
  console.log('\n' + '-'.repeat(60));
  console.log('📝 Copy this connection string to your server/.env file:');
  console.log('-'.repeat(60));
  console.log(`MONGODB_URI=mongodb+srv://steyziconnect_db_user:${encoded}@cluster0.eemlaby.mongodb.net/ecom?appName=Cluster0`);
  console.log('='.repeat(60) + '\n');
  
  rl.close();
});

