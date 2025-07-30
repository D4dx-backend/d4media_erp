const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

// Validate task ID parameter
const validateTaskId = [
  param('taskId')
    .isMongoId()
    .withMessage('Invalid task ID format')
];

// Validate department ID parameter
const validateDepartmentId = [
  param('departmentId')
    .isMongoId()
    .withMessage('Invalid department ID format')
];

// Validate attachment ID parameter
const validateAttachmentId = [
  param('taskId')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  param('attachmentId')
    .custom(value => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage('Invalid attachment ID format')
];

// Validate client feedback
const validateClientFeedback = [
  param('taskId')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  body('feedback')
    .notEmpty()
    .withMessage('Feedback content is required')
    .isString()
    .withMessage('Feedback must be a string')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Feedback must be between 1 and 1000 characters'),
  body('approved')
    .optional()
    .isBoolean()
    .withMessage('Approved must be a boolean value')
];

// Validate project filters
const validateProjectFilters = [
  query('status')
    .optional()
    .isIn(['pending', 'in_progress', 'review', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),
  query('department')
    .optional()
    .isMongoId()
    .withMessage('Invalid department ID format'),
  query('sortBy')
    .optional()
    .isIn(['dueDate', 'createdAt', 'title', 'priority', 'status'])
    .withMessage('Invalid sortBy value'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Invalid sortOrder value')
];

module.exports = {
  validateTaskId,
  validateDepartmentId,
  validateAttachmentId,
  validateClientFeedback,
  validateProjectFilters
};