# Authorization Middleware

This directory contains the comprehensive authorization system for the D4 Media Task Management System. The system provides role-based access control, department-specific restrictions, and resource ownership verification.

## Overview

The authorization system consists of three main components:

1. **Authentication Middleware** (`auth.js`) - Handles JWT token verification and basic authorization
2. **Permissions Utility** (`utils/permissions.js`) - Defines permissions and ownership logic
3. **Permission Middleware** (`permissions.js`) - Provides granular permission checking middleware

## User Roles

The system supports five user roles with different permission levels:

- **Super Admin** - Full system access
- **Department Admin** - Administrative access to their department
- **Department Staff** - Access to assigned tasks within their department
- **Reception** - Front-desk access with booking and basic task management
- **Client** - Limited access to their own projects and bookings

## Core Middleware Functions

### Authentication

```javascript
const { protect, authorize } = require('./middleware/auth');

// Verify JWT token and load user
app.use('/api', protect);

// Require specific roles
app.get('/admin', authorize('super_admin'), handler);
app.get('/staff', authorize('super_admin', 'department_admin', 'department_staff'), handler);
```

### Department Access Control

```javascript
const { checkDepartmentAccess } = require('./middleware/auth');

// Basic department access check
app.get('/department/:departmentId', protect, checkDepartmentAccess(), handler);

// Require write permissions
app.post('/department/:departmentId/tasks', protect, checkDepartmentAccess({ requireWrite: true }), handler);

// Allow client access
app.get('/client/projects', protect, checkDepartmentAccess({ clientAccessOnly: true }), handler);
```

### Resource Ownership

```javascript
const { checkResourceOwnership } = require('./middleware/auth');

// Check task ownership
app.get('/tasks/:id', protect, checkResourceOwnership({ resourceType: 'task' }), handler);

// Check booking ownership
app.get('/bookings/:id', protect, checkResourceOwnership({ resourceType: 'booking' }), handler);
```

## Permission-Based Middleware

### Task Permissions

```javascript
const { taskPermissions } = require('./middleware/permissions');

app.post('/tasks', protect, taskPermissions.canCreate, handler);
app.put('/tasks/:id', protect, taskPermissions.canUpdate, handler);
app.delete('/tasks/:id', protect, taskPermissions.canDelete, handler);
```

### User Management Permissions

```javascript
const { userPermissions } = require('./middleware/permissions');

app.post('/users', protect, userPermissions.canCreate, handler);
app.put('/users/:id', protect, userPermissions.canUpdate, handler);
app.post('/users/:id/assign', protect, userPermissions.canAssign, handler);
```

### Composite Permissions

```javascript
const { compositePermissions } = require('./middleware/permissions');

// Admin only
app.delete('/system/reset', protect, compositePermissions.adminOnly, handler);

// Department admin or above
app.put('/department/settings', protect, compositePermissions.departmentAdminOrAbove, handler);

// Staff or above (no clients)
app.get('/internal/reports', protect, compositePermissions.staffOrAbove, handler);

// Internal users only
app.get('/admin/dashboard', protect, compositePermissions.internalOnly, handler);
```

## Permission Constants

The system uses standardized permission constants defined in `utils/permissions.js`:

```javascript
const { PERMISSIONS } = require('./utils/permissions');

// Task permissions
PERMISSIONS.TASK_READ
PERMISSIONS.TASK_CREATE
PERMISSIONS.TASK_UPDATE
PERMISSIONS.TASK_DELETE
PERMISSIONS.TASK_ASSIGN

// User permissions
PERMISSIONS.USER_READ
PERMISSIONS.USER_CREATE
PERMISSIONS.USER_UPDATE
PERMISSIONS.USER_DELETE

// Department permissions
PERMISSIONS.DEPARTMENT_READ
PERMISSIONS.DEPARTMENT_CREATE
PERMISSIONS.DEPARTMENT_UPDATE
PERMISSIONS.DEPARTMENT_DELETE

// And many more...
```

## Utility Functions

### Check Permissions Programmatically

```javascript
const { hasPermission, canPerformAction } = require('./utils/permissions');

// Check if user has specific permission
if (hasPermission(user, PERMISSIONS.TASK_CREATE)) {
  // User can create tasks
}

// Check if user can perform action on resource
if (canPerformAction(user, 'update', 'task', taskResource)) {
  // User can update this specific task
}
```

### Resource Ownership Checking

```javascript
const { checkResourceOwnership } = require('./utils/permissions');

// Check if user owns or can access a resource
if (checkResourceOwnership(user, task, 'task')) {
  // User has access to this task
}
```

## Access Control Matrix

| Role | Tasks | Users | Departments | Bookings | Reports | Invoices |
|------|-------|-------|-------------|----------|---------|----------|
| Super Admin | Full | Full | Full | Full | Full | Full |
| Department Admin | Dept Only | Dept Only | Own Dept | Read | Read | Read |
| Department Staff | Assigned | Own Profile | Read | Read | - | - |
| Reception | Read/Create | Read | Read | Full | Read | Create |
| Client | Own Only | Own Profile | - | Own Only | - | - |

## Error Responses

The middleware returns standardized error responses:

```javascript
// 401 Unauthorized
{
  "success": false,
  "error": "Access denied. No token provided."
}

// 403 Forbidden
{
  "success": false,
  "error": "Access denied. Insufficient permissions."
}

// 404 Not Found
{
  "success": false,
  "error": "Resource not found"
}

// 500 Server Error
{
  "success": false,
  "error": "Server error during authorization"
}
```

## Best Practices

1. **Always use `protect` first** - Ensure user is authenticated before checking permissions
2. **Layer permissions** - Use multiple middleware functions for complex access control
3. **Check resource ownership** - Verify user can access specific resources
4. **Use appropriate error codes** - Return 401 for authentication, 403 for authorization
5. **Test thoroughly** - Verify all permission combinations work correctly

## Testing

The authorization system includes comprehensive tests in `__tests__/auth.test.js`. Run tests with:

```bash
npm test -- --testPathPattern=auth.test.js
```

## Examples

See `examples/auth-usage.js` for complete examples of how to use the authorization middleware in your routes.