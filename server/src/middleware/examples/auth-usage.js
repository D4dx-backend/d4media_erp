/**
 * Examples of how to use the authorization middleware in routes
 * This file demonstrates the proper usage patterns for the auth middleware
 */

const express = require('express');
const { protect, authorize, checkDepartmentAccess, checkResourceOwnership } = require('../auth');
const { taskPermissions, userPermissions, compositePermissions } = require('../permissions');

const router = express.Router();

// Example 1: Basic role-based authorization
router.get('/admin-only', 
  protect, 
  authorize('super_admin'), 
  (req, res) => {
    res.json({ message: 'Admin only content' });
  }
);

// Example 2: Multiple roles allowed
router.get('/staff-access', 
  protect, 
  authorize('super_admin', 'department_admin', 'department_staff'), 
  (req, res) => {
    res.json({ message: 'Staff level access' });
  }
);

// Example 3: Department-specific access
router.get('/department/:departmentId/tasks', 
  protect, 
  checkDepartmentAccess(), 
  (req, res) => {
    res.json({ message: 'Department tasks' });
  }
);

// Example 4: Resource ownership verification
router.get('/tasks/:id', 
  protect, 
  checkResourceOwnership({ resourceType: 'task' }), 
  (req, res) => {
    // req.resource will contain the task if user has access
    res.json({ task: req.resource });
  }
);

// Example 5: Permission-based access using permissions middleware
router.post('/tasks', 
  protect, 
  taskPermissions.canCreate, 
  (req, res) => {
    res.json({ message: 'Task created' });
  }
);

// Example 6: Composite permissions
router.delete('/users/:id', 
  protect, 
  compositePermissions.adminOnly, 
  (req, res) => {
    res.json({ message: 'User deleted' });
  }
);

// Example 7: Department admin or above
router.put('/department/:departmentId/settings', 
  protect, 
  checkDepartmentAccess({ requireAdmin: true }), 
  compositePermissions.departmentAdminOrAbove, 
  (req, res) => {
    res.json({ message: 'Department settings updated' });
  }
);

// Example 8: Client-specific access
router.get('/client/projects', 
  protect, 
  checkDepartmentAccess({ clientAccessOnly: true }), 
  (req, res) => {
    res.json({ message: 'Client projects' });
  }
);

// Example 9: Write operation with department check
router.post('/department/:departmentId/tasks', 
  protect, 
  checkDepartmentAccess({ requireWrite: true }), 
  taskPermissions.canCreate, 
  (req, res) => {
    res.json({ message: 'Task created in department' });
  }
);

// Example 10: Resource-specific permissions
router.patch('/tasks/:id/status', 
  protect, 
  checkResourceOwnership({ resourceType: 'task' }), 
  taskPermissions.canUpdateAssigned, 
  (req, res) => {
    res.json({ message: 'Task status updated' });
  }
);

module.exports = router;