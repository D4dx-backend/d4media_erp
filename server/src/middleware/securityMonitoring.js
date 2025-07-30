/**
 * Security monitoring middleware
 */
const { logSecurityEvent, SECURITY_EVENTS } = require('../utils/logger');
const { getClientIp } = require('../utils/network');

/**
 * Middleware to monitor and log suspicious activities
 */
const securityMonitoring = (req, res, next) => {
  // Track original URL and method for logging
  const originalUrl = req.originalUrl;
  const method = req.method;
  const ip = getClientIp(req);
  const userId = req.user ? req.user.id : 'unauthenticated';

  // Log sensitive operations
  if (
    (originalUrl.includes('/auth') && method !== 'GET') ||
    originalUrl.includes('/users') && ['POST', 'PUT', 'DELETE'].includes(method) ||
    originalUrl.includes('/settings') ||
    originalUrl.includes('/admin')
  ) {
    logSecurityEvent(
      SECURITY_EVENTS.ADMIN_ACTION,
      {
        userId,
        ip,
        method,
        path: originalUrl,
        body: req.method === 'GET' ? undefined : sanitizeRequestBody(req.body)
      }
    );
  }

  // Intercept response to log status codes
  const originalSend = res.send;
  res.send = function(data) {
    // Log failed authentication attempts
    if (
      originalUrl.includes('/auth/login') && 
      res.statusCode >= 400 && 
      res.statusCode < 500
    ) {
      logSecurityEvent(
        SECURITY_EVENTS.LOGIN_FAILURE,
        {
          ip,
          email: req.body.email,
          statusCode: res.statusCode
        },
        'warn'
      );
    }

    // Log permission denied errors
    if (res.statusCode === 403) {
      logSecurityEvent(
        SECURITY_EVENTS.PERMISSION_DENIED,
        {
          userId,
          ip,
          method,
          path: originalUrl
        },
        'warn'
      );
    }

    // Log server errors
    if (res.statusCode >= 500) {
      logSecurityEvent(
        'SERVER_ERROR',
        {
          userId,
          ip,
          method,
          path: originalUrl,
          statusCode: res.statusCode
        },
        'error'
      );
    }

    originalSend.call(this, data);
    return this;
  };

  next();
};

/**
 * Sanitize request body for logging (remove sensitive fields)
 */
const sanitizeRequestBody = (body) => {
  if (!body) return {};
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'newPassword', 'confirmPassword', 'token', 'refreshToken', 'creditCard'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

module.exports = securityMonitoring;