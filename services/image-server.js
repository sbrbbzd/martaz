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
    port: process.env.IMAGE_SERVER_PORT || 3000,
    verbose: false,
    ...options
  };

  const log = (message) => {
    if (config.verbose) {
      console.log(`[ImageServer] ${message}`);
    }
  };

  // Ensure uploads directory exists
  if (!fs.existsSync(config.uploadsDir)) {
    fs.mkdirSync(config.uploadsDir, { recursive: true });
    log(`Created uploads directory: ${config.uploadsDir}`);
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
      // Allow only image files
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    }
  });

  // Add health check route
  router.get('/health', (req, res) => {
    try {
      // Ensure the uploads directory is accessible
      const testAccess = fs.accessSync(config.uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
      
      // Return status info
      res.status(200).json({
        status: 'ok',
        message: 'Image server is running',
        directory: config.uploadsDir,
        writable: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      log(`Health check failed: ${error.message}`);
      res.status(500).json({
        status: 'error',
        message: 'Image server directory is not accessible',
        error: error.message,
        directory: config.uploadsDir,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Upload multiple files
  router.post('/upload', upload.array('images', config.maxFiles), (req, res) => {
    log(`Received upload request with ${req.files?.length || 0} files`);
    
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No files uploaded'
        });
      }

      // Create response with file information
      const files = req.files.map(file => {
        const relativeUrl = `${config.baseUrl}/${file.filename}`;
        
        return {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: relativeUrl,
          fullUrl: config.standalone 
            ? `http://localhost:${config.port}${relativeUrl}` 
            : relativeUrl
        };
      });

      log(`Successfully uploaded ${files.length} files`);
      
      res.status(200).json({
        status: 'success',
        message: `${files.length} file(s) uploaded successfully`,
        files: files
      });
    } catch (error) {
      log(`Upload error: ${error.message}`);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to process uploaded files',
        error: error.message
      });
    }
  });

  // Handle errors in uploads
  router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      log(`Multer error: ${err.message}`);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          status: 'error',
          message: `File too large, max size is ${config.maxFileSize / (1024 * 1024)}MB`
        });
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({
          status: 'error',
          message: `Too many files, max is ${config.maxFiles}`
        });
      }
    }
    
    log(`General upload error: ${err.message}`);
    
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  });

  // Serve static files from the uploads directory
  router.use('/', (req, res, next) => {
    log(`Serving image: ${req.path}`);
    next();
  }, express.static(config.uploadsDir, {
    setHeaders: function(res) {
      // Set headers to prevent caching issues
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
    }
  }));

  // Add 404 handler for missing images
  router.use((req, res) => {
    log(`Image not found: ${req.path}`);
    res.status(404).json({
      status: 'error',
      message: 'Image not found'
    });
  });

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
    
    // Mount the router at the base path
    app.use(config.baseUrl, router);
    
    // Add a root redirect
    app.get('/', (req, res) => {
      res.redirect(config.baseUrl);
    });
    
    // Start the server
    app.listen(config.port, () => {
      log(`Image server running in standalone mode at http://localhost:${config.port}${config.baseUrl}`);
      log(`Serving files from: ${config.uploadsDir}`);
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