const Joi = require('joi');

const categorySchema = {
  create: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    slug: Joi.string().min(2).max(50).pattern(/^[a-z0-9-]+$/),
    description: Joi.string().allow(null, ''),
    icon: Joi.string().allow(null, ''),
    image: Joi.string().allow(null, ''),
    parentId: Joi.string().uuid().allow(null),
    order: Joi.number().integer().min(0).default(0),
    isActive: Joi.boolean().default(true),
    metaTitle: Joi.string().allow(null, ''),
    metaDescription: Joi.string().allow(null, ''),
    attributes: Joi.object().default({})
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(50),
    slug: Joi.string().min(2).max(50).pattern(/^[a-z0-9-]+$/),
    description: Joi.string().allow(null, ''),
    icon: Joi.string().allow(null, ''),
    image: Joi.string().allow(null, ''),
    parentId: Joi.string().uuid().allow(null),
    order: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
    metaTitle: Joi.string().allow(null, ''),
    metaDescription: Joi.string().allow(null, ''),
    attributes: Joi.object()
  })
};

module.exports = { categorySchema }; 