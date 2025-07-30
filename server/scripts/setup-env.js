#!/usr/bin/env node

/**
 * Environment Setup Script
 * Helps configure environment variables for D4 Media Task Management System
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '../.env');
const examplePath = path.join(__dirname, '../.env.example');

console.log('🚀 D4 Media Task Management System - Environment Setup\n');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  rl.question('Do you want to overwrite it? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      setupEnvironment();
    } else {
      console.log('Setup cancelled.');
      rl.close();
    }
  });
} else {
  setupEnvironment();
}

function setupEnvironment() {
  console.log('\n📝 Setting up environment variables...\n');
  
  // Read example file
  let envContent = '';
  if (fs.existsSync(examplePath)) {
    envContent = fs.readFileSync(examplePath, 'utf8');
  }

  // Generate random secrets
  const jwtSecret = generateRandomString(64);
  const refreshSecret = generateRandomString(64);
  const encryptionKey = generateRandomString(32);

  // Replace placeholders
  envContent = envContent
    .replace('your-super-secret-jwt-key-here', jwtSecret)
    .replace('your-super-secret-refresh-key-here', refreshSecret)
    .replace('your-32-character-encryption-key-here', encryptionKey);

  // Write .env file
  fs.writeFileSync(envPath, envContent);

  console.log('✅ Environment file created successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Review and update the .env file with your specific values');
  console.log('2. Set up your MongoDB connection string');
  console.log('3. Configure email settings (optional)');
  console.log('4. Add WhatsApp credentials for password reset notifications');
  console.log('\n🔐 Security notes:');
  console.log('- JWT secrets have been auto-generated');
  console.log('- Encryption key has been auto-generated');
  console.log('- Never commit .env file to version control');
  console.log('\n📱 WhatsApp Setup:');
  console.log('- Get credentials from: https://dxing.net/dxapi/doc#documentation');
  console.log('- Account ID: 17503326891534b76d325a8f591b52d302e71813316853f511cb619');
  console.log('- Secret Key: 9d07dd4538190fc918a5ef6833bb95e8a7b5659a');
  console.log('- Without WhatsApp credentials, password reset will work but won\'t send notifications');

  rl.close();
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

rl.on('close', () => {
  process.exit(0);
});