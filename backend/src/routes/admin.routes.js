const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const adminController = require('../controllers/admin.controller');

// All routes require authentication and admin privileges
router.use(auth());
router.use(adminAuth);

// Dashboard statistics
router.get('/dashboard', adminController.getDashboardStats);
router.get('/dashboard/data', adminController.getAdminDashboardData);

// Listing approval/rejection
router.put('/listings/:id/approve', adminController.approveListing);
router.put('/listings/:id/reject', adminController.rejectListing);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Listing management
router.get('/listings', adminController.getListings);
router.get('/listings/:id', adminController.getListing);
router.put('/listings/:id', adminController.updateListing);
router.delete('/listings/:id', adminController.deleteListing);

// Category management
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Reports and analytics
router.get('/reports/users', adminController.getUsersReport);
router.get('/reports/listings', adminController.getListingsReport);
router.get('/reports/categories', adminController.getCategoriesReport);

module.exports = router; 