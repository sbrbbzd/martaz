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

// Import routes with fallback mechanism
let authRoutes, userRoutes, categoryRoutes, listingRoutes, adminRoutes, importRoutes;

// Helper function to safely require modules with fallbacks
function safeRequire(paths) {
  for (const path of paths) {
    try {
      return require(path);
    } catch (err) {
      logger.warn(`Failed to load module at ${path}: ${err.message}`);
    }
  }
  logger.error(`Could not load any of the provided paths: ${paths.join(', ')}`);
  return null; // Return null instead of empty object to detect failures
}

// Try different possible file paths for each route
authRoutes = safeRequire([
  './routes/auth.routes.js',
  './routes/auth.routes',
  './routes/auth.js',
  './routes/authRoutes.js',
  './routes/auth'
]);

userRoutes = safeRequire([
  './routes/user.routes.js', 
  './routes/user.routes',
  './routes/users.js',
  './routes/users',
  './routes/user'
]);

categoryRoutes = safeRequire([
  './routes/category.routes.js',
  './routes/category.routes',
  './routes/categories.js',
  './routes/categories',
  './routes/categoryRoutes.js'
]);

listingRoutes = safeRequire([
  './routes/listing.routes.js',
  './routes/listing.routes',
  './routes/listings.js',
  './routes/listings',
  './routes/listingRoutes.js'
]);

adminRoutes = safeRequire([
  './routes/admin.routes.js',
  './routes/admin.routes',
  './routes/admin.js',
  './routes/admin'
]);

importRoutes = safeRequire([
  './routes/import.js',
  './routes/import'
]);

// If any routes failed to load, use built-in route fallbacks
if (!categoryRoutes) {
  logger.error('Failed to load category routes, creating a simple fallback router');
  categoryRoutes = express.Router();
  
  // Add a basic endpoint to the fallback router
  categoryRoutes.get('/', async (req, res) => {
    try {
      const { Category } = require('./models');
      const categories = await Category.findAll();
      res.json(categories);
    } catch (error) {
      logger.error(`Error in fallback category route: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });
}

if (!listingRoutes) {
  logger.error('Failed to load listing routes, creating a simple fallback router');
  listingRoutes = express.Router();
  
  // Add a basic endpoint to the fallback router
  listingRoutes.get('/', async (req, res) => {
    try {
      const { Listing } = require('./models');
      const listings = await Listing.findAll({ limit: 20 });
      res.json(listings);
    } catch (error) {
      logger.error(`Error in fallback listing route: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  });
}

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
    // Proxy to the image server (now on the same port)
    return res.redirect(`/api/images/${filename}`);
  }
  
  // Handle placeholder image
  if (imagePath === '/placeholder.jpg') {
    return res.redirect('/api/images/placeholder.jpg');
  }
  
  // For all other images, proxy to the local image handler 
  return next();
});

// API Routes
logger.debug('Setting up API routes...');

// Add a test endpoint to verify basic routing
app.get('/test-api', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend API test endpoint is working',
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    timestamp: new Date().toISOString()
  });
});

// Add a middleware to handle the API path prefixing
app.use((req, res, next) => {
  // Log all requests for debugging
  logger.debug(`Received request to backend app: ${req.method} ${req.path}`);
  
  // If this request came from the main app as an API request,
  // the '/api' prefix has already been removed, but route handlers
  // in this app expect paths that include /api
  if (req.isApiRequest) {
    // For the root path, we don't need to add the /api prefix
    if (req.path === '/') {
      return next();
    }
  }
  
  next();
});

// Mount all routes with logging and consistent error handling
// Mount the main routes module at the root path
app.use('/', (req, res, next) => {
  logger.debug(`Handling backend API request: ${req.method} ${req.path}`);
  next();
}, routes);

// Add diagnostic endpoint to check available routes
app.get('/debug/routes', (req, res) => {
  // Extract route information
  const routeInfo = routes.stack
    .filter(r => r.route && r.route.path)
    .map(r => ({
      path: r.route.path,
      methods: Object.keys(r.route.methods).join(',')
    }));

  // Find mounted routes
  const mountedRouteInfo = routes.stack
    .filter(r => r.name === 'router')
    .map(r => ({
      path: r.regexp.toString(),
      name: r.handle.name || 'unnamed'
    }));
    
  res.json({
    status: 'ok',
    routes: {
      main: routes ? 'loaded' : 'not loaded',
      count: routes.stack.length,
      directRoutes: routeInfo,
      mountedRoutes: mountedRouteInfo
    },
    timestamp: new Date().toISOString()
  });
});

