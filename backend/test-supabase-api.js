/**
 * Test script for Supabase API connection
 * 
 * This script will:
 * 1. Load environment variables from .env.supabase
 * 2. Initialize the Supabase client
 * 3. Test the connection
 * 4. Demonstrate adapter functions
 * 
 * Usage:
 *   node test-supabase-api.js
 */

// Set Supabase mode
process.env.USE_SUPABASE = 'true';

// Load environment variables from .env.supabase
require('dotenv').config({ path: '.env.supabase' });

const logger = require('./src/utils/logger');
const { supabase, testConnection, adapters } = require('./src/services/supabase');

logger.info('Starting Supabase API connection test...');

async function runTests() {
  try {
    // Test connection
    const connected = await testConnection();
    
    if (!connected) {
      logger.error('❌ Failed to connect to Supabase. Check your URL and API key.');
      process.exit(1);
    }
    
    // List tables in the database
    logger.info('Fetching available tables...');
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables', {});
    
    if (tablesError) {
      logger.info('RPC method get_tables not available, trying basic query...');
      
      // Alternative approach when RPC not available
      const { data: tablesList, error: listError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (listError) {
        logger.error('Error fetching tables:', listError.message);
      } else {
        logger.success('✅ Users table is accessible');
      }
    } else {
      logger.info('Available tables:');
      tables.forEach(table => {
        logger.info(`- ${table.table_name}`);
      });
    }
    
    // Test adapters
    logger.info('\nTesting Sequelize-like adapters:');
    
    // Test findAll
    logger.info('\n1. Testing findAll adapter...');
    const users = await adapters.findAll('users', { limit: 5 });
    logger.info(`Found ${users.length} users`);
    
    // Test findOne
    logger.info('\n2. Testing findOne adapter...');
    if (users.length > 0) {
      const firstUserId = users[0].id;
      const user = await adapters.findOne('users', { 
        where: { id: firstUserId },
        attributes: 'id,email,firstName,lastName,createdAt' 
      });
      
      if (user) {
        logger.success(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);
      } else {
        logger.error('❌ User not found with findOne');
      }
    } else {
      logger.info('No users to test findOne with');
    }
    
    // Log success
    logger.success('\n✅ Supabase API connection and adapters working successfully!');
    logger.info('\nYou can now use the Supabase client and adapters in your application.');
    logger.info('See backend/src/services/supabase.js for implementation details.');
    
  } catch (error) {
    logger.error('Test error:', error.message);
  }
}

// Run the tests
runTests(); 