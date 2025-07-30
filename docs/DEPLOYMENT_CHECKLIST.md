# Deployment Checklist

## Pre-Deployment Checklist

Use this checklist to ensure your D4 Media Task Management System is properly configured for deployment.

### Environment Configuration

#### Required Environment Variables ✅

- [ ] **`NODE_ENV`** - Set to `production`
- [ ] **`PORT`** - Set to `5000` (or platform default)
- [ ] **`MONGODB_URI`** - Production MongoDB connection string
- [ ] **`DB_NAME`** - Database name (e.g., `d4tasks`)
- [ ] **`JWT_SECRET`** - Secure, long random string (min 32 chars)
- [ ] **`JWT_REFRESH_SECRET`** - Different from JWT_SECRET
- [ ] **`JWT_EXPIRE`** - Token expiration (e.g., `24h`)
- [ ] **`JWT_REFRESH_EXPIRE`** - Refresh token expiration (e.g., `7d`)

#### CORS Configuration (Critical) ⚠️

- [ ] **`CLIENT_URL`** - Set to actual frontend domain (e.g., `https://d4media-erp.netlify.app`)
- [ ] **`ALLOWED_ORIGINS`** - Set to actual frontend domain(s)
- [ ] **`VITE_API_URL`** - Set in frontend environment to backend API URL

#### Optional but Recommended

- [ ] **`ENCRYPTION_KEY`** - 32-character encryption key
- [ ] **`MAX_FILE_SIZE`** - File upload limit (default: 10MB)
- [ ] **`UPLOAD_PATH`** - File upload directory (default: `./uploads`)
- [ ] **`DEFAULT_PAGE_SIZE`** - Pagination default (default: 20)
- [ ] **`MAX_PAGE_SIZE`** - Pagination maximum (default: 100)

#### Email Configuration (Optional)

- [ ] **`EMAIL_HOST`** - SMTP host (e.g., `smtp.gmail.com`)
- [ ] **`EMAIL_PORT`** - SMTP port (e.g., `587`)
- [ ] **`EMAIL_USER`** - Email username
- [ ] **`EMAIL_PASS`** - Email password/app password

#### WhatsApp Integration (Optional)

- [ ] **`WHATSAPP_ACCOUNT_ID`** - WhatsApp API account ID
- [ ] **`WHATSAPP_SECRET_KEY`** - WhatsApp API secret key

### Frontend Deployment (Netlify)

#### Build Configuration

- [ ] Build command set to: `npm run build`
- [ ] Publish directory set to: `client/dist`
- [ ] Node version set to: `18` or higher

#### Environment Variables

- [ ] **`VITE_API_URL`** - Set to backend API URL (e.g., `https://your-backend.com/api/v1`)

#### Domain Configuration

- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Redirects configured for SPA routing

### Backend Deployment (DigitalOcean/Heroku/etc.)

#### Platform Configuration

- [ ] Runtime set to Node.js 18+
- [ ] Start command set to: `npm start`
- [ ] Health check endpoint configured: `/api/v1/health`

#### Environment Variables

- [ ] All required environment variables set in platform dashboard
- [ ] Sensitive variables marked as encrypted/secret
- [ ] CORS variables match frontend domain exactly

#### Database Configuration

- [ ] MongoDB connection string tested
- [ ] Database accessible from deployment platform
- [ ] Database indexes created (if needed)
- [ ] Backup strategy in place

### Security Checklist

#### JWT Configuration

- [ ] JWT secrets are long and random (minimum 32 characters)
- [ ] Different secrets used for access and refresh tokens
- [ ] Secrets are different from development environment
- [ ] Token expiration times are appropriate

#### CORS Security

- [ ] No wildcard (`*`) origins in production
- [ ] Only necessary domains included in allowed origins
- [ ] HTTPS used for all production domains
- [ ] Credentials enabled only for trusted origins

#### General Security

- [ ] All sensitive data stored as environment variables
- [ ] No secrets committed to version control
- [ ] File upload directory has proper permissions
- [ ] Rate limiting configured (if applicable)

### Testing Checklist

#### Pre-Deployment Testing

- [ ] All tests pass locally: `npm test`
- [ ] Build completes successfully: `npm run build`
- [ ] Environment variables load correctly
- [ ] Database connection works with production credentials

