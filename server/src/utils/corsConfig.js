const { appLogger } = require("./logger");

// Security monitoring for CORS-related events
const corsSecurityEvents = {
  blockedOrigins: new Map(),
  allowedRequests: 0,
  blockedRequests: 0,
  suspiciousPatterns: new Set(),
};

/**
 * Reset CORS security statistics (useful for monitoring)
 */
const resetCorsSecurityStats = () => {
  corsSecurityEvents.blockedOrigins.clear();
  corsSecurityEvents.allowedRequests = 0;
  corsSecurityEvents.blockedRequests = 0;
  corsSecurityEvents.suspiciousPatterns.clear();
};

/**
 * Get CORS security statistics
 * @returns {Object} Security statistics
 */
const getCorsSecurityStats = () => {
  return {
    blockedOrigins: Array.from(corsSecurityEvents.blockedOrigins.entries()).map(
      ([origin, count]) => ({
        origin,
        count,
      })
    ),
    allowedRequests: corsSecurityEvents.allowedRequests,
    blockedRequests: corsSecurityEvents.blockedRequests,
    suspiciousPatterns: Array.from(corsSecurityEvents.suspiciousPatterns),
    totalRequests:
      corsSecurityEvents.allowedRequests + corsSecurityEvents.blockedRequests,
  };
};

/**
 * Detect suspicious origin patterns
 * @param {string} origin - The origin to analyze
 * @returns {boolean} True if origin appears suspicious
 */
const detectSuspiciousOrigin = (origin) => {
  if (!origin) return false;

  const suspiciousPatterns = [
    /localhost:\d{5,}/, // High port numbers (potential tunneling)
    /\d+\.\d+\.\d+\.\d+/, // Direct IP addresses
    /[a-z0-9]{15,}\.ngrok\.io/, // Ngrok tunnels with long subdomains
    /[a-z0-9]{15,}\.herokuapp\.com/, // Suspicious Heroku apps
    /\.tk$|\.ml$|\.ga$|\.cf$/, // Free TLD domains often used maliciously
    /[a-z0-9]{20,}\.(com|net|org)/, // Domains with very long random names
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(origin));
};

/**
 * Log security event for CORS
 * @param {string} event - Event type
 * @param {string} origin - Origin involved
 * @param {Object} details - Additional details
 */
const logCorsSecurityEvent = (event, origin, details = {}) => {
  const logData = {
    event,
    origin,
    timestamp: new Date().toISOString(),
    ...details,
  };

  switch (event) {
    case "ORIGIN_BLOCKED":
      corsSecurityEvents.blockedRequests++;
      const currentCount = corsSecurityEvents.blockedOrigins.get(origin) || 0;
      corsSecurityEvents.blockedOrigins.set(origin, currentCount + 1);

      if (detectSuspiciousOrigin(origin)) {
        corsSecurityEvents.suspiciousPatterns.add(origin);
        appLogger.warn("CORS Security: Suspicious origin blocked", logData);
      } else {
        appLogger.warn("CORS Security: Origin blocked", logData);
      }
      break;

    case "ORIGIN_ALLOWED":
      corsSecurityEvents.allowedRequests++;
      appLogger.info("CORS Security: Origin allowed", logData);
      break;

    case "PREFLIGHT_HANDLED":
      appLogger.info("CORS Security: Preflight request handled", logData);
      break;

    case "SUSPICIOUS_ACTIVITY":
      corsSecurityEvents.suspiciousPatterns.add(origin);
      appLogger.error("CORS Security: Suspicious activity detected", logData);
      break;

    default:
      appLogger.info("CORS Security: Event logged", logData);
  }
};

/**
 * Parse and validate allowed origins from environment variables
 * @returns {Array<string>} Array of allowed origins
 */
const getAllowedOrigins = () => {
  try {
    // Parse ALLOWED_ORIGINS environment variable if provided
    if (process.env.ALLOWED_ORIGINS) {
      const origins = process.env.ALLOWED_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);

      if (origins.length > 0) {
        appLogger.info(
          `Using ALLOWED_ORIGINS from environment: ${origins.join(", ")}`
        );
        return origins;
      }
    }

    // Fallback to CLIENT_URL if ALLOWED_ORIGINS is not provided
    if (process.env.CLIENT_URL) {
      appLogger.info(
        `Using CLIENT_URL as allowed origin: ${process.env.CLIENT_URL}`
      );
      return [process.env.CLIENT_URL];
    }

    // Environment-specific defaults
    if (process.env.NODE_ENV === "production") {
      const productionOrigin = "https://d4media-erp.netlify.app";
      appLogger.info(`Using production default origin: ${productionOrigin}`);
      return [productionOrigin];
    } else {
      // Development defaults
      const developmentOrigins = [
        "http://localhost:3000",
        "http://localhost:5173", // Vite default port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8080", // Alternative development port
        "http://127.0.0.1:8080",
      ];
      appLogger.info(
        `Using development default origins: ${developmentOrigins.join(", ")}`
      );
      return developmentOrigins;
    }
  } catch (error) {
    appLogger.error("Error parsing allowed origins:", error);

    // Safe fallback
    if (process.env.NODE_ENV === "production") {
      return ["https://d4media-erp.netlify.app"];
    } else {
      return ["http://localhost:3000", "http://localhost:5173"];
    }
  }
};

