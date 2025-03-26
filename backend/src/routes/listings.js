const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listing.controller');
const { validateRequest } = require('../middleware/validation');
const { auth, adminAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

// DEBUG ROUTE for testing
router.post('/debug-feature', (req, res) => {
  logger.info('Debug feature route hit!');
  logger.info('Request body:', req.body);
  
  return res.json({
    status: 'success',
    message: 'Debug route working!'
  });
});

/**
 * @route   GET /api/listings
 * @desc    Get all listings with filters and pagination
 * @access  Public
 */
router.get('/', listingController.getListings);

/**
 * @route   GET /api/listings/featured
 * @desc    Get featured listings
 * @access  Public
 */
router.get('/featured', listingController.getFeaturedListings);

/**
 * @route   GET /api/listings/user/:userId
 * @desc    Get listings by user ID
 * @access  Public
 */
router.get('/user/:userId', listingController.getListingsByCategory);

/**
 * @route   GET /api/listings/category/:categoryId
 * @desc    Get listings by category ID
 * @access  Public
 */
router.get('/category/:categoryId', listingController.getListingsByCategory);

/**
 * @route   GET /api/listings/:id
 * @desc    Get listing by ID
 * @access  Public
 */
router.get('/:id', listingController.getListing);

/**
 * @route   POST /api/listings
 * @desc    Create a new listing
 * @access  Private
 */
router.post('/', auth, listingController.createListing);

/**
 * @route   POST /api/listings/:id/images
 * @desc    Upload images for a listing
 * @access  Private (owner or admin)
 */
router.post('/:id/images', auth, listingController.uploadImages);

/**
 * @route   POST /api/listings/:id/feature
 * @desc    Feature a listing
 * @access  Private (owner or admin)
 */
router.post('/:id/feature', auth, listingController.featureListing);

/**
 * @route   PATCH /api/listings/:id/status
 * @desc    Change listing status (active, sold, etc.)
 * @access  Private (owner or admin)
 */
router.patch('/:id/status', auth, listingController.changeListingStatus);

/**
 * @route   PUT /api/listings/:id
 * @desc    Update a listing
 * @access  Private (owner or admin)
 */
router.put('/:id', auth, listingController.updateListing);

/**
 * @route   DELETE /api/listings/:id
 * @desc    Delete a listing
 * @access  Private (owner or admin)
 */
router.delete('/:id', auth, listingController.deleteListing);

module.exports = router; 