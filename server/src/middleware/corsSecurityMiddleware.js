const { appLogger } = require("../utils/logger");
const {
  validateOriginSecurity,
  logCorsSecurityEvent,
  detectSuspiciousOrigin,
} = require("../utils/corsConfig");

/**
 * Enhanced CORS security middleware with threat detection
 */
class CorsSecurityMiddleware {
  constructor(options = {}) {
    this.options = {
      enableThreatDetection: true,
      logAllRequests: false,
      blockSuspiciousOrigins: process.env.NODE_ENV === "production",
      rateLimitWindow: 60000, // 1 minute
      maxRequestsPerWindow: 100,
      ...options,
    };

    // Rate limiting tracking
    this.requestCounts = new Map();
    this.suspiciousOrigins = new Set();

    // Clean up old entries periodically
    setInterval(() => this.cleanup(), this.options.rateLimitWindow);
  }

  /**
   * Main middleware function
   */
  middleware() {
    return (req, res, next) => {
      const origin = req.headers.origin;
      const userAgent = req.headers["user-agent"] || "";
      const method = req.method;
      const path = req.path;

      // Log request if enabled
      if (this.options.logAllRequests) {
        appLogger.info("CORS Security: Request received", {
          origin,
          method,
          path,
          userAgent: userAgent.substring(0, 100), // Truncate long user agents
          timestamp: new Date().toISOString(),
        });
      }

      // Threat detection
      if (this.options.enableThreatDetection) {
        const threatLevel = this.detectThreats(req);
        if (threatLevel > 0) {
          this.handleThreat(req, res, threatLevel);
          return; // Don't call next() for threats
        }
      }

      // Rate limiting
      if (this.isRateLimited(origin)) {
        logCorsSecurityEvent("SUSPICIOUS_ACTIVITY", origin, {
          reason: "rate-limit-exceeded",
          method,
          path,
        });

        res.status(429).json({
          error: "Too many requests",
          message: "Rate limit exceeded",
        });
        return;
      }

      // Add security headers
      this.addSecurityHeaders(res, origin);

      next();
    };
  }

  /**
   * Detect potential security threats
   * @param {Object} req - Express request object
   * @returns {number} Threat level (0 = no threat, 1 = low, 2 = medium, 3 = high)
   */
  detectThreats(req) {
    const origin = req.headers.origin;
    const userAgent = req.headers["user-agent"] || "";
    const referer = req.headers.referer || "";
    let threatLevel = 0;

    // Check for suspicious origin patterns
    if (origin && detectSuspiciousOrigin(origin)) {
      threatLevel = Math.max(threatLevel, 2);
    }

    // Check for suspicious user agents
    const suspiciousUserAgents = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http-client/i,
    ];

    if (suspiciousUserAgents.some((pattern) => pattern.test(userAgent))) {
      threatLevel = Math.max(threatLevel, 1);
    }

    // Check for missing or suspicious referer
    if (origin && referer && !referer.startsWith(origin)) {
      threatLevel = Math.max(threatLevel, 1);
    }

    // Check for known attack patterns in headers
    const attackPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /alert\(/i,
    ];

    const allHeaders = JSON.stringify(req.headers);
    if (attackPatterns.some((pattern) => pattern.test(allHeaders))) {
      threatLevel = Math.max(threatLevel, 3);
    }

    return threatLevel;
  }

  /**
   * Handle detected threats
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} threatLevel - Detected threat level
   */
  handleThreat(req, res, threatLevel) {
    const origin = req.headers.origin;
    const userAgent = req.headers["user-agent"] || "";

    logCorsSecurityEvent("SUSPICIOUS_ACTIVITY", origin, {
      reason: "threat-detected",
      threatLevel,
      method: req.method,
      path: req.path,
      userAgent: userAgent.substring(0, 100),
      headers: Object.keys(req.headers),
    });

    // Add to suspicious origins set
    if (origin) {
      this.suspiciousOrigins.add(origin);
    }

    // Response based on threat level
    switch (threatLevel) {
      case 3: // High threat
        res.status(403).json({
          error: "Forbidden",
          message: "Request blocked due to security policy",
        });
        break;
      case 2: // Medium threat
        if (this.options.blockSuspiciousOrigins) {
          res.status(403).json({
            error: "Forbidden",
            message: "Origin not allowed",
          });
        } else {
          res.status(400).json({
            error: "Bad Request",
            message: "Request appears suspicious",
          });
        }
        break;
      case 1: // Low threat
        res.status(400).json({
          error: "Bad Request",
          message: "Request validation failed",
        });
        break;
      default:
        res.status(400).json({
          error: "Bad Request",
          message: "Request blocked",
        });
    }
  }

  /**
   * Check if origin is rate limited
   * @param {string} origin - Request origin
   * @returns {boolean} True if rate limited
   */
  isRateLimited(origin) {
    if (!origin) return false;

    const key = `${origin}:${
      Date.now() - (Date.now() % this.options.rateLimitWindow)
    }`;
    const count = this.requestCounts.get(key) || 0;

    if (count >= this.options.maxRequestsPerWindow) {
      return true;
    }

    this.requestCounts.set(key, count + 1);
    return false;
  }

  /**
   * Add security headers to response
   * @param {Object} res - Express response object
   * @param {string} origin - Request origin
   */
  addSecurityHeaders(res, origin) {
    // Basic security headers
    res.setHeader("X-CORS-Security", "monitored");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // CSP header for additional protection
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "media-src 'self'",
      "frame-src 'none'",
    ].join("; ");

    res.setHeader("Content-Security-Policy", csp);

    // Add origin-specific headers if needed
    if (origin && this.suspiciousOrigins.has(origin)) {
      res.setHeader("X-Security-Warning", "origin-flagged");
    }
  }

  /**
   * Clean up old tracking data
   */
  cleanup() {
    const now = Date.now();
    const cutoff = now - this.options.rateLimitWindow;

    // Clean up old request counts
    for (const [key] of this.requestCounts) {
      const timestamp = parseInt(key.split(":")[1]);
      if (timestamp < cutoff) {
        this.requestCounts.delete(key);
      }
    }

    appLogger.debug("CORS Security: Cleaned up old tracking data");
  }

  /**
   * Get current security statistics
   * @returns {Object} Security statistics
   */
  getStats() {
    return {
      suspiciousOrigins: Array.from(this.suspiciousOrigins),
      activeRateLimits: this.requestCounts.size,
      threatDetectionEnabled: this.options.enableThreatDetection,
      blockSuspiciousOrigins: this.options.blockSuspiciousOrigins,
    };
  }

  /**
   * Reset security statistics
   */
  resetStats() {
    this.requestCounts.clear();
    this.suspiciousOrigins.clear();
    appLogger.info("CORS Security: Statistics reset");
  }
}

// Create singleton instance
const corsSecurityMiddleware = new CorsSecurityMiddleware();

module.exports = {
  CorsSecurityMiddleware,
  corsSecurityMiddleware,
  createCorsSecurityMiddleware: (options) =>
    new CorsSecurityMiddleware(options),
};
