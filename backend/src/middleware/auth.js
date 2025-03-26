const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');
const { AuthenticationError, ForbiddenError, ApiError } = require('../utils/errors');

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request
 */
const auth = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE START ===');
    
    // Get token from header
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Token present:', !!token);

    if (!token) {
      console.log('No token provided, rejecting request');
      throw new ApiError(401, 'No token provided');
    }

    // Verify token
    console.log('Verifying token...');
    const decoded = jwt.verify(token, config.jwt.secret);
    console.log('Token verified. User ID in token:', decoded.id);

    // Get user from database
    const user = await User.findByPk(decoded.id);
    console.log('User found in database:', !!user);

    if (!user) {
      console.log('User not found in database');
      throw new ApiError(401, 'User not found');
    }

    // Check if user is active
    console.log('User status:', user.status);
    if (user.status !== 'active') {
      console.log('User account not active');
      throw new ForbiddenError('Account is not active');
    }

    // Attach user to request object
    req.user = user;
    console.log('User attached to request. ID:', user.id);
    console.log('=== AUTH MIDDLEWARE END ===');
    next();
  } catch (error) {
    console.log('Auth middleware error:', error.message);
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
const adminAuth = async (req, res, next) => {
  try {
    // First authenticate the user
    await auth(req, res, () => {
      // Check if user is admin
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        throw new ForbiddenError('Admin access required');
      }
      
      next();
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Super admin authorization middleware
 * Checks if the authenticated user is a super admin
 */
const superAdminAuth = async (req, res, next) => {
  try {
    // First authenticate the user
    await auth(req, res, () => {
      // Check if user is super admin
      if (req.user.role !== 'superadmin') {
        throw new ForbiddenError('Super admin access required');
      }
      
      next();
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin role check middleware
 * Checks if the authenticated user has admin privileges
 * This is used after the auth middleware has already run
 */
const isAdmin = (req, res, next) => {
  try {
    // Auth middleware should have already attached the user
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }
    
    // Check if user is admin or superadmin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      throw new ForbiddenError('Admin access required');
    }
    
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  auth,
  adminAuth,
  superAdminAuth,
  isAdmin
}; 