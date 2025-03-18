const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Import routes
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const listingRoutes = require('./listing.routes');
const categoryRoutes = require('./category.routes');
const adminRoutes = require('./admin.routes');
const importRoutes = require('./import');

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
router.use('/admin', adminRoutes);
router.use('/import', importRoutes);

module.exports = router; 