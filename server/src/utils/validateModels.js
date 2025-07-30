/**
 * Model validation utility
 * Provides functions to validate model data before saving to database
 */
const mongoose = require('mongoose');
const { appLogger } = require('./logger');

/**
 * Validate a model instance against its schema
 * @param {Object} model - Mongoose model instance
 * @returns {Promise<Object>} - Validation result with isValid and errors
 */
const validateModel = async (model) => {
  try {
    await model.validate();
    return { isValid: true, errors: null };
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const errors = {};
      
      // Format validation errors
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      
      return { isValid: false, errors };
    }
    
    // Handle other errors
    appLogger.error(`Model validation error: ${error.message}`);
    return { isValid: false, errors: { general: error.message } };
  }
};

/**
 * Validate model data before creating a new instance
 * @param {Object} ModelClass - Mongoose model class
 * @param {Object} data - Data to validate
 * @returns {Promise<Object>} - Validation result with isValid and errors
 */
const validateModelData = async (ModelClass, data) => {
  try {
    // Create a new model instance without saving
    const model = new ModelClass(data);
    return await validateModel(model);
  } catch (error) {
    appLogger.error(`Model data validation error: ${error.message}`);
    return { isValid: false, errors: { general: error.message } };
  }
};

/**
 * Validate model update data
 * @param {Object} ModelClass - Mongoose model class
 * @param {Object} data - Update data to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} - Validation result with isValid and errors
 */
const validateUpdateData = async (ModelClass, data, options = {}) => {
  try {
    // Get the model schema
    const schema = ModelClass.schema;
    const errors = {};
    
    // Check for unknown fields
    Object.keys(data).forEach(field => {
      if (!schema.path(field) && !field.includes('.') && field !== '_id') {
        errors[field] = `Unknown field: ${field}`;
      }
    });
    
    // If there are unknown fields and strict mode is enabled
    if (Object.keys(errors).length > 0 && options.strict !== false) {
      return { isValid: false, errors };
    }
    
    // For partial updates, we need to get the existing document
    if (options.documentId) {
      try {
        const existingDoc = await ModelClass.findById(options.documentId);
        if (!existingDoc) {
          return { isValid: false, errors: { general: 'Document not found' } };
        }
        
        // Merge update data with existing document
        const mergedData = { ...existingDoc.toObject(), ...data };
        delete mergedData._id; // Remove _id to avoid validation errors
        
        // Create a new model instance with merged data
        const model = new ModelClass(mergedData);
        return await validateModel(model);
      } catch (error) {
        appLogger.error(`Update validation error: ${error.message}`);
        return { isValid: false, errors: { general: error.message } };
      }
    }
    
    // For simple validation without an existing document
    return { isValid: true, errors: null };
  } catch (error) {
    appLogger.error(`Update validation error: ${error.message}`);
    return { isValid: false, errors: { general: error.message } };
  }
};

/**
 * Sanitize model data to prevent injection attacks
 * @param {Object} data - Data to sanitize
 * @returns {Object} - Sanitized data
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  // Function to sanitize a string value
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove potentially dangerous HTML/script tags
    return str.replace(/<(script|iframe|object|embed|applet|style|link|meta|base|body|html|head)/gi, '&lt;$1');
  };
  
  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        if (typeof value === 'string') {
          result[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
    }
    
    return result;
  };
  
  return sanitizeObject(sanitized);
};

module.exports = {
  validateModel,
  validateModelData,
  validateUpdateData,
  sanitizeData
};