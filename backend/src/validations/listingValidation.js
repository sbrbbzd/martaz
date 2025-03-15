const Joi = require('joi');

const listingSchema = {
  create: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(5000).required(),
    price: Joi.number().min(0).required(),
    currency: Joi.string().valid('AZN', 'USD', 'EUR').default('AZN'),
    condition: Joi.string().valid('new', 'like-new', 'good', 'fair', 'poor'),
    location: Joi.string().required(),
    images: Joi.array().items(Joi.string()),
    featuredImage: Joi.string().allow(null, ''),
    categoryId: Joi.string().uuid().required(),
    contactPhone: Joi.string().allow(null, ''),
    contactEmail: Joi.string().email().allow(null, ''),
    attributes: Joi.object().default({})
  }),
  
  update: Joi.object({
    title: Joi.string().min(3).max(100),
    description: Joi.string().min(10).max(5000),
    price: Joi.number().min(0),
    currency: Joi.string().valid('AZN', 'USD', 'EUR'),
    condition: Joi.string().valid('new', 'like-new', 'good', 'fair', 'poor'),
    location: Joi.string(),
    images: Joi.array().items(Joi.string()),
    featuredImage: Joi.string().allow(null, ''),
    categoryId: Joi.string().uuid(),
    contactPhone: Joi.string().allow(null, ''),
    contactEmail: Joi.string().email().allow(null, ''),
    attributes: Joi.object(),
    status: Joi.string().valid('active', 'pending', 'sold', 'expired')
  }),
  
  changeStatus: Joi.object({
    status: Joi.string().valid('active', 'pending', 'sold', 'expired', 'deleted').required()
  }),
  
  promote: Joi.object({
    feature: Joi.boolean(),
    promote: Joi.boolean(),
    days: Joi.number().integer().min(1).max(90).default(7)
  }).or('feature', 'promote')
};

module.exports = { listingSchema }; 