// Add direct handlers for critical API endpoints
app.get('/categories', async (req, res, next) => {
  try {
    logger.info('Using direct categories handler');
    const { Category } = require('./models');
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    logger.error(`Error in direct category route: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/listings', async (req, res, next) => {
  try {
    logger.info('Using direct listings handler');
    const { Listing } = require('./models');
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const listings = await Listing.findAll({ 
      limit, 
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json(listings);
  } catch (error) {
    logger.error(`Error in direct listing route: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// API routes
logger.debug('Setting up API routes...');
app.use('/api', routes);

// Direct SEO routes registration for debugging
try {
  const seoRoutes = require('./routes/seo.routes');
  if (seoRoutes) {
    logger.info('Directly registering SEO routes at /api/seo-direct');
    app.use('/api/seo-direct', seoRoutes);
    
    // Also register them at the main /api/seo path to fix 404 errors
    logger.info('Registering SEO routes at /api/seo');
    app.use('/api/seo', seoRoutes);
  }
} catch (error) {
  logger.error(`Failed to directly register SEO routes: ${error.message}`);
}

// Register the test-seo router directly
try {
  const testSeoRouter = require('./routes/test-seo');
  if (testSeoRouter) {
    logger.info('Registering test SEO router at /api/test-seo');
    app.use('/api/test-seo', testSeoRouter);
  }
} catch (error) {
  logger.error(`Failed to register test SEO router: ${error.message}`);
}

// Add special CORS settings for SEO endpoints
app.use('/api/seo', cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('/api/seo*', cors()); // Enable pre-flight for all SEO endpoints

// Direct handlers for specific SEO endpoints
app.get('/api/seo', (req, res) => {
  logger.info('BACKEND APP: Direct handler for /api/seo called');
  console.log('BACKEND APP: Direct handler for /api/seo called - returning mock data');
  // Return mock SEO settings
  res.json({
    success: true,
    data: [
      {
        id: '1',
        pageType: 'global',
        pageIdentifier: null,
        title: 'Mart.az - Largest Marketplace in Azerbaijan',
        description: 'Buy and sell products across Azerbaijan with the largest online marketplace',
        keywords: 'marketplace, online shopping, azerbaijan, baku, sell items',
        ogTitle: 'Mart.az',
        ogDescription: 'The leading online marketplace in Azerbaijan',
        ogImage: 'https://example.com/images/og-image.jpg',
        twitterTitle: 'Mart.az Online Marketplace',
        twitterDescription: 'Find anything you need on Mart.az',
        twitterImage: 'https://example.com/images/twitter-image.jpg',
        canonical: 'https://mart.az',
        robotsDirectives: 'index, follow',
        structuredData: { "@type": "Organization", "name": "Mart.az" },
        priority: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/seo/available-pages', (req, res) => {
  logger.info('BACKEND APP: Direct handler for /api/seo/available-pages called');
  console.log('BACKEND APP: Direct handler for /api/seo/available-pages called - returning mock data');
  // Return mock available pages data
  res.json({
    success: true,
    data: {
      pageTypes: [
        { id: 'global', name: 'Global Settings' },
        { id: 'home', name: 'Homepage' },
        { id: 'listings', name: 'Listings Pages' },
        { id: 'listing_detail', name: 'Listing Detail Pages' },
        { id: 'category', name: 'Category Pages' },
        { id: 'user_profile', name: 'User Profile Pages' },
        { id: 'search', name: 'Search Results Pages' },
        { id: 'static', name: 'Static Pages' }
      ],
      categories: [
        { id: '1', name: 'Electronics', slug: 'electronics' },
        { id: '2', name: 'Vehicles', slug: 'vehicles' },
        { id: '3', name: 'Home & Garden', slug: 'home-garden' }
      ],
      staticPages: [
        { id: 'about', name: 'About Us', path: '/about' },
        { id: 'contact', name: 'Contact Us', path: '/contact' },
        { id: 'terms', name: 'Terms of Service', path: '/terms' },
        { id: 'privacy', name: 'Privacy Policy', path: '/privacy' },
        { id: 'faq', name: 'FAQ', path: '/faq' }
      ]
    }
  });
});

// Error handling middleware
logger.debug('Setting up error handling middleware...');
app.use(errorHandler);

// Initialize database
logger.info('Starting database initialization...');

// Only initialize the database if this file is run directly (not imported)
if (require.main === module) {
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
} else {
  // Initialize database when imported from another file
  (async () => {
    try {
      const dbInitialized = await initDatabase();
      if (dbInitialized) {
        logger.success('Database initialized successfully from imported module');
      } else {
        logger.error('Database initialization failed from imported module');
      }
    } catch (error) {
      logger.error('Error during database initialization from imported module:', error);
    }
  })();
}

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