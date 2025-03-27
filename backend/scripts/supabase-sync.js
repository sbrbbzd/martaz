#!/usr/bin/env node

/**
 * Script to sync database models with Supabase
 * 
 * This script will:
 * 1. Connect to your Supabase PostgreSQL database
 * 2. Create all tables defined in your Sequelize models
 * 3. Log the results
 * 
 * Usage:
 *   NODE_ENV=production node scripts/supabase-sync.js
 */

require('dotenv').config();
// Load environment-specific .env file if it exists
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`);
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log(`Loaded environment variables from ${envPath}`);
}

process.env.USE_SUPABASE = 'true';

const { sequelize } = require('../src/database/connection');
const models = require('../src/models');
const logger = require('../src/utils/logger');

async function syncDatabase() {
  logger.info('Starting database sync to Supabase...');
  
  try {
    // Test connection
    logger.info('Testing database connection...');
    await sequelize.authenticate();
    logger.success('Database connection successful!');
    
    // Force sync will drop tables if they exist - BE CAREFUL!
    // For production, you probably want { force: false }
    const forceMode = process.argv.includes('--force');
    
    if (forceMode) {
      logger.warn('⚠️ FORCE MODE ENABLED - THIS WILL DROP ALL EXISTING TABLES ⚠️');
      logger.warn('You have 5 seconds to cancel (Ctrl+C) if this is not what you want...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    logger.info(`Syncing models to database (force = ${forceMode})...`);
    
    // We're syncing each model individually in a specific order to handle dependencies
    // This approach is better than sequelize.sync() which doesn't guarantee order
    
    // First, sync base tables that don't have dependencies
    logger.info('Syncing User model...');
    await models.User.sync({ force: forceMode });
    
    logger.info('Syncing Category model...');
    await models.Category.sync({ force: forceMode });
    
    logger.info('Syncing SeoSettings model...');
    await models.SeoSettings.sync({ force: forceMode });
    
    // Then sync tables with foreign key dependencies
    logger.info('Syncing Listing model...');
    await models.Listing.sync({ force: forceMode });
    
    logger.info('Syncing ListingReport model...');
    await models.ListingReport.sync({ force: forceMode });
    
    logger.info('Syncing Favorite model...');
    await models.Favorite.sync({ force: forceMode });
    
    logger.success('All models synced successfully!');
    
    // Additional indexes that might be useful
    logger.info('Creating additional indexes...');
    try {
      // Add index for listing search
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_listings_title ON "Listings" USING gin(to_tsvector('english', "title"));
      `);
      // Add index for category slugs
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_categories_slug ON "Categories" ("slug");
      `);
      logger.success('Additional indexes created successfully!');
    } catch (indexError) {
      logger.warn('Error creating additional indexes (non-critical):', indexError.message);
    }
    
    return true;
  } catch (error) {
    logger.error('Error syncing database:', error);
    return false;
  } finally {
    // Close the connection
    logger.info('Closing database connection...');
    await sequelize.close();
  }
}

// Run the sync if this file is executed directly
if (require.main === module) {
  syncDatabase().then(success => {
    if (success) {
      logger.success('Database sync to Supabase completed successfully!');
      process.exit(0);
    } else {
      logger.error('Database sync to Supabase failed!');
      process.exit(1);
    }
  }).catch(err => {
    logger.error('Unexpected error during database sync:', err);
    process.exit(1);
  });
}

module.exports = { syncDatabase }; 