/**
 * Network utilities for monitoring and health checks
 */

const os = require('os');
const mongoose = require('mongoose');
const { appLogger } = require('./logger');

/**
 * Get system information for monitoring
 * @returns {object} System information
 */
const getSystemInfo = () => {
  const uptime = process.uptime();
  const { rss, heapTotal, heapUsed, external } = process.memoryUsage();
  
  return {
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptime,
      formatted: formatUptime(uptime)
    },
    memory: {
      rss: formatBytes(rss),
      heapTotal: formatBytes(heapTotal),
      heapUsed: formatBytes(heapUsed),
      external: formatBytes(external),
      usage: Math.round((heapUsed / heapTotal) * 100)
    },
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0].model,
      load: os.loadavg()
    },
    network: {
      hostname: os.hostname(),
      interfaces: getNetworkInterfaces()
    },
    os: {
      platform: os.platform(),
      release: os.release(),
      type: os.type(),
      arch: os.arch(),
      uptime: formatUptime(os.uptime())
    },
    node: {
      version: process.version,
      env: process.env.NODE_ENV
    }
  };
};

/**
 * Get database status
 * @returns {object} Database status
 */
const getDatabaseStatus = async () => {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return {
        status: 'disconnected',
        error: 'Database not connected'
      };
    }
    
    // Get database stats
    const adminDb = mongoose.connection.db.admin();
    const serverStatus = await adminDb.serverStatus();
    
    return {
      status: 'connected',
      version: serverStatus.version,
      uptime: formatUptime(serverStatus.uptime),
      connections: {
        current: serverStatus.connections.current,
        available: serverStatus.connections.available,
        totalCreated: serverStatus.connections.totalCreated
      },
      network: {
        bytesIn: formatBytes(serverStatus.network.bytesIn),
        bytesOut: formatBytes(serverStatus.network.bytesOut),
        numRequests: serverStatus.network.numRequests
      },
      host: mongoose.connection.host
    };
  } catch (error) {
    appLogger.error('Error getting database status:', error);
    return {
      status: 'error',
      error: error.message
    };
  }
};

/**
 * Perform health check
 * @returns {object} Health check result
 */
const performHealthCheck = async () => {
  const startTime = process.hrtime();
  const checks = {};
  let overallStatus = 'ok';
  
  // Check database connection
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      // Simple ping to check database responsiveness
      await mongoose.connection.db.admin().ping();
      checks.database = { status: 'ok' };
    } else {
      checks.database = { status: 'error', message: 'Database not connected' };
      overallStatus = 'error';
    }
  } catch (error) {
    checks.database = { status: 'error', message: error.message };
    overallStatus = 'error';
  }
  
  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const memoryThreshold = 1.5 * 1024 * 1024 * 1024; // 1.5GB
  
  if (memoryUsage.rss < memoryThreshold) {
    checks.memory = { status: 'ok', usage: formatBytes(memoryUsage.rss) };
  } else {
    checks.memory = { 
      status: 'warning', 
      usage: formatBytes(memoryUsage.rss),
      message: 'High memory usage'
    };
    
    if (overallStatus === 'ok') {
      overallStatus = 'warning';
    }
  }
  
  // Check disk space (simplified)
  checks.disk = { status: 'ok' };
  
  // Calculate response time
  const hrtime = process.hrtime(startTime);
  const responseTimeMs = (hrtime[0] * 1000 + hrtime[1] / 1000000).toFixed(2);
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: `${responseTimeMs}ms`,
    checks
  };
};

/**
 * Format bytes to human readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted bytes
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format uptime to human readable format
 * @param {number} uptime - Uptime in seconds
 * @returns {string} Formatted uptime
 */
const formatUptime = (uptime) => {
  const days = Math.floor(uptime / (24 * 60 * 60));
  const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);
  const seconds = Math.floor(uptime % 60);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

/**
 * Get network interfaces
 * @returns {object} Network interfaces
 */
const getNetworkInterfaces = () => {
  const interfaces = os.networkInterfaces();
  const result = {};
  
  for (const [name, netInterface] of Object.entries(interfaces)) {
    result[name] = netInterface
      .filter(iface => !iface.internal)
      .map(iface => ({
        address: iface.address,
        family: iface.family,
        mac: iface.mac
      }));
  }
  
  return result;
};

/**
 * Get client IP address from request
 * @param {object} req - Express request object
 * @returns {string} Client IP address
 */
const getClientIp = (req) => {
  return req.ip ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.headers['x-client-ip'] ||
         req.headers['cf-connecting-ip'] ||
         '127.0.0.1';
};

/**
 * Check if user agent is a bot
 * @param {string} userAgent - User agent string
 * @returns {boolean} True if bot
 */
const isBot = (userAgent) => {
  if (!userAgent) return false;
  
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
    'googlebot', 'bingbot', 'slurp', 'duckduckbot',
    'baiduspider', 'yandexbot', 'facebookexternalhit',
    'twitterbot', 'linkedinbot', 'whatsapp', 'telegram'
  ];
  
  const lowerUserAgent = userAgent.toLowerCase();
  return botPatterns.some(pattern => lowerUserAgent.includes(pattern));
};

module.exports = {
  getSystemInfo,
  getDatabaseStatus,
  performHealthCheck,
  getClientIp,
  isBot
};