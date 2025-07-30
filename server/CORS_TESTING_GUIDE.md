# CORS Testing Guide

This guide provides comprehensive instructions for testing CORS configuration in both local development and production deployment environments.

## Overview

The D4 Media Task Management System implements robust CORS (Cross-Origin Resource Sharing) configuration with:

- Environment-aware origin validation
- Security monitoring and threat detection
- Preflight request handling
- Credentials support
- WebSocket CORS configuration

## Test Scripts Available

### 1. Configuration Analysis (`test-cors-config.js`)

Analyzes CORS configuration without requiring a running server.

```bash
# Test development configuration
node test-cors-config.js

# Test production configuration
NODE_ENV=production CLIENT_URL=https://d4media-erp.netlify.app node test-cors-config.js
```

### 2. Local Testing (`test-cors-local.js`)

Tests CORS configuration against a locally running server.

```bash
# Start the server first
npm run dev

# Then run CORS tests
node test-cors-local.js
```

### 3. Deployment Testing (`test-cors-deployment.js`)

Tests CORS configuration against deployed application.

```bash
# Test production deployment
PRODUCTION_SERVER=https://your-backend-domain.com node test-cors-deployment.js
```

### 4. Comprehensive Testing (`test-cors-comprehensive.js`)

Runs both local and deployment tests.

```bash
node test-cors-comprehensive.js
```

### 5. Quick Verification (`verify-cors-setup.js`)

Quick verification of CORS setup for both environments.

```bash
node verify-cors-setup.js
```

## Browser-Based Testing

Use the browser utility for frontend testing:

```javascript
// In browser console or React component
import CorsTestUtility from "./src/utils/corsTest.js";

const tester = new CorsTestUtility("http://localhost:5000");
const results = await tester.runAllTests();
console.log(results);
```

## Environment Configuration

### Development Environment

- **Allowed Origins**: `http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:3000`, `http://127.0.0.1:5173`, `http://localhost:8080`, `http://127.0.0.1:8080`
- **Environment Variable**: Not required (uses defaults)

### Production Environment

- **Allowed Origins**: `https://d4media-erp.netlify.app`
- **Environment Variable**: `CLIENT_URL=https://d4media-erp.netlify.app`

### Custom Configuration

Set multiple origins using `ALLOWED_ORIGINS`:

```bash
ALLOWED_ORIGINS="https://domain1.com,https://domain2.com,http://localhost:3000"
```

## Test Scenarios Covered

### 1. Preflight Requests (OPTIONS)

- Tests preflight handling for complex requests
- Validates CORS headers in preflight responses
- Checks Access-Control-Allow-\* headers

### 2. Actual Requests (GET, POST, etc.)

- Tests cross-origin requests from allowed origins
- Validates CORS headers in actual responses
- Tests credentials handling

### 3. Security Testing

- Tests blocking of unauthorized origins
- Validates suspicious origin detection
- Tests security monitoring functionality

### 4. WebSocket Testing

- Tests Socket.IO CORS configuration
- Validates real-time connection handling

## Expected Test Results

### Development Environment

```
✅ localhost:3000 - ALLOWED
✅ localhost:5173 - ALLOWED
❌ d4media-erp.netlify.app - BLOCKED (correct for dev)
❌ malicious-site.com - BLOCKED
```

### Production Environment

```
❌ localhost:3000 - BLOCKED (correct for prod)
✅ d4media-erp.netlify.app - ALLOWED
❌ malicious-site.com - BLOCKED
```

## Troubleshooting

### Common Issues

1. **Server Not Running**

   ```
   Error: Request failed with status code 403
   ```

   **Solution**: Start the server with `npm run dev`

2. **Wrong Environment Variables**

   ```
   CORS blocked request from unauthorized origin
   ```

   **Solution**: Check `CLIENT_URL` or `ALLOWED_ORIGINS` environment variables

3. **Preflight Failures**
   ```
   Preflight request failed
   ```
   **Solution**: Check server OPTIONS handler and CORS headers

### Debug Steps

1. Check server logs for CORS-related messages
2. Verify environment variables are set correctly
3. Test with browser developer tools Network tab
4. Use the provided test scripts to isolate issues

## Security Features

### Suspicious Origin Detection

The system automatically detects and logs suspicious origins:

- High port numbers (potential tunneling)
- Direct IP addresses
- Suspicious domain patterns
- Free TLD domains often used maliciously

### Security Monitoring

- Logs all CORS events
- Tracks blocked origins
- Monitors suspicious patterns
- Provides security statistics endpoint

### Rate Limiting

- Implements rate limiting for suspicious origins
- Temporary blocking for repeated violations
- Configurable cooldown periods

## Integration with Frontend

### React/Vite Configuration

Ensure your frontend is configured to make requests to the correct backend URL:

```javascript
// .env.development
REACT_APP_API_URL=http://localhost:5000

// .env.production
REACT_APP_API_URL=https://your-backend-domain.com
```

### Axios Configuration

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, // Important for CORS with credentials
});
```

## Monitoring and Maintenance

### Security Statistics Endpoint

Access CORS security statistics (protected endpoint):

```
GET /api/v1/security/cors
```

### Log Monitoring

Monitor server logs for CORS-related events:

- Origin allowed/blocked events
- Suspicious activity detection
- Preflight request handling

## Best Practices

1. **Environment-Specific Configuration**: Use different origins for development and production
2. **Security Monitoring**: Regularly check CORS security logs
3. **Testing**: Run CORS tests before deployment
4. **Documentation**: Keep allowed origins documented and up-to-date
5. **Monitoring**: Set up alerts for suspicious CORS activity

## Deployment Checklist

- [ ] Environment variables configured correctly
- [ ] CORS tests pass locally
- [ ] CORS tests pass against deployment
- [ ] Frontend can successfully make requests
- [ ] WebSocket connections work (if applicable)
- [ ] Security monitoring is active
- [ ] Logs are being captured and monitored
