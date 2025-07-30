# Server Troubleshooting Guide

## Issue: Route.get() requires a callback function but got a [object Undefined]

This error typically occurs when:
1. A controller function is undefined or not properly exported
2. There's a circular dependency between modules
3. A middleware function is not properly imported

## Solutions Applied

### 1. Recreated Invoice Routes (`src/routes/invoiceRoutes.js`)
- Added error handling for missing middleware/controllers
- Used mock functions as fallbacks
- Simplified route structure

### 2. Recreated Quotation Routes (`src/routes/quotationRoutes.js`)
- Added error handling for missing dependencies
- Used mock controllers as fallbacks
- Proper route organization

### 3. Created Minimal Server (`server-minimal.js`)
- Basic Express server without complex dependencies
- Simple test routes for invoices and quotations
- Can be used to test if basic functionality works

### 4. Created Test Files
- `test-server.js` - Tests route imports individually
- `test-invoice.js` - Tests invoice model creation
- `test-imports.js` - Tests controller function imports

## How to Test

### Option 1: Use Minimal Server
```bash
node server-minimal.js
```
This should start without errors and provide basic endpoints.

### Option 2: Test Route Imports
```bash
node test-server.js
```
This will test each route file individually to identify problematic imports.

### Option 3: Test Main Server
```bash
npm run dev
```
The main server should now start with the fixed route files.

## API Endpoints Available

### Invoice Endpoints
- `GET /api/v1/invoices` - Get all invoices
- `POST /api/v1/invoices` - Create invoice
- `GET /api/v1/invoices/:id` - Get single invoice
- `PUT /api/v1/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/:id` - Delete invoice
- `GET /api/v1/invoices/:id/pdf` - Generate PDF
- `POST /api/v1/invoices/:id/send` - Send via WhatsApp

### Quotation Endpoints
- `GET /api/v1/quotations` - Get all quotations
- `POST /api/v1/quotations` - Create quotation
- `GET /api/v1/quotations/:id` - Get single quotation
- `PUT /api/v1/quotations/:id` - Update quotation
- `DELETE /api/v1/quotations/:id` - Delete quotation
- `POST /api/v1/quotations/:id/convert-to-invoice` - Convert to invoice

### Test Endpoints
- `GET /api/v1/health` - Health check
- `GET /api/v1/test` - Basic test
- `GET /api/v1/invoices/test/ping` - Invoice routes test
- `GET /api/v1/quotations/test/ping` - Quotation routes test

## Next Steps

1. Start the server using one of the methods above
2. Test the endpoints using Postman or curl
3. Gradually add back authentication and full controller functionality
4. Test the frontend integration

## Common Issues and Solutions

### MongoDB Connection Issues
- Check MONGODB_URI in .env file
- Ensure MongoDB is running locally or connection string is correct

### Authentication Issues
- The routes now have fallback mock authentication
- Real authentication can be enabled once basic functionality works

### Controller Issues
- Controllers have mock fallbacks
- Real controllers will be used when available

### Model Issues
- Check if all required models are properly defined
- Ensure no circular dependencies between models