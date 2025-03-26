// index.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const path = require('path');
const logger = require('./backend/src/utils/logger');
const initImageServer = require('./services/image-server');

// Import the backend app (which contains all API routes and middleware)
// But we're not starting its server - we'll use it as middleware
const backendApp = require('./backend/src/app');

// Initialize the main app
const app = express();
const PORT = process.env.PORT || 3000;

// Log app initialization
logger.info('Starting combined application (backend + frontend + image server)...');

// Initialize image server
const imageServerConfig = {
  uploadsDir: process.env.IMAGE_STORAGE_PATH || path.join(__dirname, 'uploads'),
  standalone: false,
  port: PORT, // Ensure the port is correctly set
  basePath: '/api/images', // Set the base path for image URLs
  verbose: true // Enable verbose logging
};
const imageServer = initImageServer(imageServerConfig);
logger.info(`Image server initialized with uploads directory: ${imageServerConfig.uploadsDir}`);
logger.info(`Image server endpoint: http://localhost:${PORT}/api/images`);

// Mount image server at /api/images
app.use('/api/images', imageServer.router);

// Add a test endpoint for the image server
app.get('/api/images/test', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Image server is working',
    uploadsDir: imageServerConfig.uploadsDir,
    timestamp: new Date().toISOString()
  });
});

// CRITICAL: DIRECT API HANDLERS MUST COME BEFORE BACKEND APP MIDDLEWARE
// Add direct API handlers for critical endpoints
app.get('/api/categories', async (req, res) => {
  try {
    logger.info('Using direct categories handler in main app');
    const { Category } = require('./backend/src/models');
    const categories = await Category.findAll();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error(`Error in direct category route: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories' 
    });
  }
});

app.get('/api/listings', async (req, res) => {
  try {
    logger.info('Using direct listings handler in main app');
    const { Listing } = require('./backend/src/models');
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const listings = await Listing.findAll({ 
      limit, 
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    logger.error(`Error in direct listing route: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch listings' 
    });
  }
});

// Add users API handler
app.get('/api/users', async (req, res) => {
  try {
    logger.info('Using direct users handler in main app');
    const { User } = require('./backend/src/models');
    const users = await User.findAll({
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error(`Error in direct users route: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch users' 
    });
  }
});

// Add an auth status endpoint
app.get('/api/auth', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is available. Use POST /api/auth/login to authenticate.',
    endpoints: [
      { path: '/api/auth/login', method: 'POST', description: 'Login with email/password' },
      { path: '/api/auth/register', method: 'POST', description: 'Register a new user' },
      { path: '/api/auth/refresh-token', method: 'POST', description: 'Get a new access token' }
    ]
  });
});

// Add an API root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'AzeriMarket API is running',
    timestamp: new Date().toISOString(),
    routes: [
      '/api/categories',
      '/api/listings',
      '/api/users',
      '/api/auth',
      '/api/images',
      '/api/health',
      '/api/seo'
    ]
  });
});

// Add a health check endpoint for monitoring server status
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: true,
      imageServer: true
    }
  };
  
  // Check if image server is working
  try {
    const fs = require('fs');
    const imageDir = imageServerConfig.uploadsDir;
    
    // Check if uploads directory exists and is accessible
    const dirExists = fs.existsSync(imageDir);
    if (!dirExists) {
      healthData.services.imageServer = false;
      healthData.status = 'degraded';
    }
  } catch (error) {
    logger.error(`Health check error: ${error.message}`);
    healthData.services.imageServer = false;
    healthData.status = 'degraded';
  }
  
  res.json(healthData);
});

// For API routes not handled by direct handlers, use the backend app middleware
app.use('/api', (req, res, next) => {
  // Skip image-related routes for the backend
  if (req.path.startsWith('/images')) {
    logger.debug(`Image API request: ${req.method} ${req.path}`);
    return next();
  }
  
  // Log API requests for debugging
  logger.debug(`API request to ${req.method} ${req.path}`);
  console.log(`MAIN SERVER: Handling API request: ${req.method} ${req.path}`);
  
  // Set a flag to indicate this is an API request through the main app
  req.isApiRequest = true;
  
  // For API routes, the main backend app expects paths WITHOUT the /api prefix
  // Example: /api/categories should be handled as /categories in the backend app
  // IMPORTANT: Do not modify the path for root API requests
  if (req.path !== '/') {
    const originalPath = req.path;
    // The request already has /api stripped by express middleware
    // but we need to ensure the path is correctly passed to backend routes
    req._parsedUrl.pathname = req.path;
    console.log(`MAIN SERVER: Rewriting path from ${originalPath} to ${req.path} before forwarding to backend`);
  }
  
  // Use the backend app to handle the request
  backendApp(req, res, next);
});

// Serve static frontend files from the frontend/dist directory
logger.info(`Serving frontend files from: ${path.join(__dirname, 'frontend/dist')}`);
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// For any request that doesn't match an API route or static file, serve the frontend index.html
// This enables client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  logger.success(`🚀 Full stack application running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 API available at http://localhost:${PORT}/api`);
  logger.info(`🖼️ Image server available at http://localhost:${PORT}/api/images`);
  logger.info(`💻 Frontend available at http://localhost:${PORT}`);
});