/**
 * Validate if an origin is allowed with enhanced security logging
 * @param {string} origin - The origin to validate
 * @param {Array<string>} allowedOrigins - Array of allowed origins
 * @param {boolean} logEvent - Whether to log the validation event
 * @returns {boolean} True if origin is allowed
 */
const isOriginAllowed = (origin, allowedOrigins, logEvent = true) => {
  // Allow requests with no origin (like mobile apps, curl, etc.)
  if (!origin) {
    if (logEvent) {
      logCorsSecurityEvent("ORIGIN_ALLOWED", "no-origin", {
        reason: "no-origin-header",
      });
    }
    return true;
  }

  // Check if origin is in the allowed list
  const isAllowed = allowedOrigins.includes(origin);

  if (logEvent) {
    if (isAllowed) {
      logCorsSecurityEvent("ORIGIN_ALLOWED", origin);
    } else {
      logCorsSecurityEvent("ORIGIN_BLOCKED", origin, {
        allowedOrigins: allowedOrigins.length,
        suspicious: detectSuspiciousOrigin(origin),
      });
    }
  }

  return isAllowed;
};

/**
 * Enhanced origin validation with security checks
 * @param {string} origin - The origin to validate
 * @param {Array<string>} allowedOrigins - Array of allowed origins
 * @returns {Object} Validation result with security information
 */
const validateOriginSecurity = (origin, allowedOrigins) => {
  const isAllowed = isOriginAllowed(origin, allowedOrigins, false);
  const isSuspicious = detectSuspiciousOrigin(origin);

  const result = {
    origin,
    isAllowed,
    isSuspicious,
    timestamp: new Date().toISOString(),
  };

  // Log security events
  if (isAllowed) {
    logCorsSecurityEvent("ORIGIN_ALLOWED", origin, {
      suspicious: isSuspicious,
    });
  } else {
    logCorsSecurityEvent("ORIGIN_BLOCKED", origin, {
      suspicious: isSuspicious,
    });

    if (isSuspicious) {
      logCorsSecurityEvent("SUSPICIOUS_ACTIVITY", origin, {
        reason: "blocked-suspicious-origin",
        patterns: "multiple-security-patterns-matched",
      });
    }
  }

  return result;
};

/**
 * Enhanced CORS origin validation function with security monitoring
 * @param {Array<string>} allowedOrigins - Array of allowed origins
 * @returns {Function} CORS origin validation function
 */
const createOriginValidator = (allowedOrigins) => {
  return (origin, callback) => {
    const validation = validateOriginSecurity(origin, allowedOrigins);

    if (validation.isAllowed) {
      callback(null, true);
    } else {
      // Enhanced error logging with security context
      const errorMessage = `CORS blocked request from unauthorized origin: ${origin}`;
      const securityContext = {
        origin,
        suspicious: validation.isSuspicious,
        timestamp: validation.timestamp,
        allowedOriginsCount: allowedOrigins.length,
      };

      appLogger.warn(errorMessage, securityContext);

      // Create detailed error for debugging (not exposed to client)
      const corsError = new Error("Not allowed by CORS");
      corsError.securityContext = securityContext;

      callback(corsError);
    }
  };
};

/**
 * Create a secure origin validator with rate limiting for suspicious origins
 * @param {Array<string>} allowedOrigins - Array of allowed origins
 * @param {Object} options - Configuration options
 * @returns {Function} Enhanced CORS origin validation function
 */
