const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const initDatabase = require('./database/init');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const listingRoutes = require('./routes/listing.routes');
const adminRoutes = require('./routes/admin');
const importRoutes = require('./routes/import');

logger.info('Initializing Express application...');

// Initialize Express app
const app = express();

// Middleware
logger.debug('Setting up middleware...');

logger.debug('Adding Helmet security headers...');
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "*"]
    }
  }
})); // Security headers with cross-origin exceptions

logger.debug('Adding compression middleware...');
app.use(compression()); // Compress responses

logger.debug('Configuring CORS...');
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
})); // CORS configuration

logger.debug('Adding body parsers...');
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies with increased limit

// Rate limiting
logger.debug('Setting up rate limiting...');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Logging
if (config.env !== 'test') {
  logger.debug('Adding HTTP request logging...');
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Health check endpoint
logger.debug('Setting up health check endpoint...');
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: config.version
  });
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Add CORS headers for all static files in public directory
app.use('/public', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// If using a custom uploads directory (from environment variable)
if (process.env.CUSTOM_UPLOADS_DIR) {
  const customUploadsPath = path.resolve(process.env.CUSTOM_UPLOADS_DIR);
  
  // Add a test route to verify the files exist
  app.get('/test-uploads', (req, res) => {
    try {
      const files = fs.readdirSync(customUploadsPath);
      res.json({
        uploadsDir: customUploadsPath,
        exists: fs.existsSync(customUploadsPath),
        isDirectory: fs.statSync(customUploadsPath).isDirectory(),
        files: files,
        fullPaths: files.map(f => path.join(customUploadsPath, f))
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        stack: error.stack
      });
    }
  });
  
  // Add CORS headers BEFORE the static middleware
  app.use('/tmp', function(req, res, next) {
    // Allow cross-origin requests
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    // Log request for debugging
    logger.debug(`Serving static file from /tmp: ${req.path}`);
    
    // Check if the file actually exists
    const filePath = path.join(customUploadsPath, req.path);
    const fileExists = fs.existsSync(filePath);
    logger.debug(`File ${filePath} exists: ${fileExists}`);
    
    next();
  });
  
  // Serve static files from custom uploads directory
  app.use('/tmp', express.static(customUploadsPath, {
    setHeaders: function (res, path, stat) {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }));
  
  logger.info(`Serving files from custom directory: ${customUploadsPath}`);
}

// Image proxy endpoint to serve images through the API
app.use('/api/images', (req, res, next) => {
  const imagePath = req.path;
  
  // Log image request
  console.log(`Image request: ${imagePath}`);
  
  // Check if it's a tmp path request
  if (imagePath.startsWith('/tmp/')) {
    const filename = imagePath.substring(5); // Remove /tmp/
    // Proxy to the image server
    return res.redirect(`http://localhost:3001/images/${filename}`);
  }
  
  // Handle placeholder image
  if (imagePath === '/placeholder.jpg') {
    return res.redirect('http://localhost:3001/images/placeholder.jpg');
  }
  
  // For all other images, proxy to the image server
  return res.redirect(`http://localhost:3001${imagePath}`);
});

// API Routes
logger.debug('Setting up API routes...');
app.use('/api', routes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/import', importRoutes);

// Error handling middleware
logger.debug('Setting up error handling middleware...');
app.use(errorHandler);

// Initialize database
logger.info('Starting database initialization...');
(async () => {
  try {
    // Initialize database and create tables
    const dbInitialized = await initDatabase();
    
    if (dbInitialized) {
      logger.success('Database initialized successfully');
    } else {
      logger.error('Database initialization failed');
    }
  } catch (error) {
    logger.error('Error during database initialization:', error);
  }
})();

// 404 handler
logger.debug('Setting up 404 handler...');
app.use((req, res) => {
  logger.debug(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

logger.success('Express application initialized successfully');

module.exports = app; 