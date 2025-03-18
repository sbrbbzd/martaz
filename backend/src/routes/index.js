const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Helper function to safely require modules with fallbacks
function safeRequire(paths) {
  for (const path of paths) {
    try {
      return require(path);
    } catch (err) {
      logger.debug(`Failed to load module at ${path}: ${err.message}`);
    }
  }
  logger.warn(`Could not load any of the provided paths: ${paths.join(', ')}`);
  return null;
}

// Import routes with fallbacks for different naming patterns
const authRoutes = safeRequire(['./auth.routes', './auth.routes.js', './auth', './auth.js', './authRoutes', './authRoutes.js']);
const userRoutes = safeRequire(['./user.routes', './user.routes.js', './users', './users.js', './user', './user.js']);
const listingRoutes = safeRequire(['./listing.routes', './listing.routes.js', './listings', './listings.js', './listingRoutes', './listingRoutes.js']);
const categoryRoutes = safeRequire(['./category.routes', './category.routes.js', './categories', './categories.js', './categoryRoutes', './categoryRoutes.js']);
const adminRoutes = safeRequire(['./admin.routes', './admin.routes.js', './admin', './admin.js']);
const importRoutes = safeRequire(['./import.js', './import']);

// API health check
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AzeriMarket API is running',
    timestamp: new Date().toISOString(),
    routes: {
      auth: authRoutes ? 'loaded' : 'missing',
      users: userRoutes ? 'loaded' : 'missing',
      listings: listingRoutes ? 'loaded' : 'missing',
      categories: categoryRoutes ? 'loaded' : 'missing',
      admin: adminRoutes ? 'loaded' : 'missing',
      import: importRoutes ? 'loaded' : 'missing'
    }
  });
});

// Debug endpoint to test route paths
router.get('/test', (req, res) => {
  res.status(200).json({
    message: 'Test route is working',
    path: req.path, 
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl
  });
});

// Mount routes that were successfully loaded
// IMPORTANT: These are the correctly prefixed route names that match what controllers expect
function mountRoutes(path, routes) {
  if (routes) {
    logger.info(`Mounting ${path} routes`);
    router.use(`/${path}`, routes);
    
    // Log the first few routes for debugging
    if (routes.stack && routes.stack.length > 0) {
      logger.debug(`Routes in ${path}: ${routes.stack.slice(0, 3).map(r => 
        (r.route ? r.route.path : 'middleware')
      ).join(', ')}...`);
    }
  } else {
    logger.warn(`Routes for ${path} could not be loaded`);
  }
}

// Mount routes without leading slashes
mountRoutes('auth', authRoutes);
mountRoutes('users', userRoutes);
mountRoutes('listings', listingRoutes);
mountRoutes('categories', categoryRoutes);
mountRoutes('admin', adminRoutes);
mountRoutes('import', importRoutes);

module.exports = router; 