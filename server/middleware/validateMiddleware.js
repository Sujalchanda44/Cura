/**
 * Request Validation Middleware & Rule Helpers
 */

const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');

const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const source = req.method === 'GET' ? req.query : req.body;

    for (const [field, rules] of Object.entries(schema)) {
      const value = source[field];

      // 1. Required Check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: rules.message || `${field} is required.` });
        continue;
      }

      // Skip optional fields if not provided
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // 2. Type Check
      if (rules.type) {
        if (rules.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push({ field, message: `${field} must be a valid email address.` });
          }
        } else if (rules.type === 'number') {
          if (isNaN(Number(value))) {
            errors.push({ field, message: `${field} must be a valid number.` });
          }
        } else if (rules.type === 'array') {
          if (!Array.isArray(value)) {
            errors.push({ field, message: `${field} must be an array.` });
          }
        } else if (typeof value !== rules.type && rules.type !== 'email' && rules.type !== 'number' && rules.type !== 'array') {
          errors.push({ field, message: `${field} must be of type ${rules.type}.` });
        }
      }

      // 3. Min/Max Length
      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push({ field, message: `${field} must be at least ${rules.minLength} characters.` });
      }
      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push({ field, message: `${field} cannot exceed ${rules.maxLength} characters.` });
      }

      // 4. Min/Max Numerical Value
      if (rules.min !== undefined && Number(value) < rules.min) {
        errors.push({ field, message: `${field} must be at least ${rules.min}.` });
      }
      if (rules.max !== undefined && Number(value) > rules.max) {
        errors.push({ field, message: `${field} cannot exceed ${rules.max}.` });
      }

      // 5. Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({ field, message: `${field} must be one of: [${rules.enum.join(', ')}].` });
      }
    }

    if (errors.length > 0) {
      return ResponseHandler.error(
        res,
        ERROR_MESSAGES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
        errors
      );
    }

    next();
  };
};

module.exports = { validate };
