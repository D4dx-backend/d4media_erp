const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const path = require("path");
const fs = require("fs");
const http = require("http");
const socketIO = require("socket.io");
const cluster = require("cluster");
const os = require("os");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Import routes (will be created)
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const departmentRoutes = require("./src/routes/departmentRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const studioRoutes = require("./src/routes/studioRoutes");
const invoiceRoutes = require("./src/routes/invoiceRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const clientPortalRoutes = require("./src/routes/clientPortalRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const equipmentRoutes = require("./src/routes/equipmentRoutes");
const rentalRoutes = require("./src/routes/rentalRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const quotationRoutes = require("./src/routes/quotationRoutes");
const activityRoutes = require("./src/routes/activityRoutes");

const errorHandler = require("./src/middleware/errorHandler");
const schedulerService = require("./src/services/schedulerService");
const notificationService = require("./src/services/notificationService");
const securityMonitoring = require("./src/middleware/securityMonitoring");
const intrusionDetection = require("./src/middleware/intrusionDetection");
const { appLogger } = require("./src/utils/logger");
const { cacheControlHeaders, cache } = require("./src/middleware/cacheControl");
const { createIndexes } = require("./src/utils/dbIndexes");
const {
  getSystemInfo,
  getDatabaseStatus,
  performHealthCheck,
} = require("./src/utils/network");
const {
  getAllowedOrigins,
  getCorsConfig,
  getSecureCorsConfig,
  getSocketIOCorsConfig,
  logCorsConfiguration,
  createCorsSecurityMiddleware,
  getCorsSecurityStats,
} = require("./src/utils/corsConfig");
const {
  corsSecurityMiddleware,
} = require("./src/middleware/corsSecurityMiddleware");

// Clustering for production environment
const isMaster =
  !process.env.PM2_CLUSTER &&
  cluster.isMaster &&
  process.env.NODE_ENV === "production";
const numCPUs = os.cpus().length;

if (isMaster) {
  appLogger.info(`Master process ${process.pid} is running`);
  appLogger.info(`Starting ${numCPUs} worker processes...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker events
  cluster.on("exit", (worker, code, signal) => {
    appLogger.warn(
      `Worker ${worker.process.pid} died with code ${code} and signal ${signal}`
    );
    appLogger.info("Starting a new worker...");
    cluster.fork();
  });
} else {
  // Worker process or PM2 managed process
  const app = express();
  const server = http.createServer(app);

  // Get environment-aware CORS configuration
  const allowedOrigins = getAllowedOrigins();

  // Log CORS configuration for debugging
  logCorsConfiguration(allowedOrigins);

  const io = socketIO(server, {
    cors: getSocketIOCorsConfig(allowedOrigins),
    allowEIO3: true, // Allow Engine.IO v3 clients to connect
    transports: ["websocket", "polling"], // Support both WebSocket and polling
  });
  const PORT = process.env.PORT || 5000;

  // Initialize Socket.IO for real-time notifications
  notificationService.initializeSocketIO(io);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });
  app.use("/api/", limiter);

  // Enhanced CORS configuration with security monitoring
  const corsSecurityOptions = {
    useSecureValidator: process.env.NODE_ENV === "production",
    enableSecurityHeaders: true,
    maxSuspiciousAttempts: 10,
    suspiciousOriginCooldown: 300000, // 5 minutes
  };

  app.use(cors(getSecureCorsConfig(allowedOrigins, corsSecurityOptions)));

  // Add CORS security monitoring middleware
  app.use(createCorsSecurityMiddleware());

  // Add enhanced threat detection middleware
  app.use(corsSecurityMiddleware.middleware());

  // Additional explicit OPTIONS handler for comprehensive preflight support
  app.options("*", (req, res) => {
    const origin = req.headers.origin;

    // Check if origin is allowed using the utility function
    if (!origin || allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin || "*");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"
      );
      res.header(
        "Access-Control-Allow-Headers",
        [
          "Origin",
          "X-Requested-With",
          "Content-Type",
          "Accept",
          "Authorization",
          "Cache-Control",
          "Pragma",
          "X-HTTP-Method-Override",
          "X-Forwarded-For",
          "X-Real-IP",
          "User-Agent",
          "Referer",
          "Accept-Encoding",
          "Accept-Language",
          "Connection",
          "Upgrade-Insecure-Requests",
        ].join(", ")
      );
      res.header(
        "Access-Control-Expose-Headers",
        [
          "Content-Length",
          "Content-Type",
          "Date",
          "ETag",
          "Last-Modified",
          "X-Total-Count",
          "X-Page-Count",
          "X-Rate-Limit-Remaining",
          "X-Rate-Limit-Reset",
        ].join(", ")
      );
      res.header("Access-Control-Max-Age", "86400");

      appLogger.info(
        `CORS preflight request handled for origin: ${origin || "no-origin"}`
      );
      res.status(200).end();
    } else {
      appLogger.warn(
        `CORS preflight blocked for unauthorized origin: ${origin}`
      );
      res.status(403).json({ error: "CORS: Origin not allowed" });
    }
  });

  // Middleware to ensure CORS headers are present on all responses
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    // Only set headers if origin is allowed or if no origin (for same-origin requests)
    if (!origin || allowedOrigins.includes(origin)) {
      // Set CORS headers for all responses
      if (origin) {
        res.header("Access-Control-Allow-Origin", origin);
      }
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Expose-Headers",
        [
          "Content-Length",
          "Content-Type",
          "Date",
          "ETag",
          "Last-Modified",
          "X-Total-Count",
          "X-Page-Count",
          "X-Rate-Limit-Remaining",
          "X-Rate-Limit-Reset",
        ].join(", ")
      );

      // Add Vary header to indicate that the response varies based on Origin
      res.header("Vary", "Origin");
    }

    next();
  });

  // Security middleware
  app.use(mongoSanitize()); // Prevent NoSQL injection attacks
  app.use(xss()); // Clean user input from malicious HTML
  // app.use(intrusionDetection); // Intrusion detection system - temporarily disabled
  app.use(securityMonitoring); // Security event monitoring

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Logging
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("combined"));
  }

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    appLogger.info("Created uploads directory");
  }

  // Static files
  app.use("/uploads", express.static("uploads"));

  // Database connection
  const connectDB = require("./src/config/database");
  connectDB().then(async () => {
    // Create database indexes for performance optimization
    if (mongoose.connection.readyState === 1) {
      try {
        await createIndexes();
        appLogger.info("Database indexes created successfully");
      } catch (error) {
        appLogger.error("Error creating database indexes:", error);
      }
    }
  });

  // Routes with appropriate caching strategies
  app.use("/api/v1/auth", cacheControlHeaders(0), authRoutes); // No caching for auth routes
  app.use("/api/v1/users", cacheControlHeaders(0), userRoutes); // No caching for user data
  app.use("/api/v1/departments", cacheControlHeaders(300), departmentRoutes); // Cache departments for 5 minutes
  app.use("/api/v1/tasks", cacheControlHeaders(60), taskRoutes); // Cache tasks for 1 minute
  app.use("/api/v1/studio", cacheControlHeaders(120), studioRoutes); // Cache studio data for 2 minutes
  app.use("/api/v1/invoices", cacheControlHeaders(0), invoiceRoutes); // No caching for invoices
  app.use("/api/v1/reports", cacheControlHeaders(600), reportRoutes); // Cache reports for 10 minutes
  app.use("/api/v1/client", cacheControlHeaders(120), clientPortalRoutes); // Cache client portal for 2 minutes
  app.use("/api/v1/notifications", cacheControlHeaders(0), notificationRoutes); // No caching for notifications
  app.use("/api/v1/equipment", cacheControlHeaders(300), equipmentRoutes); // Cache equipment for 5 minutes
  app.use("/api/v1/rentals", cacheControlHeaders(60), rentalRoutes); // Cache rentals for 1 minute
  app.use("/api/v1/events", cacheControlHeaders(60), eventRoutes); // Cache events for 1 minute
  app.use("/api/v1/quotations", cacheControlHeaders(0), quotationRoutes); // No caching for quotations
  app.use("/api/v1/activities", cacheControlHeaders(0), activityRoutes); // No caching for activity logs

  // Health check endpoints
  app.get("/api/v1/health", async (req, res) => {
    try {
      const healthCheck = await performHealthCheck();

      if (healthCheck.status === "ok") {
        res.json({
          status: "OK",
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          checks: healthCheck.checks,
        });
      } else {
        res.status(healthCheck.status === "warning" ? 200 : 500).json({
          status: healthCheck.status.toUpperCase(),
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          checks: healthCheck.checks,
        });
      }
    } catch (error) {
      res.status(500).json({
        status: "ERROR",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        error: error.message,
      });
    }
  });

  // System monitoring endpoint (protected)
  app.get("/api/v1/system", async (req, res) => {
    // This should be protected in production
    if (
      process.env.NODE_ENV === "production" &&
      (!req.user || req.user.role !== "super_admin")
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const systemInfo = getSystemInfo();
      const dbStatus = await getDatabaseStatus();

      res.json({
        system: systemInfo,
        database: dbStatus,
        process: {
          pid: process.pid,
          version: process.version,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // CORS security monitoring endpoint (protected)
  app.get("/api/v1/security/cors", (req, res) => {
    // This should be protected in production
    if (
      process.env.NODE_ENV === "production" &&
      (!req.user || req.user.role !== "super_admin")
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const corsStats = getCorsSecurityStats();
      const middlewareStats = corsSecurityMiddleware.getStats();
      const currentTime = new Date().toISOString();

      res.json({
        timestamp: currentTime,
        environment: process.env.NODE_ENV || "development",
        allowedOrigins: allowedOrigins,
        security: {
          ...corsStats,
          middleware: middlewareStats,
          monitoring: "active",
          secureValidatorEnabled: process.env.NODE_ENV === "production",
          threatDetectionEnabled: middlewareStats.threatDetectionEnabled,
        },
      });
    } catch (error) {
      appLogger.error("Error retrieving CORS security stats:", error);
      res
        .status(500)
        .json({ error: "Failed to retrieve CORS security statistics" });
    }
  });

  // Error handling middleware
  app.use(errorHandler);

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  // Notification routes already added above

  // Start server
  if (process.env.NODE_ENV !== "test") {
    server.listen(PORT, () => {
      appLogger.info(`Server running on port ${PORT}`);
      appLogger.info(`Environment: ${process.env.NODE_ENV}`);
      appLogger.info(`Worker process ${process.pid} started`);

      // Start scheduler service for notifications
      // Only start scheduler on one instance when using clustering
      if (!isMaster && (!cluster.worker || cluster.worker.id === 1)) {
        schedulerService.start();
        appLogger.info("Scheduler service started");
      }

      // Signal ready to PM2
      if (process.send) {
        process.send("ready");
      }
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      appLogger.info("Received shutdown signal, closing server...");
      server.close(() => {
        appLogger.info("Server closed");
        mongoose.connection.close(false, () => {
          appLogger.info("Database connection closed");
          process.exit(0);
        });
      });

      // Force close if graceful shutdown fails
      setTimeout(() => {
        appLogger.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  }

  // Export for testing purposes (only available in worker process)
  module.exports = { app, server };
}
