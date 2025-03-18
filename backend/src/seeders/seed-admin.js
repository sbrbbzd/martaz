const { User } = require('../models');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

async function seedAdminUser() {
  try {
    logger.info('Checking for existing admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@mart.az' }
    });
    
    if (existingAdmin) {
      logger.info('Admin user already exists, skipping');
      return;
    }
    
    logger.info('Creating admin user...');
    
    // Generate hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Create admin user
    await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@mart.az',
      password: hashedPassword,
      phone: '+994501234567',
      role: 'admin',
      isActive: true,
      isVerified: true
    });
    
    logger.success('✅ Admin user created successfully');
  } catch (error) {
    logger.error(`❌ Error creating admin user: ${error.message}`);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedAdminUser()
    .then(() => {
      logger.info('Admin user seeding completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Failed to seed admin user:', error);
      process.exit(1);
    });
}

module.exports = seedAdminUser; 