# Environment Variables Reference

## Quick Reference

This document provides a quick reference for all environment variables used in the D4 Media Task Management System.

## Required Variables

### Core Application

| Variable      | Description               | Example                                | Required |
| ------------- | ------------------------- | -------------------------------------- | -------- |
| `NODE_ENV`    | Application environment   | `production`, `development`, `staging` | ✅       |
| `PORT`        | Server port               | `5000`                                 | ✅       |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...`                    | ✅       |
| `DB_NAME`     | Database name             | `d4tasks`                              | ✅       |

### Authentication

| Variable             | Description              | Example                     | Required |
| -------------------- | ------------------------ | --------------------------- | -------- |
| `JWT_SECRET`         | JWT signing secret       | `your-super-secret-jwt-key` | ✅       |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | `your-refresh-secret`       | ✅       |
| `JWT_EXPIRE`         | JWT token expiration     | `24h`                       | ✅       |
| `JWT_REFRESH_EXPIRE` | Refresh token expiration | `7d`                        | ✅       |

### CORS Configuration (Critical for Deployment)

| Variable          | Description                     | Example                                                  | Required |
| ----------------- | ------------------------------- | -------------------------------------------------------- | -------- |
| `CLIENT_URL`      | Primary frontend URL            | `https://d4media-erp.netlify.app`                        | ✅       |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | `https://d4media-erp.netlify.app,https://app.domain.com` | ⚠️       |
| `VITE_API_URL`    | Frontend API URL                | `https://api.domain.com/api/v1`                          | ✅       |

> **Note**: `ALLOWED_ORIGINS` takes precedence over `CLIENT_URL` if provided.

## Optional Variables

### Email Configuration

| Variable     | Description                 | Example                | Required |
| ------------ | --------------------------- | ---------------------- | -------- |
| `EMAIL_HOST` | SMTP host                   | `smtp.gmail.com`       | ❌       |
| `EMAIL_PORT` | SMTP port                   | `587`                  | ❌       |
| `EMAIL_USER` | Email username              | `your-email@gmail.com` | ❌       |
| `EMAIL_PASS` | Email password/app password | `your-app-password`    | ❌       |

### File Upload

| Variable        | Description                | Example           | Required |
| --------------- | -------------------------- | ----------------- | -------- |
| `MAX_FILE_SIZE` | Maximum file size in bytes | `10485760` (10MB) | ❌       |
| `UPLOAD_PATH`   | File upload directory      | `./uploads`       | ❌       |

### Security

| Variable         | Description         | Example            | Required |
| ---------------- | ------------------- | ------------------ | -------- |
| `ENCRYPTION_KEY` | Data encryption key | `32-character-key` | ❌       |

### Pagination

| Variable            | Description             | Example | Required |
| ------------------- | ----------------------- | ------- | -------- |
| `DEFAULT_PAGE_SIZE` | Default pagination size | `20`    | ❌       |
| `MAX_PAGE_SIZE`     | Maximum pagination size | `100`   | ❌       |

### WhatsApp Integration

| Variable              | Description             | Example           | Required |
| --------------------- | ----------------------- | ----------------- | -------- |
| `WHATSAPP_ACCOUNT_ID` | WhatsApp API account ID | `your-account-id` | ❌       |
| `WHATSAPP_SECRET_KEY` | WhatsApp API secret key | `your-secret-key` | ❌       |

## Environment-Specific Examples

### Production (.env.production)

```bash
# Core
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/d4tasks
DB_NAME=d4tasks

# Authentication
JWT_SECRET=production-super-secret-jwt-key-make-it-long
JWT_REFRESH_SECRET=production-refresh-secret-different-from-jwt
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# CORS - CRITICAL FOR DEPLOYMENT
CLIENT_URL=https://d4media-erp.netlify.app
ALLOWED_ORIGINS=https://d4media-erp.netlify.app
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

### Development (.env.development)

```bash
# Core
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/d4tasks-dev
DB_NAME=d4tasks-dev

# Authentication
JWT_SECRET=dev-jwt-secret-not-for-production
JWT_REFRESH_SECRET=dev-refresh-secret-not-for-production
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# CORS - Multiple development ports
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
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

### Staging (.env.staging)

