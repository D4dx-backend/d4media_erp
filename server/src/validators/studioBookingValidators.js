const Joi = require('joi');

/**
 * Validate studio booking data
 * @param {Object} data - The booking data to validate
 * @param {Boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
exports.validateStudioBooking = (data, isUpdate = false) => {
  const schema = Joi.object({
    client: Joi.string().hex().length(24).allow(null).optional(),
    contactPerson: Joi.object({
      name: Joi.string().trim().min(2).max(100).required(),
      phone: Joi.string().trim().min(5).max(20).required(),
      email: Joi.string().trim().email().optional(),
      company: Joi.string().trim().max(100).optional()
    }).required(),
    bookingDate: isUpdate ? Joi.date().iso().optional() : Joi.date().iso().required(),
    timeSlot: Joi.object({
      startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
      endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
    }).required(),
    duration: isUpdate ? Joi.number().min(0.5).optional() : Joi.number().min(0.5).required(),
    purpose: isUpdate ? Joi.string().trim().min(3).max(500).optional() : Joi.string().trim().min(3).max(500).required(),
    requirements: Joi.string().trim().min(3).max(1000).optional(),
    teamSize: isUpdate ? Joi.number().integer().min(1).optional() : Joi.number().integer().min(1).required(),
    equipment: Joi.array().items(
      Joi.object({
        name: Joi.string().trim().min(2).max(100).required(),
        quantity: Joi.number().integer().min(1).required(),
        rate: Joi.number().min(0).required()
      })
    ).optional(),
    status: Joi.string().valid('inquiry', 'confirmed', 'in_progress', 'completed', 'cancelled').optional(),
    pricing: Joi.object({
      baseRate: isUpdate ? Joi.number().min(0).optional() : Joi.number().min(0).required(),
      equipmentCost: Joi.number().min(0).optional(),
      additionalCharges: Joi.array().items(
        Joi.object({
          description: Joi.string().trim().min(2).max(100).required(),
          amount: Joi.number().min(0).required()
        })
      ).optional(),
      discount: Joi.number().min(0).optional(),
      totalAmount: isUpdate ? Joi.number().min(0).optional() : Joi.number().min(0).required()
    }).required(),
    paymentStatus: Joi.string().valid('pending', 'partial', 'paid', 'refunded').optional(),
    notes: Joi.array().items(
      Joi.object({
        note: Joi.string().trim().min(2).max(1000).required(),
        addedBy: Joi.string().hex().length(24).optional(),
        addedAt: Joi.date().iso().optional()
      })
    ).optional()
  });

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate booking note
 * @param {Object} data - The note data to validate
 * @returns {Object} - Validation result
 */
exports.validateBookingNote = (data) => {
  const schema = Joi.object({
    note: Joi.string().trim().min(2).max(1000).required()
  });

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate availability check parameters
 * @param {Object} data - The availability check parameters
 * @returns {Object} - Validation result
 */
exports.validateAvailabilityCheck = (data) => {
  const schema = Joi.object({
    date: Joi.date().iso().required(),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
  });

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate calendar date range
 * @param {Object} data - The date range parameters
 * @returns {Object} - Validation result
 */
exports.validateCalendarRange = (data) => {
  const schema = Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
  });

  return schema.validate(data, { abortEarly: false });
};