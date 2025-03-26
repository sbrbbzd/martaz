const Joi = require('joi');

// Basic SEO Settings validation schema
const seoSettingsSchema = Joi.object({
  pageType: Joi.string().valid(
    'global', 'home', 'listings', 'listing_detail', 'category', 
    'user_profile', 'search', 'static'
  ).required(),
  pageIdentifier: Joi.string().max(255).allow(null, ''),
  title: Joi.string().max(70).allow(null, ''),
  description: Joi.string().max(160).allow(null, ''),
  keywords: Joi.string().max(255).allow(null, ''),
  ogTitle: Joi.string().max(70).allow(null, ''),
  ogDescription: Joi.string().max(200).allow(null, ''),
  ogImage: Joi.string().uri().allow(null, ''),
  twitterTitle: Joi.string().max(70).allow(null, ''),
  twitterDescription: Joi.string().max(200).allow(null, ''),
  twitterImage: Joi.string().uri().allow(null, ''),
  canonical: Joi.string().uri().allow(null, ''),
  robotsDirectives: Joi.string().max(255).allow(null, ''),
  structuredData: Joi.object().allow(null),
  priority: Joi.number().integer().min(0).max(100).default(0)
});

// Validation middleware for creating SEO settings
exports.validateCreateSeoSettings = (req, res, next) => {
  const { error } = seoSettingsSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  
  next();
};

// Validation middleware for updating SEO settings
exports.validateUpdateSeoSettings = (req, res, next) => {
  // For updates, all fields are optional
  const updateSchema = Joi.object(
    Object.fromEntries(
      Object.entries(seoSettingsSchema.describe().keys).map(
        ([key, schema]) => [key, Joi.any()]
      )
    )
  );
  
  const { error } = updateSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  
  next();
}; 