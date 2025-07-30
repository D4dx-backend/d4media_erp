# Design Document

## Overview

The CORS deployment issue occurs because the backend server is configured to only allow `https://yourdomain.com` in production, but the actual frontend is deployed to `https://d4media-erp.netlify.app`. The current CORS configuration in `server/server.js` uses a hardcoded placeholder domain instead of the actual Netlify deployment URL.

## Architecture

The solution involves updating the CORS configuration to:

1. Use environment variables for flexible domain configuration
2. Support multiple allowed origins for different deployment scenarios
3. Ensure proper preflight request handling
4. Maintain security by restricting access to authorized domains only

## Components and Interfaces

### 1. CORS Configuration Module

- **Location**: `server/server.js` (lines 93-99)
- **Purpose**: Configure allowed origins, methods, and credentials
- **Interface**: Express CORS middleware configuration

### 2. Environment Configuration

- **Location**: Server environment variables
- **Purpose**: Store allowed frontend domains for different environments
- **Interface**: Environment variables accessible via `process.env`

### 3. Socket.IO CORS Configuration

- **Location**: `server/src/services/notificationService.js` (lines 24-28)
- **Purpose**: Configure CORS for WebSocket connections
- **Interface**: Socket.IO server configuration

## Data Models

### Environment Variables Schema

```javascript
{
  CLIENT_URL: "https://d4media-erp.netlify.app", // Primary frontend URL
  ALLOWED_ORIGINS: "https://d4media-erp.netlify.app,http://localhost:3000", // Comma-separated list
  NODE_ENV: "production" | "development"
}
```

### CORS Configuration Schema

```javascript
{
  origin: string[] | string | function,
  credentials: boolean,
  methods: string[],
  allowedHeaders: string[],
  optionsSuccessStatus: number
}
```

## Error Handling

### CORS Error Scenarios

1. **Preflight Request Failure**: When OPTIONS request is blocked

   - **Solution**: Ensure preflight requests are handled with proper headers
   - **Status Code**: 204 (No Content) for successful preflight

2. **Origin Not Allowed**: When request comes from unauthorized domain

   - **Solution**: Add domain to allowed origins list
   - **Status Code**: CORS error in browser console

3. **Missing Credentials**: When credentials are required but not configured
   - **Solution**: Set `credentials: true` in CORS config
   - **Status Code**: 401 (Unauthorized)

### Error Logging

- Log CORS-related errors with origin information
- Monitor unauthorized access attempts
- Alert on configuration mismatches

## Testing Strategy

### Unit Tests

1. **CORS Configuration Tests**

   - Test allowed origins validation
   - Test environment-based configuration
   - Test preflight request handling

2. **Environment Variable Tests**
   - Test configuration parsing
   - Test fallback values
   - Test invalid configuration handling

### Integration Tests

1. **Cross-Origin Request Tests**

   - Test requests from allowed origins
   - Test requests from blocked origins
   - Test preflight OPTIONS requests

2. **Socket.IO CORS Tests**
   - Test WebSocket connection from frontend
   - Test real-time communication
   - Test connection rejection from unauthorized origins

### Manual Testing

1. **Deployment Verification**

   - Test signup/login from deployed frontend
   - Test API requests in browser network tab
   - Verify CORS headers in response

2. **Browser Console Verification**
   - Check for CORS errors in console
   - Verify successful API responses
   - Test different browser environments

## Implementation Approach

### Phase 1: Environment Configuration

1. Add `CLIENT_URL` and `ALLOWED_ORIGINS` environment variables
2. Update deployment configuration with correct Netlify URL
3. Create environment-aware origin parsing

### Phase 2: CORS Configuration Update

1. Update main CORS configuration in `server/server.js`
2. Update Socket.IO CORS configuration
3. Add comprehensive CORS headers

### Phase 3: Testing and Validation

1. Test locally with updated configuration
2. Deploy and test cross-origin requests
3. Verify all API endpoints work correctly

### Phase 4: Security Hardening

1. Implement origin validation function
2. Add request logging for monitoring
3. Set up alerts for unauthorized access attempts

## Security Considerations

### Origin Validation

- Use exact domain matching (no wildcards in production)
- Validate protocol (HTTPS only in production)
- Log and monitor unauthorized access attempts

### Credential Handling

- Only allow credentials for trusted origins
- Use secure cookie settings
- Implement proper session management

### Headers Configuration

- Limit allowed headers to necessary ones
- Set appropriate cache control for preflight requests
- Include security headers in responses

## Performance Considerations

### Preflight Optimization

- Cache preflight responses appropriately
- Minimize preflight request frequency
- Use efficient origin checking logic

### Origin Checking

- Use efficient string/array matching
- Avoid complex regex patterns
- Cache origin validation results if needed

## Deployment Configuration

### Environment Variables Required

```bash
# Production
CLIENT_URL=https://d4media-erp.netlify.app
ALLOWED_ORIGINS=https://d4media-erp.netlify.app
NODE_ENV=production

# Development
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
NODE_ENV=development
```

### DigitalOcean App Platform Configuration

- Set environment variables in app settings
- Ensure variables are available at runtime
- Configure health checks to verify CORS functionality
