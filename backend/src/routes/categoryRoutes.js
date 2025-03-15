const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { categorySchema } = require('../validations/categoryValidation');

const router = express.Router();

// Public routes
router.get('/', categoryController.getCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:idOrSlug', categoryController.getCategory);

// Protected routes (admin only)
router.use(authenticate);
router.use(authorize('admin'));

router.post('/', validateRequest(categorySchema.create), categoryController.createCategory);
router.put('/:id', validateRequest(categorySchema.update), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router; 