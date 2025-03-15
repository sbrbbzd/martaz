const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const addFormats = require('ajv-formats');
const { ValidationError } = require('../utils/errors');

addFormats(ajv);

/**
 * Validate request against a JSON schema
 * @param {Object} schema Schema containing body, query, params to validate
 * @returns {Function} Middleware function
 */
exports.validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Validate body if schema has body
      if (schema.body) {
        const validate = ajv.compile(schema.body);
        const valid = validate(req.body);
        if (!valid) {
          const errors = validate.errors.map(err => {
            return `${err.instancePath.substring(1) || err.params.missingProperty || 'input'} ${err.message}`;
          });
          throw new ValidationError(`Validation error: ${errors.join(', ')}`);
        }
      }

      // Validate query if schema has query
      if (schema.query) {
        const validate = ajv.compile(schema.query);
        const valid = validate(req.query);
        if (!valid) {
          const errors = validate.errors.map(err => {
            return `${err.instancePath.substring(1) || err.params.missingProperty || 'input'} ${err.message}`;
          });
          throw new ValidationError(`Query validation error: ${errors.join(', ')}`);
        }
      }

      // Validate params if schema has params
      if (schema.params) {
        const validate = ajv.compile(schema.params);
        const valid = validate(req.params);
        if (!valid) {
          const errors = validate.errors.map(err => {
            return `${err.instancePath.substring(1) || err.params.missingProperty || 'input'} ${err.message}`;
          });
          throw new ValidationError(`Path validation error: ${errors.join(', ')}`);
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}; 