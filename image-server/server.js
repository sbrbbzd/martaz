const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true
}));

// Add body parser for JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directory to serve files from
const UPLOADS_DIR = '/Users/sabirbabazade/Mart.az/tmp';

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`Created uploads directory: ${UPLOADS_DIR}`);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}.${file.originalname.split('.').pop()}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10 // Max 10 files
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
app.get('/test', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    res.json({
      message: 'Image server is running',
      uploadsDir: UPLOADS_DIR,
      files: files
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// Upload endpoint
app.post('/upload', upload.array('images', 10), (req, res) => {
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
      return {
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        path: `/tmp/${file.filename}`
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

// Add a specific file check endpoint
app.get('/check/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOADS_DIR, filename);
  
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
app.use('/images', (req, res, next) => {
  const filePath = path.join(UPLOADS_DIR, req.path);
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
}, express.static(UPLOADS_DIR));

// Add a catch-all route for debugging
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `The requested path ${req.originalUrl} was not found`,
    availableRoutes: ['/test', '/check/:filename', '/images/:filename', '/upload']
  });
});

app.listen(PORT, () => {
  console.log(`Image server running at http://localhost:${PORT}`);
  console.log(`Serving files from: ${UPLOADS_DIR}`);
}); 