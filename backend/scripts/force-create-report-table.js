const { Sequelize, DataTypes } = require('sequelize');
const config = require('../src/config');
const logger = require('../src/utils/logger');

// Create Sequelize instance
let sequelize;
if (config.database.url) {
  sequelize = new Sequelize(config.database.url, {
    dialect: 'postgres',
    logging: false
  });
} else {
  sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password,
    {
      host: config.database.host,
      port: config.database.port,
      dialect: 'postgres',
      logging: false
    }
  );
}

const createReportTable = async () => {
  try {
    logger.info('Testing database connection...');
    await sequelize.authenticate();
    logger.success('Database connection established successfully.');

    const queryInterface = sequelize.getQueryInterface();
    
    // Check if table already exists
    logger.info('Checking if listing_reports table exists...');
    const tables = await queryInterface.showAllTables();
    
    if (tables.includes('listing_reports')) {
      logger.info('listing_reports table already exists.');
      process.exit(0);
      return;
    }
    
    logger.info('Creating listing_reports table...');
    
    // Create ENUM type first
    try {
      await sequelize.query(`
        CREATE TYPE "enum_listing_reports_status" AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
      `);
      logger.info('Created enum type for status');
    } catch (error) {
      if (error.message.includes('already exists')) {
        logger.info('Enum type already exists, continuing...');
      } else {
        throw error;
      }
    }
    
    // Create the table
    await queryInterface.createTable('listing_reports', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      listingId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'listings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reporterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: false
      },
      additionalInfo: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: 'enum_listing_reports_status',
        defaultValue: 'pending'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    
    // Add indexes
    logger.info('Adding indexes...');
    await queryInterface.addIndex('listing_reports', ['listingId'], {
      name: 'listing_reports_listing_idx'
    });
    
    await queryInterface.addIndex('listing_reports', ['reporterId'], {
      name: 'listing_reports_reporter_idx'
    });
    
    logger.success('Successfully created listing_reports table.');
    process.exit(0);
  } catch (error) {
    logger.error('Error creating listing_reports table:');
    logger.error(error);
    process.exit(1);
  }
};

// Run the function
createReportTable(); 