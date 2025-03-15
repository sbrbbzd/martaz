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

logger.info('Initializing Express application...');

// Initialize Express app
const app = express();

// Middleware
logger.debug('Setting up middleware...');

logger.debug('Adding Helmet security headers...');
app.use(helmet()); // Security headers

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
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

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

// API Routes
logger.debug('Setting up API routes...');
app.use('/api', routes);

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