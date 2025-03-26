const express = require('express');
const listingController = require('../controllers/listing.controller');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { listingSchema } = require('../validations/listingValidation');

const router = express.Router();

// Public routes
router.get('/', listingController.getListings);
router.get('/featured', listingController.getFeaturedListings);

// Protected routes (require authentication)
router.use(authenticate);

// User listings routes - IMPORTANT: More specific routes must come before pattern-matching routes
router.get('/my-listings', (req, res, next) => {
  // Add user ID to query params 
  req.query.userId = req.user.id;
  req.query.status = req.query.status || 'all'; // Show all user's listings by default
  return listingController.getListings(req, res, next);
});

// Pattern-matching route for single listing - must come AFTER more specific routes
router.get('/:idOrSlug', listingController.getListing);

// Other protected routes
router.post('/', validateRequest(listingSchema.create), listingController.createListing);
router.put('/:id', validateRequest(listingSchema.update), listingController.updateListing);
router.delete('/:id', listingController.deleteListing);
router.patch('/:id/status', validateRequest(listingSchema.changeStatus), listingController.changeListingStatus);

// Add the correct route for uploading images
router.post('/:id/images', listingController.uploadImages);

// Admin-only routes
router.patch('/:id/promote', authorize('admin'), validateRequest(listingSchema.promote), listingController.featureListing);

// Feature related routes
router.post('/:id/feature', validateRequest(listingSchema.feature), listingController.featureListing);

module.exports = router; 