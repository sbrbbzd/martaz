const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');
const { AuthenticationError, ForbiddenError, ApiError } = require('../utils/errors');

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request
 */
const auth = () => async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'No token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from database
    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new ForbiddenError('Account is not active');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Admin authorization middleware
 * Checks if the authenticated user is an admin
 */
exports.adminAuth = async (req, res, next) => {
  try {
    // First authenticate the user
    await auth()(req, res, () => {});
    
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      throw new ForbiddenError('Admin access required');
    }
    
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Super admin authorization middleware
 * Checks if the authenticated user is a super admin
 */
exports.superAdminAuth = async (req, res, next) => {
  try {
    // First authenticate the user
    await auth()(req, res, () => {});
    
    // Check if user is super admin
    if (req.user.role !== 'superadmin') {
      throw new ForbiddenError('Super admin access required');
    }
    
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  auth
}; 