const { body, query, param } = require('express-validator');

// Custom phone validator function
const phoneValidator = value => {
  // Skip validation if empty
  if (!value) return true;
  
  // Remove all non-digit characters for validation
  const digitsOnly = value.replace(/\D/g, '');
  
  // Check if it has a reasonable length for a phone number (7-15 digits)
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};

const createUserValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('role')
    .isIn(['super_admin', 'department_admin', 'department_staff', 'reception', 'client'])
    .withMessage('Invalid role specified'),
    
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .custom(phoneValidator)
    .withMessage('Please provide a valid phone number with 7-15 digits'),
    
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),
    
  body('department')
    .optional()
    .isMongoId()
    .withMessage('Invalid department ID'),

  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),

  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),

  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),

  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Zip code cannot exceed 20 characters'),

  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters')
];

const updateUserValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('role')
    .optional()
    .isIn(['super_admin', 'department_admin', 'department_staff', 'reception', 'client'])
    .withMessage('Invalid role specified'),
    
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .custom(phoneValidator)
    .withMessage('Please provide a valid phone number with 7-15 digits'),
    
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),
    
  body('department')
    .optional()
    .isMongoId()
    .withMessage('Invalid department ID'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),

  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),

  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),

  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Zip code cannot exceed 20 characters'),

  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),

  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be a boolean'),

  body('notifications.taskUpdates')
    .optional()
    .isBoolean()
    .withMessage('Task updates notification preference must be a boolean'),

  body('notifications.deadlineReminders')
    .optional()
    .isBoolean()
    .withMessage('Deadline reminders notification preference must be a boolean')
];

const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('role')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['super_admin', 'department_admin', 'department_staff', 'reception', 'client'])
    .withMessage('Invalid role filter'),

  query('department')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid department ID'),

  query('isActive')
    .optional({ nullable: true, checkFalsy: true })
    .isBoolean()
    .withMessage('isActive filter must be a boolean'),

  query('search')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  query('sortBy')
    .optional()
    .isIn(['name', 'email', 'role', 'createdAt', 'lastLogin'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const userIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID')
];

const departmentUsersValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid department ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('role')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['department_admin', 'department_staff'])
    .withMessage('Invalid role filter for department users'),

  query('isActive')
    .optional({ nullable: true, checkFalsy: true })
    .isBoolean()
    .withMessage('isActive filter must be a boolean')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .custom(phoneValidator)
    .withMessage('Please provide a valid phone number with 7-15 digits'),
    
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),

  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),

  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),

  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),

  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Zip code cannot exceed 20 characters'),

  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),

  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be a boolean'),

  body('notifications.taskUpdates')
    .optional()
    .isBoolean()
    .withMessage('Task updates notification preference must be a boolean'),

  body('notifications.deadlineReminders')
    .optional()
    .isBoolean()
    .withMessage('Deadline reminders notification preference must be a boolean')
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  getUsersValidation,
  userIdValidation,
  departmentUsersValidation,
  updateProfileValidation
};