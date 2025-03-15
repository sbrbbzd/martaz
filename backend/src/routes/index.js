const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Import routes
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const listingRoutes = require('./listing.routes');
const categoryRoutes = require('./category.routes');

// Import admin routes if they exist
let adminRoutes;
try {
  adminRoutes = require('./admin.routes');
} catch (error) {
  logger.warn('Admin routes not found');
}

// API health check
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AzeriMarket API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/listings', listingRoutes);
router.use('/categories', categoryRoutes);

// Mount admin routes if they exist
if (adminRoutes) router.use('/admin', adminRoutes);

module.exports = router; 