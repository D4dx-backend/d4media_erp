/**
 * Browser-based CORS Testing Utility
 * Tests CORS configuration from the frontend perspective
 */

class CorsTestUtility {
  constructor(serverUrl = null) {
    this.serverUrl =
      serverUrl || process.env.REACT_APP_API_URL || "http://localhost:5000";
    this.results = [];
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };

    console.log(`[${timestamp}] ${message}`);
    this.results.push(logEntry);

    // Also log to a visual element if available
    const logElement = document.getElementById("cors-test-log");
    if (logElement) {
      const logDiv = document.createElement("div");
      logDiv.className = `cors-log-entry cors-log-${type}`;
      logDiv.textContent = `[${timestamp}] ${message}`;
      logElement.appendChild(logDiv);
      logElement.scrollTop = logElement.scrollHeight;
    }
  }

  async testEndpoint(endpoint, method = "GET", data = null) {
    const url = `${this.serverUrl}${endpoint}`;

    try {
      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Test credentials handling
      };

      if (
        data &&
        (method === "POST" || method === "PUT" || method === "PATCH")
      ) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url,
        method,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        url,
        method,
      };
    }
  }

  async testPreflightRequest(endpoint) {
    const url = `${this.serverUrl}${endpoint}`;

    try {
      // This will trigger a preflight request
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
          "X-Custom-Header": "test-value",
        },
        credentials: "include",
        body: JSON.stringify({ test: "data" }),
      });

      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url,
        preflightTriggered: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        url,
        preflightTriggered: true,
      };
    }
  }

  async runBasicTests() {
    this.log("Starting basic CORS tests...", "info");

    const endpoints = [
      "/api/v1/health",
      "/api/v1/auth/login",
      "/api/v1/users",
      "/api/v1/tasks",
      "/api/v1/departments",
    ];

    const testResults = [];

    for (const endpoint of endpoints) {
      this.log(`Testing GET request to ${endpoint}`, "info");

      const result = await this.testEndpoint(endpoint, "GET");

      if (result.success) {
        this.log(`✅ GET ${endpoint} - Status: ${result.status}`, "success");

        // Check for CORS headers
        const corsHeaders = {
          "access-control-allow-origin":
            result.headers["access-control-allow-origin"],
          "access-control-allow-credentials":
            result.headers["access-control-allow-credentials"],
          "access-control-expose-headers":
            result.headers["access-control-expose-headers"],
        };

        if (corsHeaders["access-control-allow-origin"]) {
          this.log(
            `  CORS Origin: ${corsHeaders["access-control-allow-origin"]}`,
            "info"
          );
        }

        if (corsHeaders["access-control-allow-credentials"] === "true") {
          this.log(`  Credentials allowed: Yes`, "info");
        }
      } else {
        this.log(`❌ GET ${endpoint} - Error: ${result.error}`, "error");
      }

      testResults.push({
        endpoint,
        method: "GET",
        ...result,
      });
    }

    return testResults;
  }

  async runPreflightTests() {
    this.log("Starting preflight CORS tests...", "info");

    const endpoints = ["/api/v1/auth/login", "/api/v1/users", "/api/v1/tasks"];

    const testResults = [];

    for (const endpoint of endpoints) {
      this.log(`Testing preflight request to ${endpoint}`, "info");

      const result = await this.testPreflightRequest(endpoint);

      if (result.success) {
        this.log(
          `✅ Preflight ${endpoint} - Status: ${result.status}`,
          "success"
        );
      } else {
        if (result.error.includes("CORS")) {
          this.log(
            `❌ Preflight ${endpoint} - CORS Error: ${result.error}`,
            "error"
          );
        } else {
          this.log(
            `⚠️ Preflight ${endpoint} - Error: ${result.error}`,
            "warning"
          );
        }
      }

      testResults.push({
        endpoint,
        method: "PREFLIGHT",
        ...result,
      });
    }

    return testResults;
  }

  async testCredentialsHandling() {
    this.log("Testing credentials handling...", "info");

    try {
      const response = await fetch(`${this.serverUrl}/api/v1/health`, {
        method: "GET",
        credentials: "include",
        headers: {
          Cookie: "test=value",
        },
      });

      const allowCredentials = response.headers.get(
        "access-control-allow-credentials"
      );

      if (allowCredentials === "true") {
        this.log("✅ Credentials handling is properly configured", "success");
        return { success: true, credentialsAllowed: true };
      } else {
        this.log("⚠️ Credentials may not be properly configured", "warning");
        return { success: false, credentialsAllowed: false };
      }
    } catch (error) {
      this.log(`❌ Credentials test failed: ${error.message}`, "error");
      return { success: false, error: error.message };
    }
  }

  async testWebSocketConnection() {
    this.log("Testing WebSocket CORS configuration...", "info");

    return new Promise((resolve) => {
      try {
        const wsUrl = this.serverUrl.replace("http", "ws");
        const socket = new WebSocket(
          `${wsUrl}/socket.io/?EIO=4&transport=websocket`
        );

        const timeout = setTimeout(() => {
          socket.close();
          this.log("⚠️ WebSocket connection timeout", "warning");
          resolve({ success: false, error: "Connection timeout" });
        }, 5000);

        socket.onopen = () => {
          clearTimeout(timeout);
          this.log("✅ WebSocket connection successful", "success");
          socket.close();
          resolve({ success: true });
        };

        socket.onerror = (error) => {
          clearTimeout(timeout);
          this.log(
            `❌ WebSocket connection failed: ${
              error.message || "Unknown error"
            }`,
            "error"
          );
          resolve({
            success: false,
            error: error.message || "Connection failed",
          });
        };

        socket.onclose = (event) => {
          if (event.code !== 1000) {
            // 1000 is normal closure
            clearTimeout(timeout);
            this.log(
              `❌ WebSocket closed unexpectedly: ${event.code} - ${event.reason}`,
              "error"
            );
            resolve({
              success: false,
              error: `Connection closed: ${event.code}`,
            });
          }
        };
      } catch (error) {
        this.log(`❌ WebSocket test failed: ${error.message}`, "error");
        resolve({ success: false, error: error.message });
      }
    });
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      serverUrl: this.serverUrl,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      results: this.results,
      summary: {
        total: this.results.length,
        success: this.results.filter((r) => r.type === "success").length,
        errors: this.results.filter((r) => r.type === "error").length,
        warnings: this.results.filter((r) => r.type === "warning").length,
      },
    };

    return report;
  }

  async runAllTests() {
    this.log("🚀 Starting comprehensive CORS tests from browser...", "info");
    this.log(`Testing server: ${this.serverUrl}`, "info");
    this.log(`From origin: ${window.location.origin}`, "info");

    const allResults = {};

    try {
      // Run basic tests
      allResults.basicTests = await this.runBasicTests();

      // Run preflight tests
      allResults.preflightTests = await this.runPreflightTests();

      // Test credentials
      allResults.credentialsTest = await this.testCredentialsHandling();

      // Test WebSocket (if applicable)
      allResults.webSocketTest = await this.testWebSocketConnection();

      this.log("🎉 All CORS tests completed!", "success");

      // Generate and return report
      const report = this.generateReport();
      this.log(
        `Generated test report with ${report.summary.total} entries`,
        "info"
      );

      return {
        success: report.summary.errors === 0,
        report,
        results: allResults,
      };
    } catch (error) {
      this.log(`❌ Test suite failed: ${error.message}`, "error");
      return {
        success: false,
        error: error.message,
        report: this.generateReport(),
      };
    }
  }
}

// Export for use in React components or standalone testing
export default CorsTestUtility;

// Also make it available globally for console testing
if (typeof window !== "undefined") {
  window.CorsTestUtility = CorsTestUtility;
}
