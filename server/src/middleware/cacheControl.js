/**
 * Cache Control Middleware
 * Implements API response caching for improved performance
 */

const NodeCache = require('node-cache');
const { appLogger } = require('../utils/logger');

// Create cache instance with default TTL of 5 minutes and check period of 10 minutes
const apiCache = new NodeCache({ 
  stdTTL: 300, 
  checkperiod: 600,
  useClones: false // For better performance with large objects
});

/**
 * Cache middleware factory
 * @param {number} duration - Cache duration in seconds
 * @param {function} keyGenerator - Optional function to generate custom cache key
 * @returns {function} Express middleware
 */
const cache = (duration = 300, keyGenerator = null) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip caching for authenticated routes that return user-specific data
    if (req.user && !req.originalUrl.includes('/public/')) {
      return next();
    }
    
    // Generate cache key
    const key = keyGenerator ? 
      keyGenerator(req) : 
      `${req.originalUrl || req.url}`;
    
    // Try to get cached response
    const cachedResponse = apiCache.get(key);
    
    if (cachedResponse) {
      // Return cached response
      appLogger.debug(`Cache hit for ${key}`);
      return res.status(200).send(cachedResponse);
    }
    
    // Store original send function
    const originalSend = res.send;
    
    // Override send function to cache response
    res.send = function(body) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        apiCache.set(key, body, duration);
        appLogger.debug(`Cached ${key} for ${duration} seconds`);
      }
      
      // Call original send function
      originalSend.call(this, body);
    };
    
    next();
  };
};

/**
 * Clear cache for specific pattern
 * @param {string} pattern - Pattern to match cache keys
 */
const clearCache = (pattern) => {
  const keys = apiCache.keys();
  const matchedKeys = keys.filter(key => key.includes(pattern));
  
  if (matchedKeys.length > 0) {
    apiCache.del(matchedKeys);
    appLogger.info(`Cleared ${matchedKeys.length} cache entries matching pattern: ${pattern}`);
  }
};

/**
 * Clear all cache
 */
const clearAllCache = () => {
  apiCache.flushAll();
  appLogger.info('Cleared all cache');
};

/**
 * Get cache statistics
 * @returns {object} Cache statistics
 */
const getCacheStats = () => {
  return {
    keys: apiCache.keys().length,
    hits: apiCache.getStats().hits,
    misses: apiCache.getStats().misses,
    ksize: apiCache.getStats().ksize,
    vsize: apiCache.getStats().vsize
  };
};

// Cache control headers middleware
const cacheControlHeaders = (maxAge = 0) => {
  return (req, res, next) => {
    // Set cache control headers
    if (maxAge > 0) {
      res.set('Cache-Control', `public, max-age=${maxAge}`);
    } else {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
    next();
  };
};

module.exports = {
  cache,
  clearCache,
  clearAllCache,
  getCacheStats,
  cacheControlHeaders
};