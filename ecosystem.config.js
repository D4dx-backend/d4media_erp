/**
 * PM2 Configuration File
 * This file configures PM2 for production deployment with clustering
 */

module.exports = {
  apps: [
    {
      name: 'd4-media-api',
      script: './server/server.js',
      instances: 'max', // Use maximum number of CPU cores
      exec_mode: 'cluster', // Run in cluster mode for load balancing
      watch: false, // Don't watch for file changes in production
      max_memory_restart: '1G', // Restart if memory usage exceeds 1GB
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      // Log configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000, // Wait 5 seconds before forcing shutdown
      wait_ready: true, // Wait for app to send 'ready' signal
      listen_timeout: 10000, // Wait 10 seconds for app to start
      // Metrics
      metrics: {
        http: true // Enable HTTP metrics
      },
      // Health check endpoint
      health_check: {
        url: 'http://localhost:5000/api/v1/health',
        interval: 30000 // Check every 30 seconds
      }
    },
    {
      name: 'd4-media-client',
      script: 'npx',
      args: 'serve -s client/dist -l 3000',
      instances: 1, // Single instance for static file serving
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      // Log configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/client-error.log',
      out_file: './logs/client-out.log',
      merge_logs: true
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'node',
      host: ['your-production-server'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/d4-media-task-management.git',
      path: '/var/www/d4-media',
      'post-deploy': 'npm install && cd client && npm install && npm run build && cd .. && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    },
    staging: {
      user: 'node',
      host: ['your-staging-server'],
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/d4-media-task-management.git',
      path: '/var/www/d4-media-staging',
      'post-deploy': 'npm install && cd client && npm install && npm run build && cd .. && pm2 reload ecosystem.config.js --env development',
      env: {
        NODE_ENV: 'development'
      }
    }
  }
};