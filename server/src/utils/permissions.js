/**
 * Permissions utility for role-based access control
 */

// Define role hierarchy (higher roles include permissions of lower roles)
const ROLE_HIERARCHY = {
  super_admin: ['department_admin', 'department_staff', 'reception', 'client'],
  department_admin: ['department_staff'],
  reception: ['client'],
  department_staff: [],
  client: []
};

// Define permission sets by resource and action
const PERMISSIONS = {
  // User permissions
  users: {
    create: ['super_admin'],
    read: ['super_admin', 'department_admin', 'reception'],
    update: ['super_admin', 'department_admin'],
    delete: ['super_admin'],
    readOwn: ['department_staff', 'client'], // Users can read their own profile
    updateOwn: ['department_staff', 'client'], // Users can update their own profile
    readDepartment: ['department_admin'] // Department admins can read users in their department
  },
  
  // Department permissions
  departments: {
    create: ['super_admin'],
    read: ['super_admin', 'department_admin', 'reception'],
    update: ['super_admin'],
    delete: ['super_admin'],
    updateOwn: ['department_admin'] // Department admins can update their own department
  },
  
  // Task permissions
  tasks: {
    create: ['super_admin', 'department_admin', 'reception'],
    read: ['super_admin', 'department_admin', 'department_staff', 'reception'],
    update: ['super_admin', 'department_admin', 'department_staff', 'reception'],
    delete: ['super_admin', 'department_admin'],
    readOwn: ['client'], // Clients can read their own tasks
    updateProgress: ['department_staff'] // Staff can update task progress
  },
  
  // Studio booking permissions
  studioBookings: {
    create: ['super_admin', 'reception'],
    read: ['super_admin', 'reception'],
    update: ['super_admin', 'reception'],
    delete: ['super_admin', 'reception'],
    readOwn: ['client'] // Clients can read their own bookings
  },
  
  // Invoice permissions
  invoices: {
    create: ['super_admin', 'reception'],
    read: ['super_admin', 'reception'],
    update: ['super_admin', 'reception'],
    delete: ['super_admin'],
    readOwn: ['client'] // Clients can read their own invoices
  },
  
  // Report permissions
  reports: {
    create: ['super_admin', 'department_admin', 'reception'],
    read: ['super_admin', 'department_admin', 'reception'],
    export: ['super_admin', 'department_admin', 'reception']
  },
  
  // Security permissions
  security: {
    viewLogs: ['super_admin'],
    manageBackups: ['super_admin'],
    restoreBackups: ['super_admin']
  }
};

/**
 * Check if a user has permission for an action
 * @param {string} userRole - User's role
 * @param {string} resource - Resource being accessed
 * @param {string} action - Action being performed
 * @returns {boolean} - Whether user has permission
 */
const hasPermission = (userRole, resource, action) => {
  if (!userRole || !resource || !action) return false;
  
  // Get all roles that can perform this action on this resource
  const allowedRoles = PERMISSIONS[resource]?.[action] || [];
  
  // Check if user's role is directly allowed
  if (allowedRoles.includes(userRole)) return true;
  
  // Check if user's role inherits permissions from roles that are allowed
  const inheritedRoles = ROLE_HIERARCHY[userRole] || [];
  return inheritedRoles.some(role => allowedRoles.includes(role));
};

/**
 * Check if a user has ownership of a resource
 * @param {Object} user - User object
 * @param {Object} resource - Resource object
 * @param {string} resourceType - Type of resource
 * @returns {boolean} - Whether user has ownership
 */
const hasOwnership = (user, resource, resourceType) => {
  if (!user || !resource) return false;
  
  switch (resourceType) {
    case 'user':
      return user._id.toString() === resource._id.toString();
      
    case 'department':
      return user.department && 
             resource._id && 
             user.department.toString() === resource._id.toString();
      
    case 'task':
      // Check if user is the client for this task
      if (user.role === 'client' && resource.client) {
        return user._id.toString() === resource.client.toString();
      }
      // Check if user is assigned to this task
      if (user.role === 'department_staff' && resource.assignedTo) {
        return user._id.toString() === resource.assignedTo.toString();
      }
      // Check if user is department admin for this task's department
      if (user.role === 'department_admin' && resource.department && user.department) {
        return user.department.toString() === resource.department.toString();
      }
      return false;
      
    case 'studioBooking':
      // Check if user is the client for this booking
      if (user.role === 'client' && resource.client) {
        return user._id.toString() === resource.client.toString();
      }
      return false;
      
    case 'invoice':
      // Check if user is the client for this invoice
      if (user.role === 'client' && resource.client) {
        return user._id.toString() === resource.client.toString();
      }
      return false;
      
    default:
      return false;
  }
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {Object} - Object with all permissions for the role
 */
const getRolePermissions = (role) => {
  if (!role) return {};
  
  const permissions = {};
  
  // Get all inherited roles
  const allRoles = [role, ...(ROLE_HIERARCHY[role] || [])];
  
  // Iterate through all resources and actions
  Object.keys(PERMISSIONS).forEach(resource => {
    permissions[resource] = {};
    
    Object.keys(PERMISSIONS[resource]).forEach(action => {
      const allowedRoles = PERMISSIONS[resource][action];
      permissions[resource][action] = allRoles.some(r => allowedRoles.includes(r));
    });
  });
  
  return permissions;
};

module.exports = {
  hasPermission,
  hasOwnership,
  getRolePermissions,
  PERMISSIONS,
  ROLE_HIERARCHY
};