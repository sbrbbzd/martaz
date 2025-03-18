/**
 * Main seeders file - exports a function to run all seeders
 */
const logger = require('../utils/logger');
const seedCategories = require('./seed-categories');
const seedAdminUser = require('./seed-admin');

// Add any additional seeders imports here

/**
 * Run all seeders in the appropriate order
 */
async function runSeeders() {
  try {
    logger.info('Starting database seeding...');
    
    // Run all seeders in sequence
    await seedAdminUser();
    await seedCategories();
    // Add additional seeders here
    
    logger.success('✅ All database seeders completed successfully');
  } catch (error) {
    logger.error(`❌ Error while running seeders: ${error.message}`);
    throw error;
  }
}

// Run seeders if called directly
if (require.main === module) {
  runSeeders()
    .then(() => {
      logger.info('Database seeding completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Failed to seed database:', error);
      process.exit(1);
    });
}

module.exports = {
  run: runSeeders
}; 