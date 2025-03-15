const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

// Get User model if available
let User;
try {
  User = require('../models').User;
} catch (error) {
  logger.warn('User model not found, using placeholder authentication');
}

/**
 * Middleware to authenticate requests with JWT
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated. Please log in.'
      });
    }
    
    // Get the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated. Please log in.'
      });
    }
    
    try {
      // Verify token
      const jwtSecret = config.jwt && config.jwt.secret ? config.jwt.secret : 
                       (process.env.JWT_SECRET || 'default-jwt-secret-for-dev-only');
      
      const decoded = jwt.verify(token, jwtSecret);
      
      // Add user to request
      if (User) {
        // If we have a User model, fetch the user from database
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
          return res.status(401).json({
            status: 'error',
            message: 'The user belonging to this token no longer exists.'
          });
        }
        
        // Check if user is active
        if (user.status !== 'active') {
          return res.status(401).json({
            status: 'error',
            message: 'User account is not active. Please contact support.'
          });
        }
        
        req.user = user;
      } else {
        // If no User model, just add the decoded info
        req.user = decoded;
      }
      
      next();
    } catch (error) {
      logger.error('JWT verification failed', error);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.'
      });
    }
  } catch (error) {
    logger.error('Authentication error', error);
    next(error);
  }
};

/**
 * Middleware to restrict access to specific roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated. Please log in.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.'
      });
    }
    
    next();
  };
}; 