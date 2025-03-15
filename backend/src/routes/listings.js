const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { validateRequest } = require('../middleware/validation');
const { auth, adminAuth } = require('../middleware/auth');

/**
 * @route   GET /api/listings
 * @desc    Get all listings with filters and pagination
 * @access  Public
 */
router.get('/', listingController.getAllListings);

/**
 * @route   GET /api/listings/search
 * @desc    Search listings
 * @access  Public
 */
router.get('/search', listingController.searchListings);

/**
 * @route   GET /api/listings/featured
 * @desc    Get featured listings for homepage
 * @access  Public
 */
router.get('/featured', listingController.getFeaturedListings);

/**
 * @route   GET /api/listings/user/:userId?
 * @desc    Get user's listings (if userId not provided, get current user's listings)
 * @access  Private
 */
router.get('/user/:userId?', auth, listingController.getUserListings);

/**
 * @route   GET /api/listings/:idOrSlug
 * @desc    Get a listing by ID or slug
 * @access  Public
 */
router.get('/:idOrSlug', listingController.getListingById);

/**
 * @route   POST /api/listings
 * @desc    Create a new listing
 * @access  Private
 */
router.post('/', auth, validateRequest({
  body: {
    title: { type: 'string', required: true, minLength: 5, maxLength: 100 },
    description: { type: 'string', required: true, minLength: 20 },
    price: { type: 'number', required: true, min: 0 },
    currency: { type: 'string', enum: ['AZN', 'USD', 'EUR'] },
    condition: { type: 'string', enum: ['new', 'like_new', 'good', 'fair', 'poor'] },
    location: { type: 'string', required: true },
    images: { type: 'array', items: { type: 'string' } },
    attributes: { type: 'object' },
    contactMethod: { type: 'string', enum: ['phone', 'email', 'both'] },
    contactPhone: { type: 'string' },
    contactEmail: { type: 'string', format: 'email' },
    categoryId: { type: 'string', required: true }
  }
}), listingController.createListing);

/**
 * @route   PUT /api/listings/:id
 * @desc    Update a listing
 * @access  Private
 */
router.put('/:id', auth, validateRequest({
  body: {
    title: { type: 'string', minLength: 5, maxLength: 100 },
    description: { type: 'string', minLength: 20 },
    price: { type: 'number', min: 0 },
    currency: { type: 'string', enum: ['AZN', 'USD', 'EUR'] },
    condition: { type: 'string', enum: ['new', 'like_new', 'good', 'fair', 'poor'] },
    location: { type: 'string' },
    images: { type: 'array', items: { type: 'string' } },
    attributes: { type: 'object' },
    contactMethod: { type: 'string', enum: ['phone', 'email', 'both'] },
    contactPhone: { type: 'string' },
    contactEmail: { type: 'string', format: 'email' },
    categoryId: { type: 'string' },
    status: { type: 'string', enum: ['draft', 'pending', 'active', 'rejected', 'expired', 'sold'] }
  }
}), listingController.updateListing);

/**
 * @route   DELETE /api/listings/:id
 * @desc    Delete a listing
 * @access  Private
 */
router.delete('/:id', auth, listingController.deleteListing);

/**
 * @route   PUT /api/listings/:id/sold
 * @desc    Mark a listing as sold
 * @access  Private
 */
router.put('/:id/sold', auth, listingController.markAsSold);

/**
 * @route   POST /api/listings/:id/promote
 * @desc    Promote a listing
 * @access  Private
 */
router.post('/:id/promote', auth, validateRequest({
  body: {
    promotionDays: { type: 'number', required: true, minimum: 1, maximum: 30 }
  }
}), listingController.promoteListing);

module.exports = router; 