/**
 * Main application entry point
 * This loads the initialization module first
 * Then starts the server
 */

// Set environment variables from .env file
require('dotenv').config();

// Configure logger first
const logger = require('./utils/logger');
logger.info('Starting Mart.az application...');

// Run database initialization directly before anything else
(async () => {
  try {
    // Only run in production or if explicitly forced
    if (process.env.NODE_ENV === 'production' || process.env.FORCE_INIT === 'true') {
      logger.info('Running database initialization...');
      
      try {
        // Import our direct initialization module
        const { initializeDatabase } = require('./database/init');
        const result = await initializeDatabase();
        
        if (result.success) {
          if (result.skipped) {
            logger.info('Database initialization skipped');
          } else {
            logger.success('Database initialization completed successfully');
          }
        } else {
          logger.error('Database initialization failed:');
          if (result.error) {
            logger.error(`Error message: ${result.error.message}`);
            logger.error(`Error stack: ${result.error.stack}`);
            
            // Check if it's a PostgreSQL error with more details
            if (result.error.original) {
              logger.error(`Original error: ${result.error.original.message}`);
              logger.error(`SQL state: ${result.error.original.code}`);
              logger.error(`SQL details: ${JSON.stringify(result.error.original.detail || {})}`);
            }
          }
          logger.error('Continuing with server startup despite initialization failure');
        }
      } catch (error) {
        logger.error('Critical error during database initialization:');
        logger.error(`Error message: ${error.message}`);
        logger.error(`Error stack: ${error.stack}`);
        
        // Check if we have network/connectivity issues
        if (error.code) {
          logger.error(`Error code: ${error.code}`);
        }
        
        // Continue with server startup even if initialization fails
      }
    } else {
      logger.info('Skipping database initialization in development mode');
    }
    
    // Now start the server
    logger.info('Starting server...');
    require('./server');
  } catch (error) {
    logger.error(`Failed to initialize application: ${error.message}`);
    logger.error(error.stack);
    // Continue with server startup even if initialization fails
    require('./server');
  }
})(); 