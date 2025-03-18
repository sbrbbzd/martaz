const { ValidationError } = require('./errors');

/**
 * Validates listing data before creation or update
 * @param {Object} data - Listing data to validate
 * @returns {Object} - Validation result with potential error
 */
const validateListingData = (data) => {
  const errors = [];

  // Validate required fields
  if (!data.title || data.title.trim().length < 3 || data.title.trim().length > 100) {
    errors.push('Title must be between 3 and 100 characters');
  }

  if (!data.description || data.description.trim().length < 10 || data.description.trim().length > 5000) {
    errors.push('Description must be between 10 and 5000 characters');
  }

  if (data.price === undefined || isNaN(parseFloat(data.price)) || parseFloat(data.price) < 0) {
    errors.push('Price must be a positive number');
  }

  if (!data.currency || !['AZN', 'USD', 'EUR'].includes(data.currency)) {
    errors.push('Currency must be one of: AZN, USD, EUR');
  }

  if (!data.location || data.location.trim().length === 0) {
    errors.push('Location is required');
  }

  if (!data.userId) {
    errors.push('User ID is required');
  }

  // Validate optional fields if provided
  if (data.condition && !['new', 'like-new', 'good', 'fair', 'poor'].includes(data.condition)) {
    errors.push('Condition must be one of: new, like-new, good, fair, poor');
  }

  if (data.status && !['active', 'pending', 'sold', 'expired', 'deleted'].includes(data.status)) {
    errors.push('Status must be one of: active, pending, sold, expired, deleted');
  }

  if (data.contactEmail && !/^\S+@\S+\.\S+$/.test(data.contactEmail)) {
    errors.push('Contact email must be a valid email address');
  }

  // For imported listings, ensure images are valid URLs
  if (data.images && Array.isArray(data.images)) {
    data.images.forEach((image, index) => {
      try {
        new URL(image);
      } catch (e) {
        errors.push(`Image at index ${index} is not a valid URL`);
      }
    });
  }

  // Return validation result
  if (errors.length > 0) {
    return {
      error: new ValidationError(errors.join(', '))
    };
  }

  return { error: null };
};

module.exports = {
  validateListingData
}; 