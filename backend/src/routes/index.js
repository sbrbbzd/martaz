const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const axios = require('axios');

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
const favoriteRoutes = safeRequire(['./favorite.routes', './favorite.routes.js', './favorites', './favorites.js']);

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
      import: importRoutes ? 'loaded' : 'missing',
      favorites: favoriteRoutes ? 'loaded' : 'missing'
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

// Proxy endpoint for external images (to avoid CORS issues)
router.get('/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: 'URL parameter is required' });
    }
    
    // Log the proxy request
    console.log(`Proxying external image: ${url}`);
    
    // Fetch the image from the external source
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });
    
    // Set headers from the response
    res.set('Content-Type', response.headers['content-type']);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Pipe the image data to our response
    response.data.pipe(res);
  } catch (error) {
    console.error('Image proxy error:', error.message);
    res.status(500).json({ message: 'Failed to proxy image' });
  }
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
mountRoutes('favorites', favoriteRoutes);

module.exports = router; 