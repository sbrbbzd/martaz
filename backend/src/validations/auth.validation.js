const Joi = require('joi');

const registerSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().allow('', null)
  })
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

const resetPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().required()
  })
};

const newPasswordSchema = {
  body: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
  })
};

module.exports = {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  newPasswordSchema
}; 