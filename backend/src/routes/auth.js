const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateRequest({
  body: {
    email: { type: 'string', required: true, format: 'email' },
    password: { type: 'string', required: true, minLength: 8 },
    firstName: { type: 'string', required: true },
    lastName: { type: 'string', required: true },
    phone: { type: 'string', required: false }
  }
}), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateRequest({
  body: {
    email: { type: 'string', required: true, format: 'email' },
    password: { type: 'string', required: true }
  }
}), authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', auth, authController.getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', auth, authController.logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', validateRequest({
  body: {
    email: { type: 'string', required: true, format: 'email' }
  }
}), authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', validateRequest({
  body: {
    token: { type: 'string', required: true },
    password: { type: 'string', required: true, minLength: 8 }
  }
}), authController.resetPassword);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.put('/change-password', auth, validateRequest({
  body: {
    currentPassword: { type: 'string', required: true },
    newPassword: { type: 'string', required: true, minLength: 8 }
  }
}), authController.changePassword);

module.exports = router; 