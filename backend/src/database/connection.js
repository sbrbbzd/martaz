const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

logger.info('Initializing database connection...');
logger.debug(`Database config: ${config.env} environment, host: ${config.database.host}, port: ${config.database.port}, database: ${config.database.name}`);

// For debugging connection issues
if (config.env === 'production') {
  logger.info('Production environment detected - enabling SSL with relaxed settings');
} else {
  logger.info('Development environment detected - disabling SSL');
}

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    dialectOptions: {
      ssl: config.env === 'production' ? {
        require: true,
        rejectUnauthorized: false // This is necessary for Render's PostgreSQL
      } : false,
      // Add additional options for Render
      application_name: 'mart-az-app'
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false
    },
    // Add retry logic for connection
    retry: {
      max: 3,
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/
      ],
      timeout: 5000
    }
  }
);

// Test connection function
const testConnection = async () => {
  try {
    logger.info('Testing database connection...');
    await sequelize.authenticate();
    logger.success('Database connection has been established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:');
    logger.error(`Error name: ${error.name}`);
    logger.error(`Error message: ${error.message}`);
    
    // Log detailed connection info (without password)
    logger.error(`Connection details: ${config.database.host}:${config.database.port}/${config.database.name} as ${config.database.user}`);
    
    if (error.original) {
      logger.error(`Original error: ${error.original.message}`);
    }
    
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
}; 