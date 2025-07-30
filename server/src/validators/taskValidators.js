const { body, param, query, validationResult } = require('express-validator');

// Validation middleware to handle errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Task creation validation
const validateCreateTask = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Task description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),

  body('department')
    .notEmpty()
    .withMessage('Department is required')
    .isMongoId()
    .withMessage('Invalid department ID'),

  body('taskType')
    .trim()
    .notEmpty()
    .withMessage('Task type is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Task type must be between 2 and 50 characters'),

  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Invalid due date format')
    .custom((value) => {
      const dueDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        throw new Error('Due date cannot be in the past');
      }
      return true;
    }),

  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid assigned user ID'),

  body('client')
    .optional()
    .isMongoId()
    .withMessage('Invalid client ID'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),

  body('estimatedHours')
    .optional()
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage('Estimated hours must be between 0.1 and 1000'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.length > 30) {
          throw new Error('Each tag must be a string with maximum 30 characters');
        }
      }
      return true;
    }),

  body('billing.rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Billing rate must be a positive number'),

  body('billing.billable')
    .optional()
    .isBoolean()
    .withMessage('Billable must be a boolean value'),

  body('departmentSpecific')
    .optional()
    .isObject()
    .withMessage('Department specific data must be an object'),

  handleValidationErrors
];

// Task update validation
const validateUpdateTask = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),

  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid assigned user ID'),

  body('client')
    .optional()
    .isMongoId()
    .withMessage('Invalid client ID'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),

  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'review', 'completed', 'cancelled'])
    .withMessage('Status must be one of: pending, in_progress, review, completed, cancelled'),

  body('estimatedHours')
    .optional()
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage('Estimated hours must be between 0.1 and 1000'),

  body('actualHours')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Actual hours must be between 0 and 10000'),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.length > 30) {
          throw new Error('Each tag must be a string with maximum 30 characters');
        }
      }
      return true;
    }),

  body('billing.rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Billing rate must be a positive number'),

  body('billing.billable')
    .optional()
    .isBoolean()
    .withMessage('Billable must be a boolean value'),

  body('billing.invoiced')
    .optional()
    .isBoolean()
    .withMessage('Invoiced must be a boolean value'),

  body('billing.invoiceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid invoice ID'),

  body('isUrgent')
    .optional()
    .isBoolean()
    .withMessage('isUrgent must be a boolean value'),

  body('departmentSpecific')
    .optional()
    .isObject()
    .withMessage('Department specific data must be an object'),

  handleValidationErrors
];

// Task assignment validation
const validateAssignTask = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),

  body('assignedTo')
    .notEmpty()
    .withMessage('Assigned user ID is required')
    .isMongoId()
    .withMessage('Invalid assigned user ID'),

  handleValidationErrors
];

// Progress update validation
const validateUpdateProgress = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),

  body('percentage')
    .notEmpty()
    .withMessage('Progress percentage is required')
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress percentage must be between 0 and 100'),

  body('note')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Progress note must be between 1 and 500 characters'),

  handleValidationErrors
];

// Progress note validation
const validateAddProgressNote = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),

  body('note')
    .trim()
    .notEmpty()
    .withMessage('Note content is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Note must be between 1 and 500 characters'),

  handleValidationErrors
];

// Task query validation
const validateTaskQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      return ['pending', 'in_progress', 'review', 'completed', 'cancelled'].includes(value);
    })
    .withMessage('Invalid status value'),

  query('priority')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      return ['low', 'medium', 'high', 'urgent'].includes(value);
    })
    .withMessage('Invalid priority value'),

  query('department')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      return /^[0-9a-fA-F]{24}$/.test(value);
    })
    .withMessage('Invalid department ID'),

  query('assignedTo')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      if (value === 'unassigned') return true;
      return /^[0-9a-fA-F]{24}$/.test(value);
    })
    .withMessage('Invalid assigned user ID'),

  query('client')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      return /^[0-9a-fA-F]{24}$/.test(value);
    })
    .withMessage('Invalid client ID'),

  query('overdue')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      return value === 'true' || value === 'false' || value === true || value === false;
    })
    .withMessage('Overdue must be a boolean value'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('search')
    .optional()
    .trim()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      return value.length >= 1 && value.length <= 100;
    })
    .withMessage('Search term must be between 1 and 100 characters'),

  handleValidationErrors
];

// ID parameter validation
const validateTaskId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),

  handleValidationErrors
];

// Department ID parameter validation
const validateDepartmentId = [
  param('departmentId')
    .isMongoId()
    .withMessage('Invalid department ID'),

  handleValidationErrors
];

// Attachment ID parameter validation
const validateAttachmentId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),

  param('attachmentId')
    .isMongoId()
    .withMessage('Invalid attachment ID'),

  handleValidationErrors
];

// Time tracking validation
const validateStartTimeTracking = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  handleValidationErrors
];

const validateStopTimeTracking = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  handleValidationErrors
];

const validateManualTimeEntry = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Invalid start time format'),

  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid end time format')
    .custom((endTime, { req }) => {
      if (endTime && req.body.startTime) {
        const start = new Date(req.body.startTime);
        const end = new Date(endTime);
        if (end <= start) {
          throw new Error('End time must be after start time');
        }
      }
      return true;
    }),

  body('duration')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be between 1 and 1440 minutes (24 hours)'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  // Custom validation to ensure either endTime or duration is provided
  body()
    .custom((body) => {
      if (!body.endTime && !body.duration) {
        throw new Error('Either end time or duration must be provided');
      }
      return true;
    }),

  handleValidationErrors
];

const validateUpdateTimeEntry = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),

  param('entryId')
    .isMongoId()
    .withMessage('Invalid time entry ID'),

  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid start time format'),

  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid end time format'),

  body('duration')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be between 1 and 1440 minutes (24 hours)'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  handleValidationErrors
];

const validateTimeEntryId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),

  param('entryId')
    .isMongoId()
    .withMessage('Invalid time entry ID'),

  handleValidationErrors
];

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  validateAssignTask,
  validateUpdateProgress,
  validateAddProgressNote,
  validateTaskQuery,
  validateTaskId,
  validateDepartmentId,
  validateAttachmentId,
  validateStartTimeTracking,
  validateStopTimeTracking,
  validateManualTimeEntry,
  validateUpdateTimeEntry,
  validateTimeEntryId,
  handleValidationErrors
};