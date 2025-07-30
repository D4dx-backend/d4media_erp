# CORS Configuration Documentation

## Overview

The D4 Media Task Management System uses environment-aware CORS (Cross-Origin Resource Sharing) configuration to ensure secure cross-origin requests between the frontend and backend while maintaining flexibility across different deployment environments.

## Environment Variables

### Primary Configuration

- **`ALLOWED_ORIGINS`**: Comma-separated list of allowed origins for CORS

  - Takes precedence over `CLIENT_URL` if provided
  - Example: `https://d4media-erp.netlify.app,https://custom-domain.com`

- **`CLIENT_URL`**: Primary frontend URL (fallback if `ALLOWED_ORIGINS` is not set)
  - Example: `https://d4media-erp.netlify.app`

### Environment-Specific Defaults

If neither `ALLOWED_ORIGINS` nor `CLIENT_URL` is provided, the system uses environment-specific defaults:

#### Production (`NODE_ENV=production`)

- Default: `https://d4media-erp.netlify.app`

#### Development (`NODE_ENV=development`)

- Defaults:
  - `http://localhost:3000`
  - `http://localhost:5173` (Vite default)
  - `http://127.0.0.1:3000`
  - `http://127.0.0.1:5173`
  - `http://localhost:8080`
  - `http://127.0.0.1:8080`

## Configuration Examples

### Production Environment

```bash
# Single domain
CLIENT_URL=https://d4media-erp.netlify.app
ALLOWED_ORIGINS=https://d4media-erp.netlify.app

# Multiple domains
ALLOWED_ORIGINS=https://d4media-erp.netlify.app,https://custom-domain.com
```

### Development Environment

```bash
# Single domain
CLIENT_URL=http://localhost:3000

# Multiple development ports
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000
```

## Features

### 1. Environment-Aware Configuration

- Automatically detects environment and applies appropriate defaults
- Supports both single and multiple origin configurations
- Provides fallback mechanisms for robust deployment

### 2. Comprehensive CORS Headers

- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- **Credentials**: Enabled for authenticated requests
- **Preflight Caching**: 24-hour cache for OPTIONS requests
- **Custom Headers**: Supports all necessary headers for API communication

### 3. Security Features

- Origin validation with exact matching (no wildcards in production)
- Request logging for monitoring unauthorized access attempts
- Graceful handling of requests without origin (mobile apps, curl)

### 4. Socket.IO Integration

- Consistent CORS configuration for WebSocket connections
- Real-time notification support across allowed origins
- Automatic fallback for different transport methods

## Implementation Details

### CORS Configuration Utility (`src/utils/corsConfig.js`)

The system uses a centralized CORS configuration utility that provides:

- `getAllowedOrigins()`: Parse and validate origins from environment
- `getCorsConfig(origins)`: Generate Express CORS configuration
- `getSocketIOCorsConfig(origins)`: Generate Socket.IO CORS configuration
- `createOriginValidator(origins)`: Create origin validation function

### Usage in Server

```javascript
const {
  getAllowedOrigins,
  getCorsConfig,
  getSocketIOCorsConfig,
} = require("./src/utils/corsConfig");

// Get environment-aware origins
const allowedOrigins = getAllowedOrigins();

// Apply to Express
app.use(cors(getCorsConfig(allowedOrigins)));

// Apply to Socket.IO
const io = socketIO(server, {
  cors: getSocketIOCorsConfig(allowedOrigins),
});
```

## Testing

### Manual Testing Script

Run the CORS configuration test:

```bash
cd server
node test-cors-config.js
```

### Automated Tests

```bash
cd server
npm test -- --testPathPattern=corsConfig.test.js
```

## Troubleshooting

### Common Issues

1. **CORS Error in Browser Console**

   - Check that frontend domain is included in `ALLOWED_ORIGINS`
   - Verify environment variables are set correctly
   - Check server logs for blocked origin messages

