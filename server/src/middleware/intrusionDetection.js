/**
 * Intrusion Detection System middleware
 * Monitors for suspicious activities and potential security threats
 */
const { logSecurityEvent, SECURITY_EVENTS } = require('../utils/logger');
const { getClientIp, isBot } = require('../utils/network');

// Track login attempts by IP
const loginAttempts = new Map();
// Track API requests by IP
const requestCounts = new Map();
// Track suspicious patterns
const suspiciousPatterns = new Map();

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const REQUEST_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 100;
const SUSPICIOUS_THRESHOLD = 3;

/**
 * Clear expired tracking data
 */
const clearExpiredData = () => {
  const now = Date.now();
  
  // Clear expired login attempts
  for (const [ip, data] of loginAttempts.entries()) {
    if (now - data.timestamp > LOGIN_WINDOW_MS) {
      loginAttempts.delete(ip);
    }
  }
  
  // Clear expired request counts
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.timestamp > REQUEST_WINDOW_MS) {
      requestCounts.delete(ip);
    }
  }
  
  // Clear expired suspicious patterns
  for (const [ip, data] of suspiciousPatterns.entries()) {
    if (now - data.timestamp > LOGIN_WINDOW_MS) {
      suspiciousPatterns.delete(ip);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(clearExpiredData, 5 * 60 * 1000);

/**
 * Check for SQL injection attempts in request parameters
 */
const checkForSqlInjection = (req) => {
  const sqlPatterns = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 
    'UNION', 'OR 1=1', 'OR \'1\'=\'1', '--', ';--',
    'EXEC', 'DECLARE', 'WAITFOR', 'SHUTDOWN'
  ];
  
  // Function to check a value for SQL injection patterns
  const checkValue = (value) => {
    if (typeof value !== 'string') return false;
    
    const upperValue = value.toUpperCase();
    return sqlPatterns.some(pattern => 
      upperValue.includes(pattern.toUpperCase())
    );
  };
  
  // Check query parameters
  for (const key in req.query) {
    if (checkValue(req.query[key])) return true;
  }
  
  // Check body parameters (if it's an object)
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string' && checkValue(req.body[key])) {
        return true;
      }
    }
  }
  
  // Check URL path parameters
  if (req.params) {
    for (const key in req.params) {
      if (checkValue(req.params[key])) return true;
    }
  }
  
  return false;
};

/**
 * Check for XSS attempts in request parameters
 */
const checkForXss = (req) => {
  const xssPatterns = [
    '<script', 'javascript:', 'onerror=', 'onload=',
    'eval(', 'document.cookie', 'alert(', 'String.fromCharCode(',
    'expression(', 'fromCharCode', 'document.write', 'document.location'
  ];
  
  // Function to check a value for XSS patterns
  const checkValue = (value) => {
    if (typeof value !== 'string') return false;
    
    const lowerValue = value.toLowerCase();
    return xssPatterns.some(pattern => 
      lowerValue.includes(pattern.toLowerCase())
    );
  };
  
  // Check query parameters
  for (const key in req.query) {
    if (checkValue(req.query[key])) return true;
  }
  
  // Check body parameters (if it's an object)
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string' && checkValue(req.body[key])) {
        return true;
      }
    }
  }
  
  // Check URL path parameters
  if (req.params) {
    for (const key in req.params) {
      if (checkValue(req.params[key])) return true;
    }
  }
  
  return false;
};

/**
 * Intrusion detection middleware
 */
