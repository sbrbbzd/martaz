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

// DIRECT FEATURE ENDPOINT - bypassing the normal routing system
app.post('/api/listings/:id/feature', async (req, res) => {
  try {
    logger.info('Direct feature endpoint hit for listing ID:', req.params.id);
    logger.info('Request body:', req.body);
    
    const { id } = req.params;
    const { duration } = req.body;
    
    if (!duration || !['day', 'week', 'month'].includes(duration)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid duration. Must be day, week, or month.'
      });
    }
    
    // No auth for testing purposes
    const { Listing } = require('./models');
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }
    
    // Calculate the end date based on duration
    let endDate = new Date();
    
    switch (duration) {
      case 'day':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'week':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'month':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }
    
    // Update the listing
    await listing.update({
      isPromoted: true,
      promotionEndDate: endDate
    });
    
    res.json({
      status: 'success',
      message: 'Listing featured successfully',
      data: {
        id: listing.id,
        isPromoted: listing.isPromoted,
        promotionEndDate: listing.promotionEndDate
      }
    });
  } catch (error) {
    logger.error('Error in direct feature endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// DIRECT STATUS CHANGE ENDPOINT - bypassing the normal routing system
app.patch('/api/listings/:id/status', async (req, res) => {
  try {
    logger.info('Direct status change endpoint hit for listing ID:', req.params.id);
    logger.info('Request body:', req.body);
    
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'pending', 'sold', 'expired', 'deleted'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    // No auth for testing purposes
    const { Listing } = require('./models');
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }
    
    // Update the listing
    await listing.update({ status });
    
    res.json({
      success: true,
      message: `Listing status updated to ${status}`,
      data: listing
    });
  } catch (error) {
    logger.error('Error in direct status change endpoint:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

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

// Add a utility function to safely log environment variables without exposing secrets
const logEnvironmentVariables = () => {
  logger.info('=== ENVIRONMENT VARIABLES ===');
  Object.keys(process.env)
    .filter(key => !key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('KEY'))
    .sort()
    .forEach(key => {
      logger.info(`${key}=${process.env[key]}`);
    });
  
  // Log existence of sensitive values without revealing them
  Object.keys(process.env)
    .filter(key => key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY'))
    .sort()
    .forEach(key => {
      logger.info(`${key}=${process.env[key] ? '[SET]' : '[NOT SET]'}`);
    });
  logger.info('===============================');
};

// Function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test database connection before starting server
const startServer = async () => {
  try {
    // Log environment variables for troubleshooting
    logEnvironmentVariables();
    
    // Log config information
    logger.info(`Starting server in ${config.env} mode...`);
    
    // ===== DIRECT DATABASE INITIALIZATION =====
    // In production Render environment, use our direct initialization approach
    if (config.env === 'production' && process.env.RENDER === 'true') {
      logger.info('🚨 Render production environment detected');
      logger.info('Running direct database initialization...');
      
      try {
        // Import our direct initialization module
        const initializer = require('./database/initialize');
        const result = await initializer.initializeDatabase();
        
        if (result.success) {
          logger.success('✅ Direct database initialization completed successfully');
        } else {
          logger.error('❌ Direct database initialization failed');
        }
      } catch (error) {
        logger.error('❌ Direct database initialization failed:');
        logger.error(error.message);
        logger.error(error.stack);
        // Continue with server startup even if initialization fails
      }
    }
    
    // Determine which database connection to use
    let db;
    if (config.env === 'production' && process.env.RENDER === 'true') {
      logger.info('Using Render-specific database connection...');
      db = require('./database/render-connection');
    } else {
      logger.info('Using standard database connection...');
      db = require('./database/connection');
    }
    
    // Retry connection up to 5 times with increasing delays
    let connected = false;
    let attempt = 1;
    const maxAttempts = 5;
    
    while (!connected && attempt <= maxAttempts) {
      logger.info(`Database connection attempt ${attempt}/${maxAttempts}...`);
      
      try {
        connected = await db.testConnection();
        if (connected) {
          logger.success(`✅ Database connection successful on attempt ${attempt}`);
        }
      } catch (err) {
        logger.error(`❌ Database connection failed on attempt ${attempt}: ${err.message}`);
      }
      
      if (!connected && attempt < maxAttempts) {
        const delayTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s, 8s
        logger.warn(`Retrying database connection in ${delayTime/1000} seconds...`);
        await delay(delayTime);
      }
      
      attempt++;
    }
    
    if (!connected) {
      throw new Error(`Failed to connect to database after ${maxAttempts} attempts`);
    }

    // Sync database models with special handling for production
    try {
      logger.info('Syncing database models...');
      
      // Import models and associate them
      const models = require('./models');
      
      // First try to access a table to see if it exists
      let tablesExist = true;
      try {
        logger.info('Checking if tables exist...');
        await db.sequelize.query('SELECT 1 FROM "users" LIMIT 1', { type: db.sequelize.QueryTypes.SELECT });
        logger.info('Users table exists ✅');
        
        // Also check if seo_settings table exists
        try {
          await db.sequelize.query('SELECT 1 FROM "seo_settings" LIMIT 1', { type: db.sequelize.QueryTypes.SELECT });
          logger.info('SEO settings table exists');
        } catch (err) {
          if (err.message.includes('relation') && err.message.includes('does not exist')) {
            logger.warn('SEO settings table does not exist, forcing creation of just this table');
            // Force create just the SEO settings table
            await models.SeoSettings.sync({ force: true });
            logger.info('SEO settings table created successfully');
          }
        }
        
        logger.info('Tables exist, proceeding with alter: true');
      } catch (err) {
        if (err.message.includes('relation') && err.message.includes('does not exist')) {
          logger.warn('⚠️ Tables do not exist, despite initialization attempt');
          tablesExist = false;
        } else {
          throw err;
        }
      }
      
      // In Render production, don't use force: true to prevent data loss
      // Only use alter: true to make schema updates
      if (config.env === 'production' && process.env.RENDER === 'true') {
        logger.info('Using safe sync options for Render production environment');
        // Only use alter: true in production to preserve data
        await db.sequelize.sync({ force: false, alter: true });
      } else {
        // Use standard options in development
        const force = process.env.DB_FORCE_SYNC === 'true';
        const alter = force ? false : true;
        const shouldForce = !tablesExist || force;
        const shouldAlter = tablesExist && alter;
        
        await db.sequelize.sync({ 
          force: shouldForce, 
          alter: shouldAlter 
        });
      }
      
      logger.success('✅ Database models synchronized successfully');
      
      // Run seeders if in dev mode or if forced or if tables were just created
      if (config.env === 'development' || process.env.RUN_SEEDERS === 'true' || !tablesExist) {
        logger.info('Running database seeders...');
        try {
          const seeders = require('./seeders');
          await seeders.run();
          logger.success('✅ Database seeders completed successfully');
        } catch (error) {
          logger.error(`❌ Failed to run database seeders: ${error.message}`);
        }
      }
    } catch (error) {
      logger.error(`❌ Failed to sync database models: ${error.message}`);
      logger.error(error.stack);
      // Don't throw an error here, continue with startup
    }

    // Start the Express server
    app.listen(PORT, () => {
      logger.success(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`❌ Failed to start server: ${error.message}`);
    // Don't exit the process, let Render restart if needed
    logger.warn('Server will continue running but may not function correctly');
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