const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');
const { ApiError } = require('../utils/errors');

const authController = {
  register: async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new ApiError(400, 'Email already registered');
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone
      });

      // Generate token
      const jwtSecret = config.jwt && config.jwt.secret ? config.jwt.secret : 
                       (process.env.JWT_SECRET || 'default-jwt-secret-for-dev-only');
      
      const token = jwt.sign({ id: user.id }, jwtSecret, {
        expiresIn: '24h'
      });

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new ApiError(401, 'Invalid credentials');
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        throw new ApiError(401, 'Invalid credentials');
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Debug the config value
      console.log('Config:', JSON.stringify(config, null, 2));
      console.log('JWT Secret exists:', !!config.jwt.secret);
      console.log('JWT Secret type:', typeof config.jwt.secret);

      // Generate token
      const jwtSecret = config.jwt && config.jwt.secret ? config.jwt.secret : 
                       (process.env.JWT_SECRET || 'default-jwt-secret-for-dev-only');
      
      const token = jwt.sign({ id: user.id }, jwtSecret, {
        expiresIn: '24h'
      });

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      next(error);
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      // Implementation
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res, next) => {
    try {
      // Implementation
    } catch (error) {
      next(error);
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      // Implementation
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      // Implementation
    } catch (error) {
      next(error);
    }
  },

  getMe: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController; 