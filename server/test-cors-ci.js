#!/usr/bin/env node

/**
 * CORS Testing Script for CI/CD Pipelines
 * Lightweight CORS testing suitable for automated testing environments
 */

const axios = require("axios");

class CorsCI {
  constructor() {
    this.serverUrl = process.env.SERVER_URL || "http://localhost:5000";
    this.testOrigin = process.env.TEST_ORIGIN || "http://localhost:3000";
    this.results = { passed: 0, failed: 0 };
  }

  log(message, success = true) {
    const status = success ? "✅" : "❌";
    console.log(`${status} ${message}`);
    if (success) this.results.passed++;
    else this.results.failed++;
  }

  async testHealthEndpoint() {
    try {
      const response = await axios.get(`${this.serverUrl}/api/v1/health`, {
        timeout: 5000,
        validateStatus: () => true,
      });

      if (response.status === 200) {
        this.log("Server health check passed");
        return true;
      } else {
        this.log(`Server health check failed: ${response.status}`, false);
        return false;
      }
    } catch (error) {
      this.log(`Server health check failed: ${error.message}`, false);
      return false;
    }
  }

  async testCorsHeaders() {
    try {
      const response = await axios.get(`${this.serverUrl}/api/v1/health`, {
        headers: { Origin: this.testOrigin },
        timeout: 5000,
        validateStatus: () => true,
      });

      const corsOrigin = response.headers["access-control-allow-origin"];
      const corsCredentials =
        response.headers["access-control-allow-credentials"];

      if (corsOrigin) {
        this.log(`CORS origin header present: ${corsOrigin}`);
      } else {
        this.log("CORS origin header missing", false);
      }

      if (corsCredentials === "true") {
        this.log("CORS credentials enabled");
      } else {
        this.log("CORS credentials not enabled", false);
      }

      return corsOrigin && corsCredentials === "true";
    } catch (error) {
      this.log(`CORS headers test failed: ${error.message}`, false);
      return false;
    }
  }

  async testPreflightRequest() {
    try {
      const response = await axios.options(`${this.serverUrl}/api/v1/health`, {
        headers: {
          Origin: this.testOrigin,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type, Authorization",
        },
        timeout: 5000,
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        this.log("Preflight request handled successfully");

        const allowMethods = response.headers["access-control-allow-methods"];
        const allowHeaders = response.headers["access-control-allow-headers"];

        if (allowMethods && allowMethods.includes("POST")) {
          this.log("POST method allowed in preflight");
        } else {
          this.log("POST method not allowed in preflight", false);
        }

        if (allowHeaders && allowHeaders.includes("Authorization")) {
          this.log("Authorization header allowed in preflight");
        } else {
          this.log("Authorization header not allowed in preflight", false);
        }

        return true;
      } else {
        this.log(`Preflight request failed: ${response.status}`, false);
        return false;
      }
    } catch (error) {
      this.log(`Preflight request failed: ${error.message}`, false);
      return false;
    }
  }

  async run() {
    console.log("CORS CI Testing");
    console.log(`Server: ${this.serverUrl}`);
    console.log(`Test Origin: ${this.testOrigin}`);
    console.log("-".repeat(40));

    const healthOk = await this.testHealthEndpoint();
    if (!healthOk) {
      console.log("Server health check failed, skipping CORS tests");
      process.exit(1);
    }

    await this.testCorsHeaders();
    await this.testPreflightRequest();

    console.log("-".repeat(40));
    console.log(
      `Results: ${this.results.passed} passed, ${this.results.failed} failed`
    );

    if (this.results.failed > 0) {
      console.log("❌ CORS tests failed");
      process.exit(1);
    } else {
      console.log("✅ All CORS tests passed");
      process.exit(0);
    }
  }
}

if (require.main === module) {
  const tester = new CorsCI();
  tester.run().catch((error) => {
    console.error("CI test runner failed:", error);
    process.exit(1);
  });
}

module.exports = CorsCI;
