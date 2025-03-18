/**
 * Modular Image Server for Mart.az
 * Can be used as middleware in the main app or run as a standalone server
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Create a router instead of an app
const router = express.Router();

// Initialize the image server module
function initImageServer(options = {}) {
  // Default config that can be overridden
  const config = {
    uploadsDir: process.env.IMAGE_STORAGE_PATH || path.join(__dirname, '../uploads'),
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    baseUrl: '/api/images', // Base URL when used in the main app
    standalone: false,
    port: process.env.IMAGE_SERVER_PORT || 3001,
    ...options
  };

  // Ensure uploads directory exists
  if (!fs.existsSync(config.uploadsDir)) {
    fs.mkdirSync(config.uploadsDir, { recursive: true });
    console.log(`Created uploads directory: ${config.uploadsDir}`);
  }

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, config.uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueName = `${uuidv4()}.${file.originalname.split('.').pop()}`;
      cb(null, uniqueName);
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: config.maxFileSize,
      files: config.maxFiles
    },
    fileFilter: (req, file, cb) => {
      // Only accept image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    }
  });

  // Test endpoint
  router.get('/test', (req, res) => {
    try {
      const files = fs.readdirSync(config.uploadsDir);
      res.json({
        message: 'Image server is running',
        uploadsDir: config.uploadsDir,
        files: files
      });
    } catch (error) {
      res.status(500).json({ 
        error: error.message 
      });
    }
  });

  // Upload endpoint
  router.post('/upload', upload.array('images', config.maxFiles), (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No images provided'
        });
      }

      console.log(`Received ${req.files.length} files for upload`);
      
      // Return the uploaded file paths
      const uploadedFiles = req.files.map(file => {
        const relativePath = '/api/images/' + file.filename;
        return {
          originalName: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          path: relativePath
        };
      });

      res.status(200).json({
        success: true,
        message: `Successfully uploaded ${req.files.length} images`,
        files: uploadedFiles
      });
    } catch (error) {
      console.error(`[ERROR] Upload failed: ${error.message}`);
      res.status(500).json({
        success: false,
        message: `Upload failed: ${error.message}`
      });
    }
  });

  // File check endpoint
  router.get('/check/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(config.uploadsDir, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        res.json({
          exists: true,
          path: filePath,
          size: stats.size,
          isFile: stats.isFile(),
          created: stats.birthtime,
          modified: stats.mtime
        });
      } else {
        res.json({
          exists: false,
          path: filePath
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Enhanced static file serving with custom middleware
  router.use('/', (req, res, next) => {
    const filePath = path.join(config.uploadsDir, req.path);
    console.log(`[DEBUG] Attempting to serve: ${filePath}`);
    
    try {
      if (fs.existsSync(filePath)) {
        console.log(`[DEBUG] File exists: ${filePath}`);
        
        // Add additional headers to prevent caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        
        next(); // Continue to the static middleware
      } else {
        console.log(`[DEBUG] File does not exist: ${filePath}`);
        res.status(404).json({ 
          error: 'File not found',
          requestedPath: req.path,
          fullPath: filePath
        });
      }
    } catch (error) {
      console.error(`[ERROR] ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }, express.static(config.uploadsDir));

  // Function to start the server in standalone mode
  function startStandalone() {
    if (!config.standalone) return;
    
    const app = express();
    
    // Enable CORS for all routes in standalone mode
    app.use(require('cors')({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true
    }));
    
    // Parse JSON and urlencoded request bodies
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // Mount the router at /
    app.use('/', router);
    
    // Start the server
    app.listen(config.port, () => {
      console.log(`Image server running in standalone mode at http://localhost:${config.port}`);
      console.log(`Serving files from: ${config.uploadsDir}`);
    });
  }

  return {
    router,
    config,
    startStandalone
  };
}

// Export the function to initialize the image server
module.exports = initImageServer; 