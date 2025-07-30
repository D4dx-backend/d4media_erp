/**
 * Studio booking permission middleware
 */
const { hasPermission } = require('../utils/permissions');
const { logSecurityEvent, SECURITY_EVENTS } = require('../utils/logger');

/**
 * Check if user has permission for studio booking operations
 * @param {string} action - The action to check permission for
 * @returns {Function} Express middleware function
 */
const checkStudioPermission = (action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Map studio actions to permission resource/action
    const permissionMap = {
      'view': { resource: 'studioBookings', action: 'read' },
      'create': { resource: 'studioBookings', action: 'create' },
      'update': { resource: 'studioBookings', action: 'update' },
      'delete': { resource: 'studioBookings', action: 'delete' }
    };

    const permission = permissionMap[action];
    if (!permission) {
      return res.status(400).json({
        success: false,
        error: `Invalid permission action: ${action}`
      });
    }

    // Check if user has direct permission
    if (hasPermission(req.user.role, permission.resource, permission.action)) {
      return next();
    }

    // Check if user has ownership-based permission (for clients)
    if (req.user.role === 'client' && action === 'view' && 
        hasPermission(req.user.role, permission.resource, 'readOwn')) {
      // For GET requests with ID parameter, we'll check ownership in the controller
      // This allows clients to list their own bookings
      return next();
    }

    // Log permission denied event
    logSecurityEvent(
      SECURITY_EVENTS.PERMISSION_DENIED,
      {
        userId: req.user._id,
        role: req.user.role,
        resource: permission.resource,
        action: permission.action,
        path: req.originalUrl,
        method: req.method
      },
      'warn'
    );

    return res.status(403).json({
      success: false,
      error: `Permission denied: Cannot ${action} studio bookings`
    });
  };
};

module.exports = {
  checkStudioPermission
};