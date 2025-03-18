// index.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const path = require('path');
const logger = require('./backend/src/utils/logger');
const initImageServer = require('./services/image-server');

// Import the backend app (which contains all API routes and middleware)
const backendApp = require('./backend/src/app');

// Initialize the main app
const app = express();
const PORT = process.env.PORT || 3000;

// Log app initialization
logger.info('Starting combined application (backend + frontend + image server)...');

// Initialize image server
const imageServerConfig = {
  uploadsDir: process.env.IMAGE_STORAGE_PATH || path.join(__dirname, 'uploads'),
  standalone: false
};
const imageServer = initImageServer(imageServerConfig);
logger.info(`Image server initialized with uploads directory: ${imageServerConfig.uploadsDir}`);

// Use the backend app for all /api routes (except images)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/images')) {
    return next('route'); // Skip to the image server middleware
  }
  backendApp(req, res, next);
});

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