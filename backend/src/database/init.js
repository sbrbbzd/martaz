const { sequelize, testConnection } = require('./connection');
const { User, Category, Listing } = require('../models');
const logger = require('../utils/logger');

/**
 * Initialize the database
 * This will sync all models with the database
 */
const initDatabase = async () => {
  try {
    logger.info('Starting database initialization...');
    
    // Test connection first before proceeding
    logger.info('Testing database connection...');
    const connectionSuccessful = await testConnection();
    
    if (!connectionSuccessful) {
      logger.error('❌ Database connection test failed');
      return false;
    }
    
    // Sync models with database
    logger.info('Syncing database models...');
    try {
      await sequelize.sync({ alter: true });
      logger.success('Database synchronized successfully');
    } catch (syncError) {
      logger.error('❌ Failed to sync database models:');
      logger.error(`Error name: ${syncError.name}`);
      logger.error(`Error message: ${syncError.message}`);
      if (syncError.original) {
        logger.error(`Original error: ${syncError.original.message}`);
      }
      return false;
    }
    
    // Check if we need to create initial admin user
    logger.info('Checking for admin user...');
    try {
      const adminCount = await User.count({ where: { role: 'admin' } });
      
      if (adminCount === 0) {
        logger.info('No admin user found. Creating default admin user...');
        await User.create({
          email: 'admin@mart.az',
          password: 'Admin123!',  // Will be hashed by the model
          firstName: 'Admin',
          lastName: 'User',
          phone: '+994501234567',
          role: 'admin',
          status: 'active'
        });
        logger.success('Admin user created successfully');
      } else {
        logger.info(`Found ${adminCount} existing admin user(s)`);
      }
    } catch (userError) {
      logger.error('❌ Failed to check/create admin user:');
      logger.error(`Error: ${userError.message}`);
      // Continue initialization even if admin user creation fails
    }
    
    // Check if we need to create initial categories
    logger.info('Checking for existing categories...');
    try {
      const categoryCount = await Category.count();
      
      if (categoryCount === 0) {
        logger.info('No categories found. Creating initial categories...');
        
        // Create main categories
        logger.debug('Creating main categories...');
        const electronics = await Category.create({
          name: 'Electronics',
          slug: 'electronics',
          description: 'All electronic devices and gadgets',
          icon: 'computer',
          order: 1,
          isActive: true
        });
        
        const vehicles = await Category.create({
          name: 'Vehicles',
          slug: 'vehicles',
          description: 'Cars, motorcycles, and other vehicles',
          icon: 'car',
          order: 2,
          isActive: true
        });
        
        const realEstate = await Category.create({
          name: 'Real Estate',
          slug: 'real-estate',
          description: 'Properties for sale and rent',
          icon: 'home',
          order: 3,
          isActive: true
        });
        
        const jobs = await Category.create({
          name: 'Jobs',
          slug: 'jobs',
          description: 'Job listings and opportunities',
          icon: 'work',
          order: 4,
          isActive: true
        });
        
        // Create subcategories for Electronics
        logger.debug('Creating subcategories for Electronics...');
        await Category.bulkCreate([
          {
            name: 'Smartphones',
            slug: 'smartphones',
            description: 'Mobile phones and accessories',
            icon: 'smartphone',
            parentId: electronics.id,
            order: 1,
            isActive: true
          },
          {
            name: 'Laptops & Computers',
            slug: 'laptops-computers',
            description: 'Laptops, desktops, and accessories',
            icon: 'laptop',
            parentId: electronics.id,
            order: 2,
            isActive: true
          },
          {
            name: 'TVs & Audio',
            slug: 'tvs-audio',
            description: 'Televisions, speakers, and audio equipment',
            icon: 'tv',
            parentId: electronics.id,
            order: 3,
            isActive: true
          }
        ]);
        
        // Create subcategories for Vehicles
        logger.debug('Creating subcategories for Vehicles...');
        await Category.bulkCreate([
          {
            name: 'Cars',
            slug: 'cars',
            description: 'New and used cars',
            icon: 'directions_car',
            parentId: vehicles.id,
            order: 1,
            isActive: true
          },
          {
            name: 'Motorcycles',
            slug: 'motorcycles',
            description: 'Motorcycles and scooters',
            icon: 'motorcycle',
            parentId: vehicles.id,
            order: 2,
            isActive: true
          }
        ]);
        
        logger.success('Initial categories created successfully');
      } else {
        logger.info(`Found ${categoryCount} existing categories`);
      }
    } catch (categoryError) {
      logger.error('❌ Failed to check/create categories:');
      logger.error(`Error: ${categoryError.message}`);
      // Continue initialization even if category creation fails
    }
    
    logger.success('Database initialization completed successfully');
    return true;
  } catch (error) {
    logger.error('❌ Database initialization failed');
    logger.error(`Error name: ${error.name}`);
    logger.error(`Error message: ${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    return false;
  }
};

module.exports = initDatabase; 