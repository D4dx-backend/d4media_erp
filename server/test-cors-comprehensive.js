#!/usr/bin/env node

/**
 * Comprehensive CORS Testing Script
 * Tests CORS configuration in both local and deployment environments
 */

const CorsLocalTester = require("./test-cors-local");
const CorsDeploymentTester = require("./test-cors-deployment");
const colors = require("colors");

class ComprehensiveCorsTest {
  constructor() {
    this.localResults = null;
    this.deploymentResults = null;
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

  async runLocalTests() {
    console.log("\n" + "=".repeat(60));
    console.log("RUNNING LOCAL CORS TESTS".bold.cyan);
    console.log("=".repeat(60));

    try {
      const localTester = new CorsLocalTester();
      await localTester.run();
      this.localResults = localTester.results;
      return true;
    } catch (error) {
      this.log(`Local tests failed: ${error.message}`, "error");
      return false;
    }
  }

  async runDeploymentTests() {
    console.log("\n" + "=".repeat(60));
    console.log("RUNNING DEPLOYMENT CORS TESTS".bold.cyan);
    console.log("=".repeat(60));

    try {
      const deploymentTester = new CorsDeploymentTester();
      await deploymentTester.run();
      this.deploymentResults = deploymentTester.results;
      return true;
    } catch (error) {
      this.log(`Deployment tests failed: ${error.message}`, "error");
      return false;
    }
  }

  printFinalSummary() {
    console.log("\n" + "=".repeat(80));
    console.log("COMPREHENSIVE CORS TEST SUMMARY".bold.magenta);
    console.log("=".repeat(80));

    if (this.localResults) {
      console.log("Local Tests:".bold);
      console.log(`  Passed: ${this.localResults.passed}`.green);
      console.log(`  Failed: ${this.localResults.failed}`.red);
      console.log(
        `  Success Rate: ${(
          (this.localResults.passed /
            (this.localResults.passed + this.localResults.failed)) *
          100
        ).toFixed(2)}%`
      );
    }

    if (this.deploymentResults) {
      console.log("\nDeployment Tests:".bold);
      console.log(`  Passed: ${this.deploymentResults.passed}`.green);
      console.log(`  Failed: ${this.deploymentResults.failed}`.red);
      console.log(
        `  Success Rate: ${(
          (this.deploymentResults.passed /
            (this.deploymentResults.passed + this.deploymentResults.failed)) *
          100
        ).toFixed(2)}%`
      );
    }

    const totalPassed =
      (this.localResults?.passed || 0) + (this.deploymentResults?.passed || 0);
    const totalFailed =
      (this.localResults?.failed || 0) + (this.deploymentResults?.failed || 0);
    const totalTests = totalPassed + totalFailed;

    console.log("\nOverall Results:".bold);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Total Passed: ${totalPassed}`.green);
    console.log(`  Total Failed: ${totalFailed}`.red);
    console.log(
      `  Overall Success Rate: ${
        totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0
      }%`
    );

    console.log("\nNext Steps:".yellow.bold);
    if (totalFailed === 0) {
      console.log(
        "🎉 All CORS tests passed! Your configuration is working correctly."
      );
      console.log("✓ Local development CORS is properly configured");
      console.log("✓ Production deployment CORS is properly configured");
      console.log("✓ Security measures are in place");
    } else {
      console.log("⚠️  Some CORS tests failed. Please review the following:");
      console.log("1. Check server logs for CORS-related errors");
      console.log("2. Verify environment variables are set correctly");
      console.log("3. Ensure allowed origins match your frontend URLs");
      console.log("4. Test with actual frontend application");
      console.log("5. Check network connectivity and firewall settings");
    }

    console.log("=".repeat(80));
  }

  async run() {
    console.log("Comprehensive CORS Testing Suite".bold.blue);
    console.log(
      "This will test CORS configuration in both local and deployment environments"
    );
    console.log("-".repeat(80));

    let localSuccess = false;
    let deploymentSuccess = false;

    // Run local tests
    try {
      localSuccess = await this.runLocalTests();
    } catch (error) {
      this.log(`Local test suite failed: ${error.message}`, "error");
    }

    // Run deployment tests
    try {
      deploymentSuccess = await this.runDeploymentTests();
    } catch (error) {
      this.log(`Deployment test suite failed: ${error.message}`, "error");
    }

    // Print final summary
    this.printFinalSummary();

    // Exit with appropriate code
    const overallSuccess = localSuccess && deploymentSuccess;
    process.exit(overallSuccess ? 0 : 1);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ComprehensiveCorsTest();
  tester.run().catch((error) => {
    console.error("Comprehensive test runner failed:", error);
    process.exit(1);
  });
}

module.exports = ComprehensiveCorsTest;
