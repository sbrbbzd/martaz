/**
 * Check Supabase Connection and API Operations
 * 
 * This script tests Supabase connection and basic API operations.
 * Run with: node scripts/check-supabase.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.supabase' });

const { createClient } = require('@supabase/supabase-js');
const logger = require('../src/utils/logger');

// Exit if Supabase configuration is missing
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_API_KEY) {
  logger.error('Missing Supabase configuration in .env.supabase file');
  logger.info('Make sure SUPABASE_URL and SUPABASE_API_KEY are defined');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

// Tables to check (these should match your database schema)
const tables = [
  'users',
  'categories',
  'listings',
  'favorites',
  'listing_reports',
  'seo_settings',
  'conversations',
  'messages'
];

async function checkSupabaseConnection() {
  logger.info('🔍 Checking Supabase connection...');
  
  try {
    // Test authentication (should work with anonymous key)
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('❌ Supabase authentication error:', error.message);
      return false;
    }
    
    logger.success('✅ Successfully connected to Supabase API');
    logger.info(`📊 API URL: ${process.env.SUPABASE_URL}`);
    return true;
    
  } catch (error) {
    logger.error('❌ Failed to connect to Supabase:', error.message);
    return false;
  }
}

async function checkTables() {
  logger.info('\n🔍 Checking database tables...');
  
  for (const table of tables) {
    try {
      const { data, error, status } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        logger.error(`❌ Error accessing table "${table}": ${error.message}`);
        continue;
      }
      
      // If we get here, the table exists
      logger.success(`✅ Table "${table}" exists`);
      
      // Check if we can count rows
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        logger.info(`   - Contains approximately ${count || 0} records`);
      }
      
    } catch (error) {
      logger.error(`❌ Error checking table "${table}": ${error.message}`);
    }
  }
}

async function testOperations() {
  logger.info('\n🔍 Testing basic CRUD operations...');
  
  // Example: Create a test record in a temporary table
  const testTable = 'test_connection';
  const testId = 'test_' + Date.now();
  
  try {
    // Create a test record
    const { data: insertData, error: insertError } = await supabase
      .from(testTable)
      .insert([{ id: testId, name: 'Test Record', created_at: new Date().toISOString() }]);
    
    if (insertError) {
      if (insertError.code === '42P01') {
        logger.warn(`ℹ️ Test table "${testTable}" doesn't exist (this is normal)`);
      } else {
        logger.warn(`ℹ️ Couldn't insert test record: ${insertError.message}`);
      }
    } else {
      logger.success(`✅ Successfully inserted test record`);
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from(testTable)
        .delete()
        .eq('id', testId);
      
      if (!deleteError) {
        logger.success('✅ Successfully cleaned up test record');
      }
    }
  } catch (error) {
    logger.warn(`ℹ️ Test operations check: ${error.message}`);
  }
}

async function main() {
  logger.info('=======================================');
  logger.info('🚀 Supabase Connection Check');
  logger.info('=======================================\n');
  
  const isConnected = await checkSupabaseConnection();
  
  if (isConnected) {
    await checkTables();
    await testOperations();
    
    logger.info('\n✨ Next steps:');
    logger.info('1. Update your environment variables in your Render service');
    logger.info('2. Run the test-app.js script to verify your models are working');
    logger.info('3. Deploy your application with Supabase integration enabled');
  } else {
    logger.error('\n❌ Supabase connection check failed');
    logger.info('\nPlease check:');
    logger.info('1. Your SUPABASE_URL and SUPABASE_API_KEY values in .env.supabase');
    logger.info('2. Your network connection');
    logger.info('3. Supabase service status at https://status.supabase.com');
  }
  
  logger.info('\n=======================================');
}

// Run the main function
main()
  .catch(error => {
    logger.error('Unexpected error:', error);
  }); 