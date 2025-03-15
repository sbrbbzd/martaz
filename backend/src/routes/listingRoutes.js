const express = require('express');
const listingController = require('../controllers/listingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { listingSchema } = require('../validations/listingValidation');

const router = express.Router();

// Public routes
router.get('/', listingController.getListings);
router.get('/featured', listingController.getFeaturedListings);
router.get('/:idOrSlug', listingController.getListing);

// Protected routes (require authentication)
router.use(authenticate);

// User listings routes
router.get('/user/my-listings', listingController.getMyListings);
router.post('/', validateRequest(listingSchema.create), listingController.createListing);
router.put('/:id', validateRequest(listingSchema.update), listingController.updateListing);
router.delete('/:id', listingController.deleteListing);
router.patch('/:id/status', validateRequest(listingSchema.changeStatus), listingController.changeListingStatus);

// Admin-only routes
router.patch('/:id/promote', authorize('admin'), validateRequest(listingSchema.promote), listingController.promoteListing);

module.exports = router; 