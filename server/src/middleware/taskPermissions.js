/**
 * Task-specific permission middleware
 */
const { hasPermission } = require('../utils/permissions');
const { logSecurityEvent, SECURITY_EVENTS } = require('../utils/logger');

// Task permission middleware functions
const taskPermissions = {
  // Check if user can read tasks
  canRead: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user has permission to read tasks
    if (hasPermission(req.user.role, 'tasks', 'read') || 
        (req.user.role === 'client' && hasPermission(req.user.role, 'tasks', 'readOwn'))) {
      return next();
    }

    // Log permission denied event
    logSecurityEvent(
      SECURITY_EVENTS.PERMISSION_DENIED,
      {
        userId: req.user._id,
        role: req.user.role,
        resource: 'tasks',
        action: 'read',
        path: req.originalUrl,
        method: req.method
      },
      'warn'
    );

    return res.status(403).json({
      success: false,
      error: 'Permission denied: Cannot read tasks'
    });
  },

  // Check if user can create tasks
  canCreate: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (hasPermission(req.user.role, 'tasks', 'create')) {
      return next();
    }

    // Log permission denied event
    logSecurityEvent(
      SECURITY_EVENTS.PERMISSION_DENIED,
      {
        userId: req.user._id,
        role: req.user.role,
        resource: 'tasks',
        action: 'create',
        path: req.originalUrl,
        method: req.method
      },
      'warn'
    );

    return res.status(403).json({
      success: false,
      error: 'Permission denied: Cannot create tasks'
    });
  },

  // Check if user can update tasks
  canUpdate: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (hasPermission(req.user.role, 'tasks', 'update')) {
      return next();
    }

    // Log permission denied event
    logSecurityEvent(
      SECURITY_EVENTS.PERMISSION_DENIED,
      {
        userId: req.user._id,
        role: req.user.role,
        resource: 'tasks',
        action: 'update',
        path: req.originalUrl,
        method: req.method
      },
      'warn'
    );

    return res.status(403).json({
      success: false,
      error: 'Permission denied: Cannot update tasks'
    });
  },

  // Check if user can delete tasks
  canDelete: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (hasPermission(req.user.role, 'tasks', 'delete')) {
      return next();
    }

    // Log permission denied event
    logSecurityEvent(
      SECURITY_EVENTS.PERMISSION_DENIED,
      {
        userId: req.user._id,
        role: req.user.role,
        resource: 'tasks',
        action: 'delete',
        path: req.originalUrl,
        method: req.method
      },
      'warn'
    );

    return res.status(403).json({
      success: false,
      error: 'Permission denied: Cannot delete tasks'
    });
  },

  // Check if user can assign tasks
  canAssign: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (hasPermission(req.user.role, 'tasks', 'update')) {
      return next();
    }

    // Log permission denied event
    logSecurityEvent(
      SECURITY_EVENTS.PERMISSION_DENIED,
      {
        userId: req.user._id,
        role: req.user.role,
        resource: 'tasks',
        action: 'assign',
        path: req.originalUrl,
        method: req.method
      },
      'warn'
    );

    return res.status(403).json({
      success: false,
      error: 'Permission denied: Cannot assign tasks'
    });
  },

  // Check if user can update tasks they're assigned to
  canUpdateAssigned: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Department staff can update tasks assigned to them
    if (req.user.role === 'department_staff' && hasPermission(req.user.role, 'tasks', 'updateProgress')) {
      // The resource ownership check should be done before this middleware
      return next();
    }

    // Other roles with general update permission
    if (hasPermission(req.user.role, 'tasks', 'update')) {
      return next();
    }

    // Log permission denied event
    logSecurityEvent(
      SECURITY_EVENTS.PERMISSION_DENIED,
      {
        userId: req.user._id,
        role: req.user.role,
        resource: 'tasks',
        action: 'updateProgress',
        path: req.originalUrl,
        method: req.method
      },
      'warn'
    );

    return res.status(403).json({
      success: false,
      error: 'Permission denied: Cannot update task progress'
    });
  }
};

// Composite permissions for complex operations
const compositePermissions = {
  // Example: Check if user can both read and update tasks
  canReadAndUpdate: [
    taskPermissions.canRead,
    taskPermissions.canUpdate
  ]
};

module.exports = {
  taskPermissions,
  compositePermissions
};