const { body, query, param } = require('express-validator');

const createDepartmentValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Department name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Department name must be between 2 and 100 characters'),
    
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Department code is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('Department code must be between 2 and 10 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Department code must contain only uppercase letters, numbers, and underscores'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
    
  body('admin')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid admin user ID'),

  body('settings.defaultTaskPriority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Default task priority must be low, medium, or high'),

  body('settings.autoAssignment')
    .optional()
    .isBoolean()
    .withMessage('Auto assignment must be a boolean value'),

  body('settings.requireApproval')
    .optional()
    .isBoolean()
    .withMessage('Require approval must be a boolean value'),

  body('taskTypes')
    .optional()
    .isArray()
    .withMessage('Task types must be an array'),

  body('taskTypes.*.name')
    .if(body('taskTypes').exists())
    .trim()
    .notEmpty()
    .withMessage('Task type name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Task type name must be between 1 and 100 characters'),

  body('taskTypes.*.estimatedHours')
    .if(body('taskTypes').exists())
    .optional()
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage('Estimated hours must be between 0.1 and 1000'),

  body('taskTypes.*.billingRate')
    .if(body('taskTypes').exists())
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Billing rate must be a positive number')
];

const updateDepartmentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid department ID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Department name must be between 2 and 100 characters'),
    
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department code cannot be empty')
    .isLength({ min: 2, max: 10 })
    .withMessage('Department code must be between 2 and 10 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Department code must contain only uppercase letters, numbers, and underscores'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
    
  body('admin')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid admin user ID'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  body('settings.defaultTaskPriority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Default task priority must be low, medium, or high'),

  body('settings.autoAssignment')
    .optional()
    .isBoolean()
    .withMessage('Auto assignment must be a boolean value'),

  body('settings.requireApproval')
    .optional()
    .isBoolean()
    .withMessage('Require approval must be a boolean value'),

  body('taskTypes')
    .optional()
    .isArray()
    .withMessage('Task types must be an array'),

  body('taskTypes.*.name')
    .if(body('taskTypes').exists())
    .trim()
    .notEmpty()
    .withMessage('Task type name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Task type name must be between 1 and 100 characters'),

  body('taskTypes.*.estimatedHours')
    .if(body('taskTypes').exists())
    .optional()
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage('Estimated hours must be between 0.1 and 1000'),

  body('taskTypes.*.billingRate')
    .if(body('taskTypes').exists())
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Billing rate must be a positive number')
];

const getDepartmentsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive filter must be a boolean'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  query('sortBy')
    .optional()
    .isIn(['name', 'code', 'createdAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const departmentIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid department ID')
];

const toggleDepartmentStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid department ID'),

  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

const updateTaskTypesValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid department ID'),

  body('taskTypes')
    .isArray()
    .withMessage('Task types must be an array'),

  body('taskTypes.*.name')
    .trim()
    .notEmpty()
    .withMessage('Task type name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Task type name must be between 1 and 100 characters'),

  body('taskTypes.*.estimatedHours')
    .optional()
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage('Estimated hours must be between 0.1 and 1000'),

  body('taskTypes.*.billingRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Billing rate must be a positive number')
];

module.exports = {
  createDepartmentValidation,
  updateDepartmentValidation,
  getDepartmentsValidation,
  departmentIdValidation,
  toggleDepartmentStatusValidation,
  updateTaskTypesValidation
};