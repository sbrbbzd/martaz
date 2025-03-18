/**
 * Simple image server with enhanced CORS support
 * This server replaces or supplements the existing image server
 * to ensure images can be loaded with proper CORS headers
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3001;

// Directory where images are stored
const UPLOADS_DIR = path.join(__dirname, 'tmp');

// Advanced CORS configuration
app.use((req, res, next) => {
  // Allow requests from any origin
  res.header('Access-Control-Allow-Origin', '*');
  
  // Allow credentials
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Allow specific headers
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Allow specific methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Cache control to prevent caching of sensitive resources
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('Surrogate-Control', 'no-store');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    // Add explicit headers for OPTIONS requests
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    return res.status(204).send();
  }
  
  next();
});

// Test endpoint to check if server is running
app.get('/test', (req, res) => {
  // Get list of files in uploads directory
  let files = [];
  try {
    files = fs.readdirSync(UPLOADS_DIR);
  } catch (err) {
    console.error('Error reading uploads directory:', err);
  }
  
  res.json({
    message: 'Image server is running',
    uploadsDir: UPLOADS_DIR,
    files: files
  });
});

// Serve images from uploads directory
app.use('/images', express.static(UPLOADS_DIR, {
  setHeaders: (res, path) => {
    // Set CORS headers for images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Set cache control headers
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    res.setHeader('Vary', 'Origin');
  }
}));

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    error: 'Resource not found',
    path: req.path
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Image server running on http://localhost:${PORT}`);
  console.log(`Serving images from ${UPLOADS_DIR}`);
  
  // Check if directory exists, create if it doesn't
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log(`Creating directory ${UPLOADS_DIR}`);
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  
  // Log sample image URLs
  const sampleImages = ['placeholder.jpg', 'user-placeholder.jpg'];
  console.log('\nSample image URLs:');
  sampleImages.forEach(img => {
    console.log(`http://localhost:${PORT}/images/${img}`);
  });
}); 