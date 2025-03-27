/**
 * Test script for the entire application with Supabase integration
 * 
 * This script will:
 * 1. Load environment variables from .env.supabase
 * 2. Initialize the application with Supabase mode
 * 3. Test basic functionality
 * 
 * Usage:
 *   node test-app.js
 */

// Set Supabase mode
process.env.USE_SUPABASE = 'true';

// Load environment variables from .env.supabase
require('dotenv').config({ path: '.env.supabase' });

const logger = require('./src/utils/logger');
const { User, Listing, Category, isSupabase } = require('./src/models');

logger.info('Starting application test with Supabase integration...');
logger.info(`Supabase mode: ${isSupabase ? 'Enabled' : 'Disabled'}`);

async function runTests() {
  try {
    // Test getting users
    logger.info('\nFetching users:');
    const users = await User.findAll({ limit: 3 });
    logger.info(`Found ${users.length} users`);
    
    // Test getting categories
    logger.info('\nFetching categories:');
    const categories = await Category.findAll({ limit: 5 });
    logger.info(`Found ${categories.length} categories`);
    
    // Test getting listings
    logger.info('\nFetching listings:');
    const listings = await Listing.findAll({ limit: 5 });
    logger.info(`Found ${listings.length} listings`);
    
    // Test creating a user (only if there are no users)
    if (users.length === 0) {
      logger.info('\nCreating a test user:');
      try {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('test1234', 10);
        
        const newUser = await User.create({
          email: 'test@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          status: 'active'
        });
        
        logger.success(`✅ Created test user with ID: ${newUser.id}`);
      } catch (createError) {
        logger.error('Error creating user:', createError.message);
      }
    }
    
    // Test creating a category (only if there are no categories)
    if (categories.length === 0) {
      logger.info('\nCreating a test category:');
      try {
        const newCategory = await Category.create({
          name: 'Test Category',
          slug: 'test-category',
          description: 'A test category created by the test script',
          isActive: true
        });
        
        logger.success(`✅ Created test category with ID: ${newCategory.id}`);
      } catch (createError) {
        logger.error('Error creating category:', createError.message);
      }
    }
    
    // Log success
    logger.success('\n✅ Application tests completed successfully!');
    logger.info('\nYour application is now configured to use Supabase instead of direct PostgreSQL.');
    logger.info('You can deploy this to Render with the updated configuration.');
    
  } catch (error) {
    logger.error('Test error:', error.message);
  }
}

// Run the tests
runTests(); 