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
  const io = socketIO(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? ["https://yourdomain.com"]
          : ["http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
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

  // CORS configuration
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? ["https://d4media-erp.netlify.app"]
          : ["http://localhost:3000", "http://localhost:5173"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
  );

  // Ensure preflight OPTIONS requests are handled
  app.options("*", cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://d4media-erp.netlify.app"]
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }));

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