2. **WebSocket Connection Failed**

   - Ensure Socket.IO CORS configuration matches Express CORS
   - Verify real-time notifications are working
   - Check browser network tab for WebSocket errors

3. **Preflight Request Failed**
   - Verify OPTIONS requests are handled correctly
   - Check that all necessary headers are included
   - Ensure preflight cache settings are appropriate

### Debug Logging

The system logs CORS configuration on startup:

```
CORS Configuration:
- Environment: production
- Allowed Origins: https://d4media-erp.netlify.app
- Credentials: enabled
- Preflight Cache: 24 hours
```

### Environment Variable Validation

To verify current configuration:

```bash
# Check environment variables
echo $ALLOWED_ORIGINS
echo $CLIENT_URL
echo $NODE_ENV

# Test CORS configuration
node test-cors-config.js
```

## Security Considerations

1. **Production Security**

   - Never use wildcards (`*`) for origins in production
   - Always specify exact domain names
   - Monitor logs for unauthorized access attempts

2. **Development Flexibility**

   - Include all necessary development ports
   - Use localhost and 127.0.0.1 variants
   - Consider different development server configurations

3. **Credential Handling**
   - CORS credentials are enabled for authenticated requests
   - Ensure secure cookie settings in production
   - Validate origin before processing sensitive operations

## Migration Guide

### From Hardcoded Origins

If migrating from hardcoded CORS origins:

1. Set `ALLOWED_ORIGINS` environment variable
2. Remove hardcoded origin arrays from code
3. Test with new configuration
4. Deploy with environment-specific settings

### Adding New Domains

To add new allowed domains:

1. Update `ALLOWED_ORIGINS` environment variable
2. Add comma-separated domain to existing list
3. Restart server to apply changes
4. Test cross-origin requests from new domain

## Best Practices

1. **Environment Separation**

   - Use different origins for development, staging, and production
   - Never mix development and production origins
   - Validate configuration before deployment

2. **Monitoring**

   - Monitor server logs for CORS-related errors
   - Set up alerts for unauthorized access attempts
   - Regularly review allowed origins list

3. **Testing**

   - Test CORS configuration after any changes
   - Verify both API and WebSocket connections
   - Check preflight request handling

4. **Documentation**
   - Document all allowed origins and their purposes
   - Keep environment variable documentation updated
   - Share configuration examples with team members

## Deployment-Specific CORS Configuration

### Production Deployment Requirements

When deploying to production, CORS configuration is **critical** for the application to function:

1. **Frontend Domain**: Must match exactly (no wildcards)
2. **Protocol**: Must use HTTPS in production
3. **Environment Variables**: Must be set correctly in deployment platform

### Common Deployment Scenarios

#### Netlify + DigitalOcean

```bash
# Backend (DigitalOcean)
CLIENT_URL=https://d4media-erp.netlify.app
ALLOWED_ORIGINS=https://d4media-erp.netlify.app

# Frontend (Netlify)
VITE_API_URL=https://your-backend-domain.com/api/v1
```

#### Multiple Environments

```bash
# Production + Staging
ALLOWED_ORIGINS=https://d4media-erp.netlify.app,https://staging-d4media.netlify.app

# Custom Domains
ALLOWED_ORIGINS=https://app.d4media.com,https://staging.d4media.com
```

### Deployment Checklist

- [ ] `ALLOWED_ORIGINS` includes exact frontend domain
- [ ] No typos in domain names
- [ ] HTTPS protocol used in production
- [ ] Environment variables set in deployment platform
- [ ] CORS configuration tested after deployment

For complete deployment instructions, see [Deployment Guide](../../docs/DEPLOYMENT_GUIDE.md).

## Additional Resources

- [Deployment Guide](../../docs/DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Environment Variables](../../docs/ENVIRONMENT_VARIABLES.md) - Variable reference
- [Deployment Checklist](../../docs/DEPLOYMENT_CHECKLIST.md) - Pre-deployment verification