const createSecureOriginValidator = (allowedOrigins, options = {}) => {
  const {
    maxSuspiciousAttempts = 10,
    suspiciousOriginCooldown = 300000, // 5 minutes
  } = options;

  const suspiciousOriginAttempts = new Map();
  const blockedSuspiciousOrigins = new Map();

  return (origin, callback) => {
    // Check if origin is temporarily blocked due to suspicious activity
    if (blockedSuspiciousOrigins.has(origin)) {
      const blockTime = blockedSuspiciousOrigins.get(origin);
      if (Date.now() - blockTime < suspiciousOriginCooldown) {
        logCorsSecurityEvent("SUSPICIOUS_ACTIVITY", origin, {
          reason: "temporarily-blocked",
          blockTimeRemaining:
            suspiciousOriginCooldown - (Date.now() - blockTime),
        });
        callback(
          new Error("Origin temporarily blocked due to suspicious activity")
        );
        return;
      } else {
        // Remove from blocked list after cooldown
        blockedSuspiciousOrigins.delete(origin);
        suspiciousOriginAttempts.delete(origin);
      }
    }

    const validation = validateOriginSecurity(origin, allowedOrigins);

    if (validation.isAllowed) {
      // Reset suspicious attempt counter for allowed origins
      if (suspiciousOriginAttempts.has(origin)) {
        suspiciousOriginAttempts.delete(origin);
      }
      callback(null, true);
    } else {
      // Track suspicious origins
      if (validation.isSuspicious) {
        const attempts = (suspiciousOriginAttempts.get(origin) || 0) + 1;
        suspiciousOriginAttempts.set(origin, attempts);

        if (attempts >= maxSuspiciousAttempts) {
          blockedSuspiciousOrigins.set(origin, Date.now());
          logCorsSecurityEvent("SUSPICIOUS_ACTIVITY", origin, {
            reason: "max-attempts-reached",
            attempts,
            blockedUntil: new Date(
              Date.now() + suspiciousOriginCooldown
            ).toISOString(),
          });
        }
      }

      const corsError = new Error("Not allowed by CORS");
      corsError.securityContext = {
        origin,
        suspicious: validation.isSuspicious,
        attempts: suspiciousOriginAttempts.get(origin) || 1,
        timestamp: validation.timestamp,
      };

      callback(corsError);
    }
  };
};

/**
 * Get comprehensive CORS configuration object
 * @param {Array<string>} allowedOrigins - Array of allowed origins
 * @returns {Object} CORS configuration object
 */
const getCorsConfig = (allowedOrigins) => {
  return {
    origin: createOriginValidator(allowedOrigins),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allowedHeaders: [
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
    ],
    exposedHeaders: [
      "Content-Length",
      "Content-Type",
      "Date",
      "ETag",
      "Last-Modified",
      "X-Total-Count",
      "X-Page-Count",
      "X-Rate-Limit-Remaining",
      "X-Rate-Limit-Reset",
    ],
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    preflightContinue: false,
    maxAge: 86400, // Cache preflight response for 24 hours
  };
};

/**
 * Get Socket.IO CORS configuration
 * @param {Array<string>} allowedOrigins - Array of allowed origins
 * @returns {Object} Socket.IO CORS configuration
 */
const getSocketIOCorsConfig = (allowedOrigins) => {
  return {
    origin: createOriginValidator(allowedOrigins),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
      "Pragma",
    ],
    credentials: true,
  };
};

/**
 * Log CORS configuration for debugging
 * @param {Array<string>} allowedOrigins - Array of allowed origins
 */
const logCorsConfiguration = (allowedOrigins) => {
  appLogger.info("CORS Configuration:");
  appLogger.info(`- Environment: ${process.env.NODE_ENV || "development"}`);
  appLogger.info(`- Allowed Origins: ${allowedOrigins.join(", ")}`);
  appLogger.info(`- Credentials: enabled`);
  appLogger.info(`- Preflight Cache: 24 hours`);
  appLogger.info(`- Security Monitoring: enabled`);
};

/**
 * Create CORS security monitoring middleware
 * @returns {Function} Express middleware for CORS security monitoring
 */
const createCorsSecurityMiddleware = () => {
  return (req, res, next) => {
    const origin = req.headers.origin;

    // Log preflight requests
    if (req.method === "OPTIONS") {
      logCorsSecurityEvent("PREFLIGHT_HANDLED", origin, {
        method: req.method,
        path: req.path,
        userAgent: req.headers["user-agent"],
      });
    }

    // Add security headers to response
    res.setHeader("X-CORS-Security", "monitored");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");

    next();
  };
};

/**
 * Get enhanced CORS configuration with security monitoring
 * @param {Array<string>} allowedOrigins - Array of allowed origins
 * @param {Object} securityOptions - Security configuration options
 * @returns {Object} Enhanced CORS configuration object
 */
const getSecureCorsConfig = (allowedOrigins, securityOptions = {}) => {
  const { useSecureValidator = false, enableSecurityHeaders = true } =
    securityOptions;

  const baseConfig = getCorsConfig(allowedOrigins);

  // Use secure validator if requested
  if (useSecureValidator) {
    baseConfig.origin = createSecureOriginValidator(
      allowedOrigins,
      securityOptions
    );
  }

  // Add additional security headers if enabled
  if (enableSecurityHeaders) {
    baseConfig.exposedHeaders = [
      ...baseConfig.exposedHeaders,
      "X-CORS-Security",
      "X-Security-Policy",
    ];
  }

  return baseConfig;
};

module.exports = {
  getAllowedOrigins,
  isOriginAllowed,
  validateOriginSecurity,
  createOriginValidator,
  createSecureOriginValidator,
  getCorsConfig,
  getSecureCorsConfig,
  getSocketIOCorsConfig,
  logCorsConfiguration,
  createCorsSecurityMiddleware,
  getCorsSecurityStats,
  resetCorsSecurityStats,
  detectSuspiciousOrigin,
  logCorsSecurityEvent,
};
