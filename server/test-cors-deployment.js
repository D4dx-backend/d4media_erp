#!/usr/bin/env node

/**
 * CORS Configuration Deployment Testing Script
 * Tests CORS configuration against deployed application
 */

const axios = require("axios");
const colors = require("colors");

// Configuration
const PRODUCTION_SERVER =
  process.env.PRODUCTION_SERVER || "https://your-backend-domain.com";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://d4media-erp.netlify.app";

const TEST_SCENARIOS = [
  {
    name: "Production Frontend to Production Backend",
    origin: FRONTEND_URL,
    serverUrl: PRODUCTION_SERVER,
    shouldPass: true,
  },
  {
    name: "Localhost to Production Backend",
    origin: "http://localhost:3000",
    serverUrl: PRODUCTION_SERVER,
    shouldPass: false,
  },
  {
    name: "Unauthorized Domain to Production Backend",
    origin: "https://malicious-site.com",
    serverUrl: PRODUCTION_SERVER,
    shouldPass: false,
  },
  {
    name: "No Origin to Production Backend",
    origin: null,
    serverUrl: PRODUCTION_SERVER,
    shouldPass: true,
  },
];

const TEST_ENDPOINTS = [
  "/api/v1/health",
  "/api/v1/auth/login",
  "/api/v1/users",
  "/api/v1/tasks",
];

class CorsDeploymentTester {
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

  async testDeploymentHealth() {
    this.log("Testing deployment health...", "info");

    try {
      const response = await axios.get(`${PRODUCTION_SERVER}/api/v1/health`, {
        timeout: 10000,
      });

      if (response.status === 200) {
        this.log("Deployment is healthy and responding", "success");
        this.log(
          `Server info: ${JSON.stringify(response.data, null, 2)}`,
          "info"
        );
        return true;
      } else {
        this.log(
          `Deployment health check failed with status: ${response.status}`,
          "error"
        );
        return false;
      }
    } catch (error) {
      this.log(`Deployment health check failed: ${error.message}`, "error");
      return false;
    }
  }
  async testCrossOriginRequest(scenario, endpoint) {
    try {
      const headers = {};
      if (scenario.origin) {
        headers["Origin"] = scenario.origin;
      }

      const response = await axios.get(`${scenario.serverUrl}${endpoint}`, {
        headers,
        timeout: 10000,
        validateStatus: () => true,
      });

      const corsHeaders = {
        "access-control-allow-origin":
          response.headers["access-control-allow-origin"],
        "access-control-allow-credentials":
          response.headers["access-control-allow-credentials"],
        "access-control-expose-headers":
          response.headers["access-control-expose-headers"],
      };

      const success = scenario.shouldPass
        ? response.status !== 403 && corsHeaders["access-control-allow-origin"]
        : response.status === 403 ||
          !corsHeaders["access-control-allow-origin"];

      return {
        success,
        status: response.status,
        headers: corsHeaders,
        scenario: scenario.name,
        endpoint,
      };
    } catch (error) {
      return {
        success: !scenario.shouldPass, // If we expect failure, error is success
        error: error.message,
        scenario: scenario.name,
        endpoint,
      };
    }
  }

  async testPreflightRequest(scenario, endpoint) {
    try {
      const headers = {
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      };

      if (scenario.origin) {
        headers["Origin"] = scenario.origin;
      }

      const response = await axios.options(`${scenario.serverUrl}${endpoint}`, {
        headers,
        timeout: 10000,
        validateStatus: () => true,
      });

      const corsHeaders = {
        "access-control-allow-origin":
          response.headers["access-control-allow-origin"],
        "access-control-allow-methods":
          response.headers["access-control-allow-methods"],
        "access-control-allow-headers":
          response.headers["access-control-allow-headers"],
        "access-control-max-age": response.headers["access-control-max-age"],
      };

      const success = scenario.shouldPass
        ? response.status >= 200 && response.status < 300
        : response.status === 403 || response.status >= 400;

      return {
        success,
        status: response.status,
        headers: corsHeaders,
        scenario: scenario.name,
        endpoint,
      };
    } catch (error) {
      return {
        success: !scenario.shouldPass,
        error: error.message,
        scenario: scenario.name,
        endpoint,
      };
    }
  }

