#!/usr/bin/env node

// Simple script to check environment variables
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🔍 Checking environment configuration...\n')

// Check .env file
try {
  const envPath = join(__dirname, '.env')
  const envContent = readFileSync(envPath, 'utf8')
  console.log('📄 .env file content:')
  console.log(envContent)
  console.log()
} catch (error) {
  console.log('❌ .env file not found or not readable')
  console.log()
}

// Check package.json for build scripts
try {
  const packagePath = join(__dirname, 'package.json')
  const packageContent = JSON.parse(readFileSync(packagePath, 'utf8'))
  console.log('📦 Build scripts:')
  console.log(JSON.stringify(packageContent.scripts, null, 2))
  console.log()
} catch (error) {
  console.log('❌ package.json not found or not readable')
  console.log()
}

console.log('✅ Environment check complete')
console.log('\n💡 If the API URL is not working:')
console.log('1. Make sure .env file has VITE_API_URL set')
console.log('2. Restart the development server')
console.log('3. Clear browser cache')
console.log('4. Check netlify.toml for production builds')