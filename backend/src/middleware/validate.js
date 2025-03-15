const { ApiError } = require('../utils/errors');

const validate = (schema) => (req, res, next) => {
  try {
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) throw new ApiError(400, error.details[0].message);
    }

    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) throw new ApiError(400, error.details[0].message);
    }

    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) throw new ApiError(400, error.details[0].message);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validate
}; 