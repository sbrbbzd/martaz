#!/usr/bin/env node

/**
 * Test script for Supabase database connection
 * 
 * This script will:
 * 1. Load environment variables from .env.supabase
 * 2. Initialize the database connection
 * 3. Test the connection
 * 4. Log the results
 * 
 * Usage:
 *   node test-supabase-connection.js
 */

// Set Supabase mode
process.env.USE_SUPABASE = 'true';

// Force DB_HOST to correct format for this test
process.env.DB_HOST = 'ltwqmnffgrrigyeujyvc.supabase.co';

// Load environment variables from .env.supabase
require('dotenv').config({ path: '.env.supabase' });

const { testConnection, sequelize } = require('./src/database/connection');
const logger = require('./src/utils/logger');

logger.info('Starting Supabase connection test...');
logger.info(`Using host: ${process.env.DB_HOST}`);

// Log config (without sensitive info)
logger.info(`Connection config:
  Host: ${process.env.DB_HOST}
  Port: ${process.env.DB_PORT}
  Database: ${process.env.DB_NAME}
  User: ${process.env.DB_USER}
  SSL: ${process.env.DB_SSL}
`);

async function runTest() {
  try {
    // Test the connection
    const result = await testConnection();
    
    if (result) {
      logger.success('✅ Successfully connected to Supabase PostgreSQL database!');
      
      // Check database version
      try {
        const [results] = await sequelize.query('SELECT version();');
        logger.info(`PostgreSQL version: ${results[0].version}`);
      } catch (versionError) {
        logger.error('Error getting PostgreSQL version:', versionError.message);
      }
      
      // List tables (if any)
      try {
        const [tables] = await sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `);
        
        if (tables.length > 0) {
          logger.info('Existing tables in database:');
          tables.forEach(table => {
            logger.info(`- ${table.table_name}`);
          });
        } else {
          logger.info('No tables found in database - this is normal for a new database.');
        }
      } catch (tablesError) {
        logger.error('Error listing tables:', tablesError.message);
      }
    } else {
      logger.error('❌ Failed to connect to Supabase PostgreSQL database!');
    }
  } catch (error) {
    logger.error('Error during test:', error);
  } finally {
    // Close the connection
    try {
      await sequelize.close();
      logger.info('Database connection closed.');
    } catch (closeError) {
      logger.error('Error closing connection:', closeError.message);
    }
    
    process.exit(0);
  }
}

// Run the test
runTest();
