const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');

// Choose the appropriate database connection based on environment
let databaseModule;
if (config.env === 'production') {
  logger.info('🚀 Using Render-specific database connection for production');
  try {
    databaseModule = require('./database/render-connection');
  } catch (error) {
    logger.error('Failed to load Render database module, falling back to standard connection');
    databaseModule = require('./database/connection');
  }
} else {
  logger.info('🧪 Using standard database connection for development');
  databaseModule = require('./database/connection');
}

const { sequelize, testConnection } = databaseModule;

// Initialize express app
const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: config.corsOrigin || '*',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    environment: config.env || 'development',
    timestamp: new Date().toISOString(),
    db_connected: sequelize.connectionManager.hasOwnProperty('getConnection') ? 'ready' : 'unknown'
  });
});

// API health check endpoint (for Render)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    environment: config.env || 'development',
    timestamp: new Date().toISOString(),
    db_connected: sequelize.connectionManager.hasOwnProperty('getConnection') ? 'ready' : 'unknown'
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Mart.az API',
    version: config.version || '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(config.env === 'development' && { stack: err.stack })
  });
});

const PORT = config.port || 3000;

// Test database connection before starting server
const startServer = async () => {
  try {
    // Use the enhanced testConnection function
    logger.info('🔌 Testing database connection before starting server...');
    const connectionSuccessful = await testConnection();
    
    if (!connectionSuccessful) {
      logger.error('❌ Database connection test failed - unable to start server');
      
      // In production, wait and retry once more before giving up
      if (config.env === 'production') {
        logger.info('Waiting 5 seconds and trying one more time...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const retrySuccessful = await testConnection();
        if (!retrySuccessful) {
          logger.error('❌ Database connection retry failed - server startup aborted');
          process.exit(1);
        }
      } else {
        process.exit(1);
      }
    }
    
    logger.success('📦 Database connection established successfully');
    
    // Start the server after successful DB connection
    app.listen(PORT, () => {
      logger.success(`✅ Server running in ${config.env || 'development'} mode on port ${PORT}`);
      logger.info(`👉 API available at http://localhost:${PORT}/api`);
      logger.info(`🔧 Environment: ${config.env || 'development'}`);
    });
  } catch (err) {
    logger.error('❌ Unexpected error during server startup:', err);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

module.exports = app; 