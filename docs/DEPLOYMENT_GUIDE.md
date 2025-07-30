# D4 Media Task Management System - Deployment Guide

## Overview

This guide covers the deployment of the D4 Media Task Management System, with special focus on CORS configuration for cross-origin communication between the frontend (Netlify) and backend (DigitalOcean).

## Environment Configuration

### Required Environment Variables

The following environment variables are **required** for proper deployment:

#### Core Application Variables

```bash
# Database
MONGODB_URI=your-production-mongodb-uri
DB_NAME=d4tasks

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=production
```

#### CORS Configuration (Critical for Deployment)

```bash
# Primary frontend URL - REQUIRED for CORS
CLIENT_URL=https://d4media-erp.netlify.app

# Comma-separated list of allowed origins - Takes precedence over CLIENT_URL
ALLOWED_ORIGINS=https://d4media-erp.netlify.app

# For multiple domains (if needed):
# ALLOWED_ORIGINS=https://d4media-erp.netlify.app,https://custom-domain.com,https://staging.d4media.com
```

#### Frontend API Configuration

```bash
# API URL for frontend to connect to backend
VITE_API_URL=https://your-backend-domain.com/api/v1
```

#### Optional Variables

```bash
# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

# WhatsApp Integration (Optional)
WHATSAPP_ACCOUNT_ID=your-whatsapp-account-id
WHATSAPP_SECRET_KEY=your-whatsapp-secret-key
```

## Deployment Configurations

### Production Environment (.env.production)

```bash
# Production Environment Configuration

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/d4tasks?retryWrites=true&w=majority
DB_NAME=d4tasks

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-make-it-different
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=production

# CORS Configuration - CRITICAL FOR DEPLOYMENT
CLIENT_URL=https://d4media-erp.netlify.app
ALLOWED_ORIGINS=https://d4media-erp.netlify.app

# Frontend API URL
VITE_API_URL=https://your-backend-domain.com/api/v1

# Security
ENCRYPTION_KEY=your-32-character-encryption-key-here

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### Staging Environment (.env.staging)

```bash
# Staging Environment Configuration

# Database
MONGODB_URI=mongodb+srv://username:password@staging-cluster.mongodb.net/d4tasks-staging?retryWrites=true&w=majority
DB_NAME=d4tasks-staging

# JWT
JWT_SECRET=staging-jwt-secret-different-from-production
JWT_REFRESH_SECRET=staging-refresh-secret-different-from-production
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=staging

# CORS Configuration
CLIENT_URL=https://staging-d4media-erp.netlify.app
ALLOWED_ORIGINS=https://staging-d4media-erp.netlify.app

# Frontend API URL
VITE_API_URL=https://staging-api.your-domain.com/api/v1

# Security
ENCRYPTION_KEY=staging-32-character-encryption-key-here

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### Development Environment (.env.development)

```bash
# Development Environment Configuration

# Database
MONGODB_URI=mongodb://localhost:27017/d4tasks-dev
# OR use cloud database for development
# MONGODB_URI=mongodb+srv://username:password@dev-cluster.mongodb.net/d4tasks-dev?retryWrites=true&w=majority
DB_NAME=d4tasks-dev

# JWT
JWT_SECRET=dev-jwt-secret-not-for-production
JWT_REFRESH_SECRET=dev-refresh-secret-not-for-production
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# CORS Configuration - Multiple development ports
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173

# Frontend API URL
VITE_API_URL=http://localhost:5000/api/v1

# Security
ENCRYPTION_KEY=dev-32-character-encryption-key-here

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

## Platform-Specific Deployment

### Frontend Deployment (Netlify)

#### Build Settings

```bash
# Build command
npm run build

# Publish directory
client/dist

# Environment variables to set in Netlify dashboard:
VITE_API_URL=https://your-backend-domain.com/api/v1
```

#### Netlify Configuration (netlify.toml)

```toml
[build]
  command = "npm run build"
  publish = "client/dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Backend Deployment (DigitalOcean App Platform)

#### App Spec Configuration

```yaml
name: d4media-backend
services:
  - name: api
    source_dir: /
    github:
      repo: your-username/d4-media-task-management
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "5000"
      - key: MONGODB_URI
        value: your-mongodb-connection-string
        type: SECRET
      - key: JWT_SECRET
        value: your-jwt-secret
        type: SECRET
      - key: JWT_REFRESH_SECRET
        value: your-refresh-secret
        type: SECRET
      - key: CLIENT_URL
        value: https://d4media-erp.netlify.app
      - key: ALLOWED_ORIGINS
        value: https://d4media-erp.netlify.app
      - key: ENCRYPTION_KEY
        value: your-encryption-key
        type: SECRET
    http_port: 5000
    routes:
      - path: /
```

#### Manual Environment Variable Setup

In DigitalOcean App Platform dashboard:

1. Go to your app settings
2. Navigate to "Environment Variables"
3. Add the following variables:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=[your-mongodb-uri] (encrypted)
JWT_SECRET=[your-jwt-secret] (encrypted)
JWT_REFRESH_SECRET=[your-refresh-secret] (encrypted)
CLIENT_URL=https://d4media-erp.netlify.app
ALLOWED_ORIGINS=https://d4media-erp.netlify.app
ENCRYPTION_KEY=[your-encryption-key] (encrypted)
```

## CORS Configuration Details

### Why CORS Configuration is Critical

The frontend (Netlify) and backend (DigitalOcean) are on different domains, requiring proper CORS configuration to allow cross-origin requests. Without correct CORS setup:

- User signup/login will fail
- API requests will be blocked by browsers
- WebSocket connections for real-time features won't work

### CORS Environment Variables Explained

#### `CLIENT_URL`

- **Purpose**: Primary frontend URL used as fallback
- **Production**: `https://d4media-erp.netlify.app`
- **Development**: `http://localhost:3000`

#### `ALLOWED_ORIGINS`

- **Purpose**: Comma-separated list of allowed origins
- **Takes precedence** over `CLIENT_URL` if provided
- **Production**: `https://d4media-erp.netlify.app`
- **Development**: `http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173`

### Multiple Domain Support

For multiple frontend deployments:

```bash
# Multiple production domains
ALLOWED_ORIGINS=https://d4media-erp.netlify.app,https://app.d4media.com,https://client.d4media.com

# Staging and production
ALLOWED_ORIGINS=https://d4media-erp.netlify.app,https://staging-d4media.netlify.app
```

## Deployment Checklist

### Pre-Deployment

- [ ] Set all required environment variables
- [ ] Verify CORS configuration with correct frontend URL
- [ ] Test database connection
- [ ] Verify JWT secrets are secure and different from development
- [ ] Check file upload paths and permissions
- [ ] Validate email configuration (if using notifications)

### Frontend Deployment (Netlify)

- [ ] Set `VITE_API_URL` to backend domain
- [ ] Configure build settings
- [ ] Set up custom domain (if applicable)
- [ ] Test build process locally
- [ ] Verify redirects for SPA routing

### Backend Deployment (DigitalOcean)

- [ ] Set all environment variables in platform
- [ ] Configure `CLIENT_URL` and `ALLOWED_ORIGINS` correctly
- [ ] Set up database connection
- [ ] Configure file upload directory
- [ ] Set up logging and monitoring
- [ ] Configure health checks

### Post-Deployment Testing

- [ ] Test user registration from frontend
- [ ] Verify login functionality
- [ ] Test API requests in browser network tab
- [ ] Check for CORS errors in browser console
- [ ] Test real-time notifications (WebSocket)
- [ ] Verify file upload functionality
- [ ] Test PDF generation and download

## Troubleshooting

### Common CORS Issues

#### 1. "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Solution**:

- Verify `ALLOWED_ORIGINS` includes the frontend domain
- Check that environment variables are set correctly
- Restart the backend server after changes

#### 2. "Request header field content-type is not allowed by Access-Control-Allow-Headers"

**Solution**:

- CORS configuration includes all necessary headers
- This should be handled automatically by the system

#### 3. WebSocket connection failed

**Solution**:

- Verify Socket.IO CORS configuration matches Express CORS
- Check that real-time notifications are working
- Test WebSocket connection in browser developer tools

### Environment Variable Issues

#### 1. Variables not loading

**Solution**:

- Verify `.env` file is in correct location
- Check file permissions
- Restart server after changes
- Use `console.log(process.env.VARIABLE_NAME)` to debug

#### 2. CORS still not working after setting variables

**Solution**:

- Clear browser cache and cookies
- Test in incognito/private browsing mode
- Check server logs for CORS-related messages
- Verify environment variables are actually loaded

### Testing CORS Configuration

#### Manual Testing Script

```bash
# Test CORS configuration
cd server
node test-cors-config.js
```

#### Browser Testing

1. Open browser developer tools
2. Go to Network tab
3. Attempt to sign up or log in
4. Check for:
   - Successful OPTIONS preflight requests
   - Proper CORS headers in responses
   - No CORS errors in console

#### cURL Testing

```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://d4media-erp.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://your-backend-domain.com/api/v1/auth/signup

# Test actual request
curl -X POST \
  -H "Origin: https://d4media-erp.netlify.app" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  https://your-backend-domain.com/api/v1/auth/signup
```

## Security Considerations

### Production Security

- Never use wildcards (`*`) for origins in production
- Always specify exact domain names
- Use HTTPS for all production domains
- Keep JWT secrets secure and rotate regularly
- Monitor logs for unauthorized access attempts

### Environment Separation

- Use different databases for different environments
- Never mix development and production environment variables
- Use different JWT secrets for each environment
- Validate configuration before deployment

## Monitoring and Maintenance

### Log Monitoring

Monitor server logs for:

- CORS-related errors
- Unauthorized access attempts
- Failed authentication requests
- Database connection issues

### Regular Maintenance

- Review and update allowed origins list
- Rotate JWT secrets periodically
- Monitor database performance
- Update dependencies regularly
- Review security logs

## Support

For deployment issues:

1. Check this documentation first
2. Review server logs for specific errors
3. Test CORS configuration using provided scripts
4. Verify all environment variables are set correctly
5. Contact the development team with specific error messages and logs

## Additional Resources

- [CORS Configuration Documentation](./server/docs/CORS_CONFIGURATION.md)
- [API Documentation](./docs/API.md)
- [Development Setup Guide](./docs/DEVELOPMENT.md)
