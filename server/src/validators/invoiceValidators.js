const Joi = require('joi');
const mongoose = require('mongoose');

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

// Create invoice validation schema
const createInvoiceSchema = Joi.object({
  client: Joi.string().custom(isValidObjectId).required()
    .messages({
      'any.required': 'Client ID is required',
      'any.invalid': 'Client ID must be a valid ID'
    }),
  type: Joi.string().valid('task_based', 'studio_booking', 'periodic').required()
    .messages({
      'any.required': 'Invoice type is required',
      'any.only': 'Invoice type must be one of: task_based, studio_booking, periodic'
    }),
  items: Joi.when('type', {
    is: 'periodic',
    then: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('task', 'booking', 'additional').required(),
        reference: Joi.when('type', {
          is: Joi.valid('task', 'booking'),
          then: Joi.string().custom(isValidObjectId).required(),
          otherwise: Joi.string().allow(null, '')
        }),
        description: Joi.string().required(),
        quantity: Joi.number().min(0).required(),
        rate: Joi.number().min(0).required(),
        amount: Joi.number().min(0).required()
      })
    ).min(1).required(),
    otherwise: Joi.array().optional()
  }),
  // For task_based and studio_booking types, we'll generate items from the references
  taskIds: Joi.when('type', {
    is: 'task_based',
    then: Joi.array().items(Joi.string().custom(isValidObjectId)).min(1).required(),
    otherwise: Joi.array().optional()
  }),
  bookingIds: Joi.when('type', {
    is: 'studio_booking',
    then: Joi.array().items(Joi.string().custom(isValidObjectId)).min(1).required(),
    otherwise: Joi.array().optional()
  }),
  discount: Joi.number().min(0).default(0),
  tax: Joi.number().min(0).default(0),
  dueDate: Joi.date().greater('now').required()
    .messages({
      'any.required': 'Due date is required',
      'date.greater': 'Due date must be in the future'
    }),
  notes: Joi.string().allow('', null)
});

// Update invoice validation schema
const updateInvoiceSchema = Joi.object({
  status: Joi.string().valid('draft', 'sent', 'paid', 'overdue', 'cancelled'),
  discount: Joi.number().min(0),
  tax: Joi.number().min(0),
  dueDate: Joi.date().greater('now'),
  paidDate: Joi.date().allow(null),
  notes: Joi.string().allow('', null)
});

// Update invoice status validation schema
const updateInvoiceStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'sent', 'paid', 'overdue', 'cancelled').required(),
  paidDate: Joi.when('status', {
    is: 'paid',
    then: Joi.date().required(),
    otherwise: Joi.date().allow(null).optional()
  })
});

module.exports = {
  createInvoiceSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema
};