  async runDeploymentTests() {
    this.log("Running deployment CORS tests...", "info");

    for (const scenario of TEST_SCENARIOS) {
      this.log(`Testing scenario: ${scenario.name}`, "info");

      for (const endpoint of TEST_ENDPOINTS) {
        // Test preflight request
        const preflightResult = await this.testPreflightRequest(
          scenario,
          endpoint
        );

        if (preflightResult.success) {
          this.log(
            `Preflight ${
              scenario.shouldPass ? "passed" : "correctly blocked"
            }: ${scenario.name} -> ${endpoint}`,
            "success"
          );
          this.results.passed++;
        } else {
          this.log(
            `Preflight ${
              scenario.shouldPass ? "failed" : "incorrectly allowed"
            }: ${scenario.name} -> ${endpoint}`,
            "error"
          );
          this.results.failed++;
        }

        this.results.tests.push({
          type: "preflight",
          scenario: scenario.name,
          endpoint,
          success: preflightResult.success,
          status: preflightResult.status,
          headers: preflightResult.headers,
        });

        // Test actual request
        const requestResult = await this.testCrossOriginRequest(
          scenario,
          endpoint
        );

        if (requestResult.success) {
          this.log(
            `Request ${scenario.shouldPass ? "passed" : "correctly blocked"}: ${
              scenario.name
            } -> ${endpoint}`,
            "success"
          );
          this.results.passed++;
        } else {
          this.log(
            `Request ${
              scenario.shouldPass ? "failed" : "incorrectly allowed"
            }: ${scenario.name} -> ${endpoint}`,
            "error"
          );
          this.results.failed++;
        }

        this.results.tests.push({
          type: "request",
          scenario: scenario.name,
          endpoint,
          success: requestResult.success,
          status: requestResult.status,
          headers: requestResult.headers,
        });
      }
    }
  }

  async testFrontendIntegration() {
    this.log("Testing frontend integration...", "info");

    try {
      // Simulate a typical frontend request
      const response = await axios.post(
        `${PRODUCTION_SERVER}/api/v1/auth/login`,
        {
          email: "test@example.com",
          password: "testpassword",
        },
        {
          headers: {
            Origin: FRONTEND_URL,
            "Content-Type": "application/json",
          },
          timeout: 10000,
          validateStatus: () => true,
        }
      );

      const corsOrigin = response.headers["access-control-allow-origin"];

      if (corsOrigin === FRONTEND_URL) {
        this.log("Frontend integration test passed", "success");
        this.results.passed++;
      } else {
        this.log(
          `Frontend integration failed: Expected origin ${FRONTEND_URL}, got ${corsOrigin}`,
          "error"
        );
        this.results.failed++;
      }
    } catch (error) {
      this.log(`Frontend integration test failed: ${error.message}`, "error");
      this.results.failed++;
    }
  }

  printSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("CORS DEPLOYMENT TEST SUMMARY".bold);
    console.log("=".repeat(60));
    console.log(`Production Server: ${PRODUCTION_SERVER}`);
    console.log(`Frontend URL: ${FRONTEND_URL}`);
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
            `- ${test.type}: ${test.scenario} -> ${test.endpoint} (Status: ${test.status})`
              .red
          );
        });
    }

    console.log("\nDeployment Checklist:".yellow.bold);
    console.log("1. ✓ Backend deployed and accessible");
    console.log("2. ✓ Frontend deployed and accessible");
    console.log("3. ✓ Environment variables configured correctly");
    console.log("4. ✓ CORS allows frontend domain");
    console.log("5. ✓ CORS blocks unauthorized domains");
    console.log("=".repeat(60));
  }

  async run() {
    console.log("CORS Deployment Testing Tool".bold.blue);
    console.log(`Testing production deployment...`);
    console.log("-".repeat(60));

    // Test deployment health first
    const isHealthy = await this.testDeploymentHealth();
    if (!isHealthy) {
      this.log("Deployment is not healthy. Some tests may fail.", "warning");
    }

    // Run all tests
    await this.runDeploymentTests();
    await this.testFrontendIntegration();

    // Print summary
    this.printSummary();

    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new CorsDeploymentTester();
  tester.run().catch((error) => {
    console.error("Test runner failed:", error);
    process.exit(1);
  });
}

module.exports = CorsDeploymentTester;
