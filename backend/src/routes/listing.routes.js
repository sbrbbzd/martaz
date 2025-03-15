const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const listingController = require('../controllers/listing.controller');
const listingValidation = require('../validations/listing.validation');

// Public routes
router.get('/', listingController.getListings);
router.get('/featured', listingController.getFeaturedListings);
router.get('/category/:categoryId', listingController.getListingsByCategory);
router.get('/:id', listingController.getListing);

// Protected routes
router.post(
  '/',
  auth(),
  validate(listingValidation.createListing),
  listingController.createListing
);

router.put(
  '/:id',
  auth(),
  validate(listingValidation.updateListing),
  listingController.updateListing
);

router.delete(
  '/:id',
  auth(),
  listingController.deleteListing
);

router.post(
  '/:id/images',
  auth(),
  listingController.uploadImages
);

module.exports = router; 