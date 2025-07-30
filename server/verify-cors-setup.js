#!/usr/bin/env node

/**
 * Simple CORS Setup Verification Script
 * Verifies that CORS is properly configured for both development and production
 */

const colors = require("colors");

// Test both environments
const environments = [
  { NODE_ENV: "development", CLIENT_URL: "", ALLOWED_ORIGINS: "" },
  {
    NODE_ENV: "production",
    CLIENT_URL: "https://d4media-erp.netlify.app",
    ALLOWED_ORIGINS: "",
  },
];

console.log("CORS Setup Verification".bold.blue);
console.log("=".repeat(50));

environments.forEach((env) => {
  console.log(`\nTesting ${env.NODE_ENV.toUpperCase()} environment:`.bold);

  // Set environment variables
  Object.keys(env).forEach((key) => {
    if (env[key]) {
      process.env[key] = env[key];
    } else {
      delete process.env[key];
    }
  });

  try {
    // Clear require cache to get fresh config
    delete require.cache[require.resolve("./src/utils/corsConfig")];
    const {
      getAllowedOrigins,
      isOriginAllowed,
    } = require("./src/utils/corsConfig");

    const allowedOrigins = getAllowedOrigins();
    console.log(`  Allowed origins: ${allowedOrigins.join(", ")}`.green);

    // Test key origins
    const testOrigins = [
      "http://localhost:3000",
      "https://d4media-erp.netlify.app",
      "https://malicious-site.com",
    ];

    testOrigins.forEach((origin) => {
      const allowed = isOriginAllowed(origin, allowedOrigins, false);
      const status = allowed ? "✅ ALLOWED" : "❌ BLOCKED";
      console.log(`  ${origin}: ${status}`);
    });
  } catch (error) {
    console.log(`  Error: ${error.message}`.red);
  }
});

console.log("\n" + "=".repeat(50));
console.log("Verification complete!".bold.green);
console.log("\nNext steps:");
console.log("1. Start the server: npm run dev");
console.log("2. Test locally: node test-cors-local.js");
console.log("3. Test deployment: node test-cors-deployment.js");
console.log("4. Test from browser using client/src/utils/corsTest.js");
