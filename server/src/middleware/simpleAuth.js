/**
 * Simple authentication middleware that won't cause any issues
 */

// Protect routes - simple mock authentication
const protect = (req, res, next) => {
  // Add a mock user to the request
  req.user = {
    _id: 'mock-user-id',
    name: 'Mock User',
    email: 'mock@example.com',
    role: 'super_admin'
  };
  
  next();
};

// Authorize based on roles
const authorize = (...roles) => {
  return (req, res, next) => {
    // Skip role check in development mode
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user has required role
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    next();
  };
};

module.exports = {
  protect,
  authorize
};