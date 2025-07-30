#!/usr/bin/env node

/**
 * CORS Configuration Local Testing Script
 * Tests CORS configuration locally during development
 */

const axios = require("axios");
const colors = require("colors");

// Configuration
const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";
const TEST_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "https://d4media-erp.netlify.app",
  "https://unauthorized-domain.com",
  "http://malicious-site.com",
  null, // No origin header
];

const TEST_ENDPOINTS = [
  "/api/v1/health",
  "/api/v1/auth/login",
  "/api/v1/users",
  "/api/v1/tasks",
  "/api/v1/departments",
];

class CorsLocalTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
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

  async testPreflightRequest(origin, endpoint) {
    try {
      const headers = {
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      };

      if (origin) {
        headers["Origin"] = origin;
      }

      const response = await axios.options(`${SERVER_URL}${endpoint}`, {
        headers,
        timeout: 5000,
        validateStatus: () => true, // Don't throw on non-2xx status
      });

      const corsHeaders = {
        "access-control-allow-origin":
          response.headers["access-control-allow-origin"],
        "access-control-allow-methods":
          response.headers["access-control-allow-methods"],
        "access-control-allow-headers":
          response.headers["access-control-allow-headers"],
        "access-control-allow-credentials":
          response.headers["access-control-allow-credentials"],
        "access-control-max-age": response.headers["access-control-max-age"],
      };

      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        headers: corsHeaders,
        origin,
        endpoint,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        origin,
        endpoint,
      };
    }
  }

  async testActualRequest(origin, endpoint, method = "GET") {
    try {
      const headers = {};
      if (origin) {
        headers["Origin"] = origin;
      }

      const response = await axios({
        method,
        url: `${SERVER_URL}${endpoint}`,
        headers,
        timeout: 5000,
        validateStatus: () => true, // Don't throw on non-2xx status
      });

      const corsHeaders = {
        "access-control-allow-origin":
          response.headers["access-control-allow-origin"],
        "access-control-allow-credentials":
          response.headers["access-control-allow-credentials"],
        "access-control-expose-headers":
          response.headers["access-control-expose-headers"],
      };

      return {
        success: response.status !== 403, // CORS errors typically return 403
        status: response.status,
        headers: corsHeaders,
        origin,
        endpoint,
        method,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        origin,
        endpoint,
        method,
      };
    }
  }

  async testServerHealth() {
    this.log("Testing server health...", "info");

    try {
      const response = await axios.get(`${SERVER_URL}/api/v1/health`, {
        timeout: 5000,
      });

      if (response.status === 200) {
        this.log("Server is healthy and responding", "success");
        return true;
      } else {
        this.log(
          `Server health check failed with status: ${response.status}`,
          "error"
        );
        return false;
      }
    } catch (error) {
      this.log(`Server health check failed: ${error.message}`, "error");
      return false;
    }
  }

  async runPreflightTests() {
    this.log("Running preflight (OPTIONS) request tests...", "info");

    for (const origin of TEST_ORIGINS) {
      for (const endpoint of TEST_ENDPOINTS) {
        const result = await this.testPreflightRequest(origin, endpoint);
        const originLabel = origin || "no-origin";

        if (result.success) {
          this.log(`Preflight OK: ${originLabel} -> ${endpoint}`, "success");
          this.results.passed++;

          // Validate CORS headers
          if (
            origin &&
            result.headers["access-control-allow-origin"] !== origin
          ) {
            this.log(
              `Warning: Expected origin ${origin} but got ${result.headers["access-control-allow-origin"]}`,
              "warning"
            );
          }

          if (!result.headers["access-control-allow-methods"]) {
            this.log(
              `Warning: Missing Access-Control-Allow-Methods header`,
              "warning"
            );
          }
        } else {
          const shouldFail =
            origin &&
            (origin.includes("unauthorized") || origin.includes("malicious"));

          if (shouldFail) {
            this.log(
              `Preflight correctly blocked: ${originLabel} -> ${endpoint}`,
              "success"
            );
            this.results.passed++;
          } else {
            this.log(
              `Preflight failed: ${originLabel} -> ${endpoint} (${
                result.error || result.status
              })`,
              "error"
            );
            this.results.failed++;
          }
        }

        this.results.tests.push({
          type: "preflight",
          origin: originLabel,
          endpoint,
          success: result.success,
          status: result.status,
          headers: result.headers,
        });
      }
    }
  }

  async runActualRequestTests() {
    this.log("Running actual request tests...", "info");

    for (const origin of TEST_ORIGINS) {
      for (const endpoint of TEST_ENDPOINTS) {
        const result = await this.testActualRequest(origin, endpoint);
        const originLabel = origin || "no-origin";

        if (result.success) {
          this.log(`Request OK: ${originLabel} -> ${endpoint}`, "success");
          this.results.passed++;

          // Validate CORS headers in response
          if (
            origin &&
            result.headers["access-control-allow-origin"] !== origin
          ) {
            this.log(
              `Warning: Expected origin ${origin} but got ${result.headers["access-control-allow-origin"]}`,
              "warning"
            );
          }
        } else {
          const shouldFail =
            origin &&
            (origin.includes("unauthorized") || origin.includes("malicious"));

          if (shouldFail) {
            this.log(
              `Request correctly blocked: ${originLabel} -> ${endpoint}`,
              "success"
            );
            this.results.passed++;
          } else {
            this.log(
              `Request failed: ${originLabel} -> ${endpoint} (${
                result.error || result.status
              })`,
              "error"
            );
            this.results.failed++;
          }
        }

        this.results.tests.push({
          type: "actual",
          origin: originLabel,
          endpoint,
          method: result.method,
          success: result.success,
          status: result.status,
          headers: result.headers,
        });
      }
    }
  }

  async testCorsSecurityEndpoint() {
    this.log("Testing CORS security monitoring endpoint...", "info");

    try {
      const response = await axios.get(`${SERVER_URL}/api/v1/security/cors`, {
        timeout: 5000,
        validateStatus: () => true,
      });

      if (response.status === 200 || response.status === 403) {
        this.log("CORS security endpoint is accessible", "success");

        if (response.status === 200 && response.data) {
          this.log(
            `Security stats: ${JSON.stringify(
              response.data.security,
              null,
              2
            )}`,
            "info"
          );
        }

        this.results.passed++;
      } else {
        this.log(
          `CORS security endpoint returned unexpected status: ${response.status}`,
          "warning"
        );
        this.results.failed++;
      }
    } catch (error) {
      this.log(`CORS security endpoint test failed: ${error.message}`, "error");
      this.results.failed++;
    }
  }

  async testCredentialsHandling() {
    this.log("Testing credentials handling...", "info");

    const allowedOrigin = "http://localhost:3000";

    try {
      const response = await axios.get(`${SERVER_URL}/api/v1/health`, {
        headers: {
          Origin: allowedOrigin,
          Cookie: "test=value",
        },
        withCredentials: true,
        timeout: 5000,
      });

      const allowCredentials =
        response.headers["access-control-allow-credentials"];

      if (allowCredentials === "true") {
        this.log("Credentials handling is properly configured", "success");
        this.results.passed++;
      } else {
        this.log(
          "Credentials handling may not be properly configured",
          "warning"
        );
        this.results.failed++;
      }
    } catch (error) {
      this.log(`Credentials test failed: ${error.message}`, "error");
      this.results.failed++;
    }
  }

  printSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("CORS LOCAL TEST SUMMARY".bold);
    console.log("=".repeat(60));
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`Passed: ${this.results.passed}`.green);
    console.log(`Failed: ${this.results.failed}`.red);
    console.log(
      `Success Rate: ${(
        (this.results.passed / (this.results.passed + this.results.failed)) *
        100
      ).toFixed(2)}%`
    );

    if (this.results.failed > 0) {
      console.log("\nFailed Tests:".red.bold);
      this.results.tests
        .filter((test) => !test.success)
        .forEach((test) => {
          console.log(
            `- ${test.type}: ${test.origin} -> ${test.endpoint} (Status: ${test.status})`
              .red
          );
        });
    }

    console.log("\nRecommendations:".yellow.bold);
    console.log("1. Ensure server is running on the expected port");
    console.log("2. Check environment variables (CLIENT_URL, ALLOWED_ORIGINS)");
    console.log("3. Verify CORS configuration in server/server.js");
    console.log("4. Test with actual frontend application");
    console.log("=".repeat(60));
  }

  async run() {
    console.log("CORS Local Testing Tool".bold.blue);
    console.log(`Testing server at: ${SERVER_URL}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log("-".repeat(60));

    // Test server health first
    const isHealthy = await this.testServerHealth();
    if (!isHealthy) {
      this.log("Server is not healthy. Aborting tests.", "error");
      process.exit(1);
    }

    // Run all tests
    await this.runPreflightTests();
    await this.runActualRequestTests();
    await this.testCorsSecurityEndpoint();
    await this.testCredentialsHandling();

    // Print summary
    this.printSummary();

    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new CorsLocalTester();
  tester.run().catch((error) => {
    console.error("Test runner failed:", error);
    process.exit(1);
  });
}

module.exports = CorsLocalTester;
