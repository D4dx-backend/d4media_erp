const Joi = require('joi');
const mongoose = require('mongoose');

// Validate ObjectId
const validateObjectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

// Get user notifications
exports.getUserNotificationsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100),
  skip: Joi.number().integer().min(0),
  unreadOnly: Joi.boolean()
});

// Mark notification as read
exports.markAsReadSchema = Joi.object({
  id: Joi.string().custom(validateObjectId, 'Valid ObjectId').required()
});

// Delete notification
exports.deleteNotificationSchema = Joi.object({
  id: Joi.string().custom(validateObjectId, 'Valid ObjectId').required()
});

// Update notification preferences
exports.updateNotificationPreferencesSchema = Joi.object({
  email: Joi.boolean(),
  taskUpdates: Joi.boolean(),
  deadlineReminders: Joi.boolean()
}).min(1);

// Send system notification
exports.sendSystemNotificationSchema = Joi.object({
  title: Joi.string().required().trim().max(100),
  message: Joi.string().required().trim().max(1000),
  recipients: Joi.array().items(
    Joi.string().custom(validateObjectId, 'Valid ObjectId')
  ),
  roles: Joi.array().items(
    Joi.string().valid('super_admin', 'department_admin', 'department_staff', 'reception', 'client')
  ),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  sendEmail: Joi.boolean().default(false)
}).or('recipients', 'roles');