```bash
# Core
NODE_ENV=staging
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@staging-cluster.mongodb.net/d4tasks-staging
DB_NAME=d4tasks-staging

# Authentication
JWT_SECRET=staging-jwt-secret-different-from-production
JWT_REFRESH_SECRET=staging-refresh-secret-different-from-production
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# CORS
CLIENT_URL=https://staging-d4media-erp.netlify.app
ALLOWED_ORIGINS=https://staging-d4media-erp.netlify.app
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

## CORS Configuration Details

### Why CORS Variables are Critical

The frontend (Netlify) and backend (DigitalOcean) run on different domains, requiring proper CORS configuration:

- **Without CORS**: Browser blocks all API requests
- **With CORS**: Secure cross-origin communication enabled

### CORS Variable Priority

1. **`ALLOWED_ORIGINS`** (highest priority) - Comma-separated list
2. **`CLIENT_URL`** (fallback) - Single domain
3. **Environment defaults** (last resort) - Based on `NODE_ENV`

### Multiple Domain Configuration

```bash
# Single domain
ALLOWED_ORIGINS=https://d4media-erp.netlify.app

# Multiple domains
ALLOWED_ORIGINS=https://d4media-erp.netlify.app,https://app.d4media.com,https://client.d4media.com

# Development with multiple ports
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
```

## Validation and Testing

### Environment Variable Validation

```bash
# Check if variables are loaded
node -e "console.log('CLIENT_URL:', process.env.CLIENT_URL)"
node -e "console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS)"
node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
```

### CORS Testing

```bash
# Test CORS configuration
cd server
node test-cors-config.js
```

### Common Issues

1. **Variables not loading**

   - Check `.env` file location and permissions
   - Restart server after changes
   - Verify file encoding (UTF-8)

2. **CORS still failing**

   - Clear browser cache
   - Test in incognito mode
   - Check server logs for CORS errors

3. **JWT errors**
   - Ensure secrets are long and secure
   - Use different secrets for different environments
   - Check token expiration settings

## Security Best Practices

### Production Security

- Use long, random secrets (minimum 32 characters)
- Never commit secrets to version control
- Use different secrets for each environment
- Rotate secrets regularly

### CORS Security

- Never use wildcards (`*`) in production
- Specify exact domain names only
- Use HTTPS for all production domains
- Monitor logs for unauthorized access attempts

### Environment Separation

- Use separate databases for each environment
- Never mix production and development variables
- Validate configuration before deployment
- Use encrypted variables for sensitive data

## Platform-Specific Configuration

### Netlify (Frontend)

Set in Netlify dashboard under "Environment variables":

```
VITE_API_URL=https://your-backend-domain.com/api/v1
```

### DigitalOcean App Platform (Backend)

Set in app settings under "Environment Variables":

```
NODE_ENV=production
CLIENT_URL=https://d4media-erp.netlify.app
ALLOWED_ORIGINS=https://d4media-erp.netlify.app
MONGODB_URI=[encrypted]
JWT_SECRET=[encrypted]
JWT_REFRESH_SECRET=[encrypted]
```

### Heroku (Alternative Backend)

```bash
heroku config:set NODE_ENV=production
heroku config:set CLIENT_URL=https://d4media-erp.netlify.app
heroku config:set ALLOWED_ORIGINS=https://d4media-erp.netlify.app
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
```

## Troubleshooting

### Quick Diagnostics

1. **Check environment loading**:

   ```bash
   node -e "console.log(process.env)" | grep -E "(CLIENT_URL|ALLOWED_ORIGINS|NODE_ENV)"
   ```

2. **Test CORS configuration**:

   ```bash
   curl -X OPTIONS -H "Origin: https://d4media-erp.netlify.app" https://your-api-domain.com/api/v1/auth/signup
   ```

3. **Verify database connection**:
   ```bash
   node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('DB Connected')).catch(console.error)"
   ```

### Common Error Messages

| Error                  | Likely Cause                  | Solution                     |
| ---------------------- | ----------------------------- | ---------------------------- |
| "CORS policy" error    | Missing/incorrect CORS config | Check `ALLOWED_ORIGINS`      |
| "JWT malformed"        | Missing/incorrect JWT secret  | Check `JWT_SECRET`           |
| "MongooseError"        | Database connection issue     | Check `MONGODB_URI`          |
| "Cannot read property" | Missing environment variable  | Check all required variables |

## Additional Resources

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [CORS Configuration](../server/docs/CORS_CONFIGURATION.md) - Detailed CORS documentation
- [Development Setup](./DEVELOPMENT.md) - Local development setup
