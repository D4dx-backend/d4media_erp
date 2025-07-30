const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');
const StudioBooking = require('../models/StudioBooking');
const Department = require('../models/Department');
const {
  hasPermission,
  canPerformAction,
  checkResourceOwnership: checkOwnership,
  canAccessDepartment,
  getUserPermissions,
  getDepartmentPermissions,
  PERMISSIONS
} = require('../utils/permissions');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.userId).populate('department');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token is not valid - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token is not valid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server error during authentication'
    });
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Please authenticate first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Enhanced department access control
const checkDepartmentAccess = (options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Access denied. Please authenticate first.'
        });
      }

      // Super admin can access all departments
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Reception can access all departments with read permissions
      if (req.user.role === 'reception') {
        // Check if write operation is attempted
        if (options.requireWrite && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          // Reception can only write to certain resources (bookings, basic task creation)
          const allowedWritePaths = ['/bookings', '/tasks'];
          const isAllowedWrite = allowedWritePaths.some(path => req.path.includes(path));
          
          if (!isAllowedWrite) {
            return res.status(403).json({
              success: false,
              error: 'Access denied. Reception staff has limited write permissions.'
            });
          }
        }
        return next();
      }

      // Get department ID from various sources
      let departmentId = req.params.departmentId || 
                        req.body.department || 
                        req.query.department;
      
      // Try to get department from resource if available
      if (!departmentId && req.params.id && options.resourceType) {
        try {
          departmentId = await getDepartmentFromResource(req.params.id, options.resourceType);
        } catch (error) {
          // Ignore errors when getting department from resource
          departmentId = null;
        }
      }

      // Department admin and staff can only access their own department
      if (['department_admin', 'department_staff'].includes(req.user.role)) {
        if (!req.user.department) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. User not assigned to any department.'
          });
        }

        if (departmentId && req.user.department._id.toString() !== departmentId.toString()) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. You can only access your own department.'
          });
        }

        // For department staff, check if they have permission for write operations
        if (req.user.role === 'department_staff' && options.requireAdmin && 
            ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. Administrative permissions required.'
          });
        }
      }

      // Clients can only access their own projects
      if (req.user.role === 'client') {
        if (options.clientAccessOnly) {
          return next();
        }
        return res.status(403).json({
          success: false,
          error: 'Access denied. Clients have limited access.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Server error during department access check'
      });
    }
  };
};

// Enhanced resource ownership verification
const checkResourceOwnership = (options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Access denied. Please authenticate first.'
        });
      }

      // Super admin can access all resources
      if (req.user.role === 'super_admin') {
        return next();
      }

      const resourceId = req.params.id || req.params.taskId || req.params.bookingId;
      const resourceType = options.resourceType || 'task';

      if (!resourceId) {
        return next(); // No specific resource to check
      }

      let resource;
      let hasAccess = false;

      switch (resourceType) {
        case 'task':
          resource = await Task.findById(resourceId).populate('department assignedTo createdBy client');
          if (resource) {
            hasAccess = await checkTaskAccess(req.user, resource, options);
          }
          break;

        case 'booking':
          resource = await StudioBooking.findById(resourceId).populate('client createdBy');
          if (resource) {
            hasAccess = await checkBookingAccess(req.user, resource, options);
          }
          break;

        case 'user':
          resource = await User.findById(resourceId).populate('department');
          if (resource) {
            hasAccess = await checkUserAccess(req.user, resource, options);
          }
          break;

        case 'department':
          resource = await Department.findById(resourceId);
          if (resource) {
            hasAccess = await checkDepartmentResourceAccess(req.user, resource, options);
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid resource type specified'
          });
      }

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`
        });
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You do not have permission to access this resource.'
        });
      }

      // Add resource to request for use in controllers
      req.resource = resource;
      next();

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Server error during resource ownership check'
      });
    }
  };
};

// Helper function to get resource access using permissions utility
const canAccessResource = async (user, resourceType, resourceId, action = 'read') => {
  try {
    // Super admin can access everything
    if (user.role === 'super_admin') return true;
    
    let resource;
    switch (resourceType) {
      case 'task':
        resource = await Task.findById(resourceId).populate('department assignedTo createdBy client');
        break;
      
      case 'booking':
        resource = await StudioBooking.findById(resourceId).populate('client createdBy');
        break;
      
      case 'user':
        resource = await User.findById(resourceId).populate('department');
        break;
      
      case 'department':
        resource = await Department.findById(resourceId);
        break;
      
      default:
        return false;
    }
    
    if (!resource) return false;
    
    return checkOwnership(user, resource, resourceType);
  } catch (error) {
    return false;
  }
};

// Helper functions for access control using permissions utility
const checkTaskAccess = async (user, task, options = {}) => {
  if (!task) return false;
  
  // Use permissions utility for ownership check
  return checkOwnership(user, task, 'task');
};

const checkBookingAccess = async (user, booking, options = {}) => {
  if (!booking) return false;
  
  // Use permissions utility for ownership check
  return checkOwnership(user, booking, 'booking');
};

const checkUserAccess = async (user, targetUser, options = {}) => {
  if (!targetUser) return false;
  
  // Use permissions utility for ownership check
  return checkOwnership(user, targetUser, 'user');
};

const checkDepartmentResourceAccess = async (user, department, options = {}) => {
  if (!department) return false;
  
  // Use permissions utility for ownership check
  return checkOwnership(user, department, 'department');
};

const getDepartmentFromResource = async (resourceId, resourceType) => {
  try {
    let resource;
    switch (resourceType) {
      case 'task':
        resource = await Task.findById(resourceId).select('department');
        return resource ? resource.department : null;
      
      case 'booking':
        // Bookings don't have departments, return null
        return null;
      
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
};

// Legacy function names for backward compatibility
const checkDepartment = checkDepartmentAccess();

module.exports = {
  protect,
  authorize,
  checkDepartment, // Legacy
  checkDepartmentAccess,
  checkResourceOwnership,
  hasPermission,
  canAccessResource,
  getUserPermissions,
  getDepartmentPermissions
};