#### Post-Deployment Testing

- [ ] Frontend loads without errors
- [ ] User registration works from frontend
- [ ] User login works from frontend
- [ ] API requests succeed (check browser network tab)
- [ ] No CORS errors in browser console
- [ ] File upload functionality works
- [ ] Real-time notifications work (if applicable)
- [ ] PDF generation works (if applicable)

### CORS-Specific Testing

#### Browser Testing

- [ ] Open browser developer tools
- [ ] Navigate to Network tab
- [ ] Attempt user signup/login
- [ ] Verify successful OPTIONS preflight requests
- [ ] Check for proper CORS headers in responses
- [ ] Confirm no CORS errors in console

#### Manual API Testing

```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://d4media-erp.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://your-backend-domain.com/api/v1/auth/signup

# Should return 204 with CORS headers
```

#### Automated Testing

- [ ] Run CORS configuration test: `node test-cors-config.js`
- [ ] Verify all origins are properly configured
- [ ] Check Socket.IO CORS configuration

### Monitoring and Logging

#### Log Configuration

- [ ] Application logs configured
- [ ] Error logs configured
- [ ] CORS-related logs enabled
- [ ] Log rotation configured

#### Monitoring Setup

- [ ] Health check endpoint responding
- [ ] Database connection monitoring
- [ ] Error rate monitoring
- [ ] Performance monitoring (optional)

### Documentation

#### Team Documentation

- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] CORS configuration explained
- [ ] Troubleshooting guide available

#### Access Documentation

- [ ] Frontend URL documented and shared
- [ ] Backend API URL documented
- [ ] Admin credentials created and shared securely
- [ ] Database access documented (for authorized personnel)

## Common Issues and Solutions

### CORS Issues

**Issue**: "Access to fetch blocked by CORS policy"

- **Check**: `ALLOWED_ORIGINS` includes exact frontend domain
- **Check**: No typos in domain names
- **Check**: HTTPS vs HTTP protocol matches

**Issue**: "Preflight request doesn't pass"

- **Check**: OPTIONS requests are handled correctly
- **Check**: All necessary headers are allowed
- **Check**: Server is responding to preflight requests

### Environment Variable Issues

**Issue**: Variables not loading

- **Check**: Environment variables are set in deployment platform
- **Check**: Variable names match exactly (case-sensitive)
- **Check**: No extra spaces or quotes in values

**Issue**: Database connection fails

- **Check**: MongoDB URI is correct and accessible
- **Check**: Database credentials are valid
- **Check**: Network access is allowed from deployment platform

### Authentication Issues

**Issue**: JWT errors

- **Check**: JWT secrets are set and secure
- **Check**: Token expiration times are reasonable
- **Check**: Secrets are different from development

## Emergency Rollback Plan

If deployment fails:

1. **Immediate Actions**

   - [ ] Revert to previous working deployment
   - [ ] Check error logs for specific issues
   - [ ] Verify environment variables are correct

2. **Investigation**

   - [ ] Compare working vs failing configuration
   - [ ] Test CORS configuration locally
   - [ ] Verify database connectivity

3. **Fix and Redeploy**
   - [ ] Address identified issues
   - [ ] Test fixes locally first
   - [ ] Deploy with monitoring

## Post-Deployment Verification

### Functional Testing

- [ ] User can access the application
- [ ] User can register new account
- [ ] User can log in successfully
- [ ] User can navigate between pages
- [ ] API requests work correctly
- [ ] File uploads work (if applicable)
- [ ] Real-time features work (if applicable)

### Performance Testing

- [ ] Page load times are acceptable
- [ ] API response times are reasonable
- [ ] Database queries perform well
- [ ] File uploads complete successfully

### Security Testing

- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Authentication is working
- [ ] Unauthorized access is blocked

## Success Criteria

Deployment is successful when:

- [ ] All checklist items are completed
- [ ] All tests pass
- [ ] Application is accessible to users
- [ ] No CORS errors in browser console
- [ ] Core functionality works as expected
- [ ] Monitoring and logging are active

## Additional Resources

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Detailed deployment instructions
- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Complete variable reference
- [CORS Configuration](../server/docs/CORS_CONFIGURATION.md) - CORS technical details
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions
