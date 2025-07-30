#!/usr/bin/env node

/**
 * CORS Configuration Analysis and Testing Script
 * Analyzes CORS configuration without requiring a running server
 */

const colors = require("colors");
const path = require("path");

// Mock environment for testing
process.env.NODE_ENV = process.env.NODE_ENV || "development";

// Import CORS configuration utilities
const {
  getAllowedOrigins,
  isOriginAllowed,
  validateOriginSecurity,
  getCorsConfig,
  getSecureCorsConfig,
  getSocketIOCorsConfig,
  detectSuspiciousOrigin,
} = require("./src/utils/corsConfig");

class CorsConfigTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
    };
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    switch (type) {
      case "success":
        console.log(`[${timestamp}] ✅ ${message}`.green);
        break;
      case "error":
        console.log(`[${timestamp}] ❌ ${message}`.red);
        break;
      case "warning":
        console.log(`[${timestamp}] ⚠️  ${message}`.yellow);
        break;
      case "info":
      default:
        console.log(`[${timestamp}] ℹ️  ${message}`.blue);
        break;
    }
  }

  testAllowedOrigins() {
    this.log("Testing allowed origins configuration...", "info");

    const allowedOrigins = getAllowedOrigins();

    if (allowedOrigins && allowedOrigins.length > 0) {
      this.log(`Found ${allowedOrigins.length} allowed origins:`, "success");
      allowedOrigins.forEach((origin) => {
        this.log(`  - ${origin}`, "info");
      });
      this.results.passed++;
    } else {
      this.log("No allowed origins found - this could be a problem", "error");
      this.results.failed++;
    }

    // Test environment-specific origins
    if (process.env.NODE_ENV === "production") {
      const hasNetlifyOrigin = allowedOrigins.some((origin) =>
        origin.includes("d4media-erp.netlify.app")
      );

      if (hasNetlifyOrigin) {
        this.log("Production Netlify origin is configured", "success");
        this.results.passed++;
      } else {
        this.log("Production Netlify origin is missing", "error");
        this.results.failed++;
      }
    } else {
      const hasLocalhost = allowedOrigins.some(
        (origin) => origin.includes("localhost") || origin.includes("127.0.0.1")
      );

      if (hasLocalhost) {
        this.log("Development localhost origins are configured", "success");
        this.results.passed++;
      } else {
        this.log("Development localhost origins are missing", "warning");
        this.results.warnings++;
      }
    }

    return allowedOrigins;
  }

  testOriginValidation(allowedOrigins) {
    this.log("Testing origin validation logic...", "info");

    const testCases = [
      {
        origin: "http://localhost:3000",
        shouldAllow: true,
        description: "Localhost development",
      },
      {
        origin: "http://localhost:5173",
        shouldAllow: true,
        description: "Vite development",
      },
      {
        origin: "https://d4media-erp.netlify.app",
        shouldAllow: true,
        description: "Production frontend",
      },
      {
        origin: "https://malicious-site.com",
        shouldAllow: false,
        description: "Unauthorized domain",
      },
      {
        origin: "http://evil.com",
        shouldAllow: false,
        description: "Malicious domain",
      },
      {
        origin: null,
        shouldAllow: true,
        description: "No origin (mobile apps)",
      },
      { origin: undefined, shouldAllow: true, description: "Undefined origin" },
    ];

    testCases.forEach((testCase) => {
      const isAllowed = isOriginAllowed(testCase.origin, allowedOrigins, false);
      const originLabel = testCase.origin || "no-origin";

      if (isAllowed === testCase.shouldAllow) {
        this.log(
          `✅ ${testCase.description}: ${originLabel} - ${
            isAllowed ? "allowed" : "blocked"
          }`,
          "success"
        );
        this.results.passed++;
      } else {
        this.log(
          `❌ ${testCase.description}: ${originLabel} - Expected ${
            testCase.shouldAllow ? "allowed" : "blocked"
          }, got ${isAllowed ? "allowed" : "blocked"}`,
          "error"
        );
        this.results.failed++;
      }
    });
  }

  testSuspiciousOriginDetection() {
    this.log("Testing suspicious origin detection...", "info");

    const testCases = [
      {
        origin: "http://localhost:3000",
        suspicious: false,
        description: "Normal localhost",
      },
      {
        origin: "http://localhost:65535",
        suspicious: true,
        description: "High port localhost",
      },
      {
        origin: "http://192.168.1.1",
        suspicious: true,
        description: "IP address",
      },
      {
        origin: "https://abcdef123456789.ngrok.io",
        suspicious: true,
        description: "Ngrok tunnel",
      },
      {
        origin: "https://randomstring12345.herokuapp.com",
        suspicious: true,
        description: "Suspicious Heroku",
      },
      {
        origin: "https://example.tk",
        suspicious: true,
        description: "Free TLD domain",
      },
      {
        origin: "https://d4media-erp.netlify.app",
        suspicious: false,
        description: "Legitimate Netlify",
      },
    ];

    testCases.forEach((testCase) => {
      const isSuspicious = detectSuspiciousOrigin(testCase.origin);

      if (isSuspicious === testCase.suspicious) {
        this.log(
          `✅ ${testCase.description}: ${testCase.origin} - ${
            isSuspicious ? "suspicious" : "safe"
          }`,
          "success"
        );
        this.results.passed++;
      } else {
        this.log(
          `❌ ${testCase.description}: ${testCase.origin} - Expected ${
            testCase.suspicious ? "suspicious" : "safe"
          }, got ${isSuspicious ? "suspicious" : "safe"}`,
          "error"
        );
        this.results.failed++;
      }
    });
  }

  testCorsConfiguration(allowedOrigins) {
    this.log("Testing CORS configuration objects...", "info");

    // Test basic CORS config
    const basicConfig = getCorsConfig(allowedOrigins);

    if (basicConfig.credentials === true) {
      this.log("Credentials are enabled in CORS config", "success");
      this.results.passed++;
    } else {
      this.log(
        "Credentials are not enabled - this may cause issues",
        "warning"
      );
      this.results.warnings++;
    }

    if (basicConfig.methods && basicConfig.methods.includes("OPTIONS")) {
      this.log("OPTIONS method is included in allowed methods", "success");
      this.results.passed++;
    } else {
      this.log("OPTIONS method is missing from allowed methods", "error");
      this.results.failed++;
    }

    if (
      basicConfig.allowedHeaders &&
      basicConfig.allowedHeaders.includes("Authorization")
    ) {
      this.log("Authorization header is allowed", "success");
      this.results.passed++;
    } else {
      this.log("Authorization header is not allowed", "error");
      this.results.failed++;
    }

    // Test secure CORS config
    const secureConfig = getSecureCorsConfig(allowedOrigins, {
      useSecureValidator: true,
    });

    if (typeof secureConfig.origin === "function") {
      this.log("Secure origin validator is configured", "success");
      this.results.passed++;
    } else {
      this.log("Secure origin validator is not configured", "warning");
      this.results.warnings++;
    }

    // Test Socket.IO CORS config
    const socketConfig = getSocketIOCorsConfig(allowedOrigins);

    if (socketConfig.credentials === true) {
      this.log("Socket.IO credentials are enabled", "success");
      this.results.passed++;
    } else {
      this.log("Socket.IO credentials are not enabled", "warning");
      this.results.warnings++;
    }
  }

  testEnvironmentVariables() {
    this.log("Testing environment variables...", "info");

    const envVars = ["CLIENT_URL", "ALLOWED_ORIGINS", "NODE_ENV"];

    envVars.forEach((varName) => {
      if (process.env[varName]) {
        this.log(`${varName} is set: ${process.env[varName]}`, "success");
        this.results.passed++;
      } else {
        this.log(`${varName} is not set`, "warning");
        this.results.warnings++;
      }
    });

    // Check for production-specific requirements
    if (process.env.NODE_ENV === "production") {
      if (!process.env.CLIENT_URL && !process.env.ALLOWED_ORIGINS) {
        this.log(
          "Production environment should have CLIENT_URL or ALLOWED_ORIGINS set",
          "error"
        );
        this.results.failed++;
      }
    }
  }

  printSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("CORS CONFIGURATION TEST SUMMARY".bold);
    console.log("=".repeat(60));
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(
      `Total Tests: ${
        this.results.passed + this.results.failed + this.results.warnings
      }`
    );
    console.log(`Passed: ${this.results.passed}`.green);
    console.log(`Failed: ${this.results.failed}`.red);
    console.log(`Warnings: ${this.results.warnings}`.yellow);

    const successRate = (
      (this.results.passed /
        (this.results.passed + this.results.failed + this.results.warnings)) *
      100
    ).toFixed(2);
    console.log(`Success Rate: ${successRate}%`);

    console.log("\nRecommendations:".yellow.bold);

    if (this.results.failed === 0 && this.results.warnings === 0) {
      console.log("🎉 CORS configuration looks good!");
    } else {
      if (this.results.failed > 0) {
        console.log(
          "❌ Critical issues found - please fix these before deployment"
        );
      }
      if (this.results.warnings > 0) {
        console.log("⚠️  Some warnings found - consider addressing these");
      }
    }

    console.log("1. Test with actual server running using test-cors-local.js");
    console.log("2. Test deployment using test-cors-deployment.js");
    console.log("3. Test from browser using client/src/utils/corsTest.js");
    console.log("=".repeat(60));
  }

  async run() {
    console.log("CORS Configuration Analysis Tool".bold.blue);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log("-".repeat(60));

    // Run all tests
    const allowedOrigins = this.testAllowedOrigins();
    this.testOriginValidation(allowedOrigins);
    this.testSuspiciousOriginDetection();
    this.testCorsConfiguration(allowedOrigins);
    this.testEnvironmentVariables();

    // Print summary
    this.printSummary();

    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new CorsConfigTester();
  tester.run().catch((error) => {
    console.error("Test runner failed:", error);
    process.exit(1);
  });
}

module.exports = CorsConfigTester;
