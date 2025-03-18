const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

logger.info('Initializing database connection...');

// EMERGENCY FALLBACK: If config doesn't have database details, use env vars directly
const dbHost = config.database.host || process.env.DB_HOST || process.env.PGHOST || 'localhost';
const dbPort = config.database.port || process.env.DB_PORT || process.env.PGPORT || '5432';
const dbName = config.database.name || process.env.DB_NAME || process.env.PGDATABASE || 'martaz';
const dbUser = config.database.user || process.env.DB_USERNAME || process.env.DB_USER || process.env.PGUSER || 'postgres';
const dbPassword = config.database.password || process.env.DB_PASSWORD || process.env.PGPASSWORD || '';

logger.debug(`Database config: ${config.env} environment, host: ${dbHost}, port: ${dbPort}, database: ${dbName}, user: ${dbUser}`);

// For debugging connection issues
if (config.env === 'production') {
  logger.info('Production environment detected - enabling SSL with relaxed settings');
} else {
  logger.info('Development environment detected - disabling SSL');
}

// Create Sequelize instance
const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  {
    host: dbHost,
    port: dbPort,
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
    logger.error(`Connection details: ${dbHost}:${dbPort}/${dbName} as ${dbUser}`);
    
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