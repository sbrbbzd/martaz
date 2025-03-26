const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  newPasswordSchema
} = require('../validations/auth.validation');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh authentication token
 * @access Public (with refresh token)
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Public
 */
router.post('/logout', authController.logout);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', validate(resetPasswordSchema), authController.forgotPassword);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public (with reset token)
 */
router.post('/reset-password', validate(newPasswordSchema), authController.resetPassword);

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', auth, authController.getMe);

module.exports = router; 