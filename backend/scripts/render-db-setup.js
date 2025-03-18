/**
 * Specialized script for initializing the database in Render environment
 */

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.RENDER = 'true';

// Import required modules
const logger = require('../src/utils/logger');
const config = require('../src/config');

// Log setup info
logger.info('🔧 Starting Render database setup script');
logger.info(`Environment: ${process.env.NODE_ENV}`);

// Import models
const models = require('../src/models');
logger.info('✓ Models imported successfully');

// Import the specialized Render database connection
const db = require('../src/database/render-connection');
logger.info('✓ Render database connection loaded');

// Function to delay execution for retry
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main function
async function setupDatabase() {
  try {
    // Test connection first
    logger.info('Testing database connection...');
    let connected = false;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!connected && attempts < maxAttempts) {
      attempts++;
      try {
        logger.info(`Connection attempt ${attempts}/${maxAttempts}...`);
        connected = await db.testConnection();
        if (connected) {
          logger.success('✅ Database connection successful');
        }
      } catch (error) {
        logger.error(`❌ Connection attempt ${attempts} failed: ${error.message}`);
        if (attempts < maxAttempts) {
          const delayMs = attempts * 2000;
          logger.info(`Waiting ${delayMs/1000} seconds before next attempt...`);
          await delay(delayMs);
        }
      }
    }
    
    if (!connected) {
      throw new Error(`Failed to connect to database after ${maxAttempts} attempts`);
    }
    
    // Always use force: true for fresh setup in Render
    logger.info('Syncing database models with force: true...');
    await db.sequelize.sync({ force: true });
    logger.success('✅ Database tables created successfully');
    
    // Run seeders
    logger.info('Running database seeders...');
    const seeders = require('../src/seeders');
    await seeders.run();
    logger.success('✅ Database seed data created successfully');
    
    logger.success('🎉 Database setup completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Database setup failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Run the setup
setupDatabase(); 