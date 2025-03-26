const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * @route GET /api/favorites
 * @desc Get all favorites for the current user
 * @access Private
 */
router.get('/', authenticate, favoriteController.getFavorites);

/**
 * @route POST /api/favorites
 * @desc Add a new favorite
 * @access Private
 */
router.post('/', authenticate, favoriteController.addFavorite);

/**
 * @route DELETE /api/favorites/:id
 * @desc Remove a favorite
 * @access Private
 */
router.delete('/:id', authenticate, favoriteController.removeFavorite);

/**
 * @route GET /api/favorites/check
 * @desc Check if an item is in favorites
 * @access Private
 */
router.get('/check', authenticate, favoriteController.checkFavorite);

/**
 * @route GET /api/favorites/get
 * @desc Get a specific favorite by itemId and itemType
 * @access Private
 */
router.get('/get', authenticate, favoriteController.getFavorite);

module.exports = router; 