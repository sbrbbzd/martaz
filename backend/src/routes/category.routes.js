const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const categoryController = require('../controllers/category.controller');
const categoryValidation = require('../validations/category.validation');
const { isAdmin } = require('../middleware/admin');

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', categoryController.getCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id', categoryController.getCategory);

/**
 * @route   GET /api/categories/:id/subcategories
 * @desc    Get subcategories of a category
 * @access  Public
 */
router.get('/:id/subcategories', categoryController.getSubcategories);

/**
 * @route   GET /api/categories/hierarchy
 * @desc    Get category hierarchy (nested structure)
 * @access  Public
 */
router.get('/hierarchy', categoryController.getCategoryHierarchy);

/**
 * @route   GET /api/categories/:idOrSlug
 * @desc    Get category by ID or slug
 * @access  Public
 */
router.get('/:idOrSlug', categoryController.getCategoryById);

/**
 * @route   GET /api/categories/:idOrSlug/listings
 * @desc    Get listings in a category
 * @access  Public
 */
router.get('/:idOrSlug/listings', categoryController.getCategoryListings);

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Admin
 */
router.post(
  '/',
  auth,
  isAdmin,
  validate(categoryValidation.createCategory),
  categoryController.createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category
 * @access  Admin
 */
router.put(
  '/:id',
  auth,
  isAdmin,
  validate(categoryValidation.updateCategory),
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category
 * @access  Admin
 */
router.delete(
  '/:id',
  auth,
  isAdmin,
  categoryController.deleteCategory
);

module.exports = router; 