const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const listingController = require('../controllers/listing.controller');
const listingValidation = require('../validations/listing.validation');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory as buffers
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10, // Max 10 files
    fieldSize: 50 * 1024 * 1024 // 50MB field size limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.get('/', listingController.getListings);
router.get('/featured', listingController.getFeaturedListings);
router.get('/category/:categoryId', listingController.getListingsByCategory);
router.get('/:idOrSlug', listingController.getListing);

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
  upload.array('images', 10),
  listingController.uploadImages
);

module.exports = router; 