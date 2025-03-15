const { ForbiddenError } = require('../utils/errors');

/**
 * Admin authorization middleware
 * Checks if the authenticated user is an admin
 * 
 * @returns {Function} Express middleware function
 */
const isAdmin = () => (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return next(new ForbiddenError('Not authenticated'));
    }
    
    // Check if user has admin role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(new ForbiddenError('Admin access required'));
    }
    
    // User is admin, proceed
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Super admin authorization middleware
 * Checks if the authenticated user is a super admin
 * 
 * @returns {Function} Express middleware function
 */
const isSuperAdmin = () => (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return next(new ForbiddenError('Not authenticated'));
    }
    
    // Check if user has super admin role
    if (req.user.role !== 'superadmin') {
      return next(new ForbiddenError('Super admin access required'));
    }
    
    // User is super admin, proceed
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  isAdmin,
  isSuperAdmin
}; 