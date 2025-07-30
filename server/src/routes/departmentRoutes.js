const express = require('express');
const router = express.Router();

// Import controller and validators
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
  getDepartmentTaskTypes,
  updateDepartmentTaskTypes
} = require('../controllers/departmentController');

const {
  createDepartmentValidation,
  updateDepartmentValidation,
  getDepartmentsValidation,
  departmentIdValidation,
  toggleDepartmentStatusValidation,
  updateTaskTypesValidation
} = require('../validators/departmentValidators');

// Import middleware
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/v1/departments
// @desc    Get all departments with filtering and pagination
// @access  Private (Super Admin, Department Admin, Reception)
router.get('/', 
  authorize('super_admin', 'department_admin', 'reception'),
  getDepartmentsValidation,
  getDepartments
);

// @route   GET /api/v1/departments/:id
// @desc    Get single department by ID
// @access  Private (Super Admin, Department Admin, Reception)
router.get('/:id',
  authorize('super_admin', 'department_admin', 'reception'),
  departmentIdValidation,
  getDepartment
);

// @route   POST /api/v1/departments
// @desc    Create new department
// @access  Private (Super Admin only)
router.post('/',
  authorize('super_admin'),
  createDepartmentValidation,
  createDepartment
);

// @route   PUT /api/v1/departments/:id
// @desc    Update department
// @access  Private (Super Admin only)
router.put('/:id',
  authorize('super_admin'),
  updateDepartmentValidation,
  updateDepartment
);

// @route   DELETE /api/v1/departments/:id
// @desc    Delete department (soft delete)
// @access  Private (Super Admin only)
router.delete('/:id',
  authorize('super_admin'),
  departmentIdValidation,
  deleteDepartment
);

// @route   PATCH /api/v1/departments/:id/status
// @desc    Toggle department status (activate/deactivate)
// @access  Private (Super Admin only)
router.patch('/:id/status',
  authorize('super_admin'),
  toggleDepartmentStatusValidation,
  toggleDepartmentStatus
);

// @route   GET /api/v1/departments/:id/task-types
// @desc    Get department task types
// @access  Private (Department Admin, Super Admin)
router.get('/:id/task-types',
  authorize('super_admin', 'department_admin'),
  departmentIdValidation,
  getDepartmentTaskTypes
);

// @route   PUT /api/v1/departments/:id/task-types
// @desc    Update department task types
// @access  Private (Department Admin, Super Admin)
router.put('/:id/task-types',
  authorize('super_admin', 'department_admin'),
  updateTaskTypesValidation,
  updateDepartmentTaskTypes
);

module.exports = router;