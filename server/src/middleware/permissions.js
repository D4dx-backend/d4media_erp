/**
 * Permissions middleware for role-based access control
 */
const { hasPermission, hasOwnership, getRolePermissions } = require('../utils/permissions');
const { logSecurityEvent, SECURITY_EVENTS } = require('../utils/logger');

/**
 * Middleware to check if user has permission for a resource and action
 * @param {string} resource - Resource being accessed
 * @param {string} action - Action being performed
 * @returns {Function} Express middleware function
 */
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (hasPermission(req.user.role, resource, action)) {
      return next();
    }

    // Log permission denied event
    logSecurityEvent(
      SECURITY_EVENTS.PERMISSION_DENIED,
      {
        userId: req.user._id,
        role: req.user.role,
        resource,
        action,
        path: req.originalUrl,
        method: req.method
      },
      'warn'
    );

    return res.status(403).json({
      success: false,
      error: `Permission denied: Cannot ${action} ${resource}`
    });
  };
};

/**
 * Middleware to check if user has ownership permission for a resource
 * @param {string} resource - Resource being accessed
 * @param {string} action - Action being performed
 * @param {string} paramName - Request parameter containing resource ID
 * @param {Function} getResourceFn - Function to get resource from database
 * @returns {Function} Express middleware function
 */
const requireOwnership = (resource, action, paramName, getResourceFn) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user has direct permission regardless of ownership
    if (hasPermission(req.user.role, resource, action)) {
      return next();
    }

    // Check if user has ownership-based permission
    if (hasPermission(req.user.role, resource, `${action}Own`)) {
      try {
        // Get resource ID from request
        const resourceId = req.params[paramName] || req.body[paramName];
        if (!resourceId) {
          return res.status(400).json({
            success: false,
            error: `Resource ID not provided`
          });
        }

        // Get resource from database
        const resourceObj = await getResourceFn(resourceId);
        if (!resourceObj) {
          return res.status(404).json({
            success: false,
            error: `${resource} not found`
          });
        }

        // Check ownership
        if (hasOwnership(req.user, resourceObj, resource)) {
          // Store resource in request for later use
          req.resourceObj = resourceObj;
          return next();
        }
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: `Error checking ownership: ${error.message}`
        });
      }
    }

    // Log permission denied event
    logSecurityEvent(
      SECURITY_EVENTS.PERMISSION_DENIED,
      {
        userId: req.user._id,
        role: req.user.role,
        resource,
        action,
        path: req.originalUrl,
        method: req.method
      },
      'warn'
    );

    return res.status(403).json({
      success: false,
      error: `Permission denied: Cannot ${action} this ${resource}`
    });
  };
};

/**
 * Middleware to check if user is a super admin
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role === 'super_admin') {
    return next();
  }

  // Log permission denied event
  logSecurityEvent(
    SECURITY_EVENTS.PERMISSION_DENIED,
    {
      userId: req.user._id,
      role: req.user.role,
      requiredRole: 'super_admin',
      path: req.originalUrl,
      method: req.method
    },
    'warn'
  );

  return res.status(403).json({
    success: false,
    error: 'Super Admin access required'
  });
};

/**
 * Middleware to check if user is a department admin for a specific department
 * @param {string} paramName - Request parameter containing department ID
 */
const requireDepartmentAdmin = (paramName = 'departmentId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Super admin can access any department
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Department admin can only access their own department
    if (req.user.role === 'department_admin') {
      const departmentId = req.params[paramName] || req.body[paramName];
      
      if (!departmentId) {
        return res.status(400).json({
          success: false,
          error: 'Department ID not provided'
        });
      }

      if (req.user.department && req.user.department.toString() === departmentId.toString()) {
        return next();
      }
    }

    // Log permission denied event
    logSecurityEvent(
      SECURITY_EVENTS.PERMISSION_DENIED,
      {
        userId: req.user._id,
        role: req.user.role,
        requiredRole: 'department_admin',
        department: req.params[paramName] || req.body[paramName],
        path: req.originalUrl,
        method: req.method
      },
      'warn'
    );

    return res.status(403).json({
      success: false,
      error: 'Department Admin access required'
    });
  };
};

/**
 * Middleware to check if user is internal staff (not a client)
 */
const requireInternalUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'client') {
    return next();
  }

  // Log permission denied event
  logSecurityEvent(
    SECURITY_EVENTS.PERMISSION_DENIED,
    {
      userId: req.user._id,
      role: req.user.role,
      requiredRole: 'internal',
      path: req.originalUrl,
      method: req.method
    },
    'warn'
  );

  return res.status(403).json({
    success: false,
    error: 'Internal staff access required'
  });
};

/**
 * Get user permissions for frontend use
 */
const getUserPermissions = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const permissions = getRolePermissions(req.user.role);

  return res.status(200).json({
    success: true,
    data: permissions
  });
};

module.exports = {
  requirePermission,
  requireOwnership,
  requireSuperAdmin,
  requireDepartmentAdmin,
  requireInternalUser,
  getUserPermissions
};