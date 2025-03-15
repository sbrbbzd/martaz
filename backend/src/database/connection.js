const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

logger.info('Initializing database connection...');
logger.debug(`Database config: ${config.env} environment, host: ${config.database.host}, port: ${config.database.port}, database: ${config.database.name}`);

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
        rejectUnauthorized: false
      } : false
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
    logger.error('Unable to connect to the database:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
}; 