const intrusionDetection = (req, res, next) => {
  const ip = getClientIp(req);
  const path = req.originalUrl;
  const method = req.method;
  const userAgent = req.headers['user-agent'] || '';
  const now = Date.now();
  
  // Skip monitoring for known bots
  if (isBot(userAgent)) {
    return next();
  }
  
  // Track login attempts
  if (path.includes('/auth/login') && method === 'POST') {
    if (!loginAttempts.has(ip)) {
      loginAttempts.set(ip, {
        count: 1,
        timestamp: now,
        emails: new Set(req.body && req.body.email ? [req.body.email] : ['unknown'])
      });
    } else {
      const data = loginAttempts.get(ip);
      data.count += 1;
      data.timestamp = now;
      if (req.body && req.body.email) {
        data.emails.add(req.body.email);
      }
      
      // Check for brute force attempts
      if (data.count >= MAX_LOGIN_ATTEMPTS) {
        logSecurityEvent(
          SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
          {
            type: 'BRUTE_FORCE_ATTEMPT',
            ip,
            attempts: data.count,
            emails: Array.from(data.emails)
          },
          'warn'
        );
        
        // Add to suspicious patterns
        if (!suspiciousPatterns.has(ip)) {
          suspiciousPatterns.set(ip, {
            count: 1,
            timestamp: now,
            types: ['BRUTE_FORCE_ATTEMPT']
          });
        } else {
          const suspicious = suspiciousPatterns.get(ip);
          suspicious.count += 1;
          suspicious.timestamp = now;
          if (!suspicious.types.includes('BRUTE_FORCE_ATTEMPT')) {
            suspicious.types.push('BRUTE_FORCE_ATTEMPT');
          }
        }
      }
    }
  }
  
  // Track request rate
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, {
      count: 1,
      timestamp: now
    });
  } else {
    const data = requestCounts.get(ip);
    data.count += 1;
    
    // Check for rate limiting
    if (data.count > MAX_REQUESTS_PER_MINUTE) {
      logSecurityEvent(
        SECURITY_EVENTS.RATE_LIMIT_EXCEEDED,
        {
          ip,
          requestCount: data.count,
          timeWindow: 'minute'
        },
        'warn'
      );
      
      // Add to suspicious patterns
      if (!suspiciousPatterns.has(ip)) {
        suspiciousPatterns.set(ip, {
          count: 1,
          timestamp: now,
          types: ['RATE_LIMIT_EXCEEDED']
        });
      } else {
        const suspicious = suspiciousPatterns.get(ip);
        suspicious.count += 1;
        suspicious.timestamp = now;
        if (!suspicious.types.includes('RATE_LIMIT_EXCEEDED')) {
          suspicious.types.push('RATE_LIMIT_EXCEEDED');
        }
      }
    }
  }
  
  // Check for SQL injection attempts
  if (checkForSqlInjection(req)) {
    logSecurityEvent(
      SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
      {
        type: 'SQL_INJECTION_ATTEMPT',
        ip,
        path,
        method,
        query: req.query,
        body: method === 'GET' ? undefined : req.body
      },
      'warn'
    );
    
    // Add to suspicious patterns
    if (!suspiciousPatterns.has(ip)) {
      suspiciousPatterns.set(ip, {
        count: 1,
        timestamp: now,
        types: ['SQL_INJECTION_ATTEMPT']
      });
    } else {
      const suspicious = suspiciousPatterns.get(ip);
      suspicious.count += 1;
      suspicious.timestamp = now;
      if (!suspicious.types.includes('SQL_INJECTION_ATTEMPT')) {
        suspicious.types.push('SQL_INJECTION_ATTEMPT');
      }
    }
  }
  
  // Check for XSS attempts
  if (checkForXss(req)) {
    logSecurityEvent(
      SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
      {
        type: 'XSS_ATTEMPT',
        ip,
        path,
        method,
        query: req.query,
        body: method === 'GET' ? undefined : req.body
      },
      'warn'
    );
    
    // Add to suspicious patterns
    if (!suspiciousPatterns.has(ip)) {
      suspiciousPatterns.set(ip, {
        count: 1,
        timestamp: now,
        types: ['XSS_ATTEMPT']
      });
    } else {
      const suspicious = suspiciousPatterns.get(ip);
      suspicious.count += 1;
      suspicious.timestamp = now;
      if (!suspicious.types.includes('XSS_ATTEMPT')) {
        suspicious.types.push('XSS_ATTEMPT');
      }
    }
  }
  
  // Check for multiple suspicious activities
  if (suspiciousPatterns.has(ip)) {
    const suspicious = suspiciousPatterns.get(ip);
    if (suspicious.count >= SUSPICIOUS_THRESHOLD) {
      logSecurityEvent(
        SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
        {
          type: 'MULTIPLE_SUSPICIOUS_ACTIVITIES',
          ip,
          count: suspicious.count,
          types: suspicious.types
        },
        'error'
      );
      
      // Here you could implement additional actions like:
      // 1. Temporary IP ban
      // 2. Send alerts to administrators
      // 3. Require additional verification
    }
  }
  
  next();
};

module.exports = intrusionDetection;