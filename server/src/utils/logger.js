/**
 * Logger utility for application and security event logging
 */
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log formats
const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let metaStr = '';
  if (Object.keys(metadata).length > 0) {
    metaStr = JSON.stringify(metadata);
  }
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

// Create loggers
const appLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    logFormat
  ),
  defaultMeta: { service: 'd4-media-app' },
  transports: [
    // Console logging
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        logFormat
      )
    }),
    // Application logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Error logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Security logger with separate file
const securityLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    logFormat
  ),
  defaultMeta: { service: 'd4-media-security' },
  transports: [
    // Console logging in development
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: combine(
          colorize(),
          timestamp(),
          logFormat
        )
      })
    ] : []),
    // Security event logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'security.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10, // Keep more security logs
    })
  ]
});

/**
 * Log security events
 * @param {string} event - Security event type
 * @param {Object} data - Event data
 * @param {string} level - Log level (info, warn, error)
 */
const logSecurityEvent = (event, data = {}, level = 'info') => {
  securityLogger.log(level, event, {
    timestamp: new Date().toISOString(),
    ...data
  });
};

/**
 * Security event types
 */
const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  FILE_UPLOAD: 'FILE_UPLOAD',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  API_KEY_CREATED: 'API_KEY_CREATED',
  API_KEY_DELETED: 'API_KEY_DELETED',
  ADMIN_ACTION: 'ADMIN_ACTION',
  DATA_EXPORT: 'DATA_EXPORT',
  SETTINGS_CHANGE: 'SETTINGS_CHANGE'
};

module.exports = {
  appLogger,
  securityLogger,
  logSecurityEvent,
  SECURITY_EVENTS
};