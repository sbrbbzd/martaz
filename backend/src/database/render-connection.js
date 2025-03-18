/**
 * Special database connection module for Render.com deployments
 * This helps solve common database connection issues on Render
 */

const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');
const pg = require('pg');

// Log database connection information
logger.info('Initializing Render database connection...');
logger.info(`Database host: ${config.database.host}`);
logger.info(`Database port: ${config.database.port}`);
logger.info(`Database name: ${config.database.name}`);
logger.info(`Database user: ${config.database.user}`);

// Create a native pg pool for direct testing
const pool = new pg.Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20
});

// Test using native pg driver first
const testNativeConnection = async () => {
  let client;
  try {
    logger.info('Testing connection with native pg driver...');
    client = await pool.connect();
    logger.info('Native pg driver connection successful!');
    return true;
  } catch (error) {
    logger.error('Native pg driver connection failed:');
    logger.error(`Error: ${error.message}`);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Create Sequelize instance with special configuration for Render.com
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
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      application_name: 'mart-az-render-app',
      statement_timeout: 10000, // 10s statement timeout
      idle_in_transaction_session_timeout: 10000, // 10s idle timeout
      keepAlive: true
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false
    },
    retry: {
      max: 5, // Maximum retry attempts
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/
      ],
      timeout: 5000 // Timeout before a retry
    }
  }
);

// Test connection function with enhanced error reporting
const testConnection = async () => {
  try {
    logger.info('Testing Sequelize database connection...');
    
    // Try native connection first
    const nativeSuccess = await testNativeConnection();
    if (!nativeSuccess) {
      logger.warn('Native connection failed, trying Sequelize...');
    }
    
    // Now try Sequelize
    await sequelize.authenticate();
    logger.success('✅ Database connection has been established successfully!');
    
    // Run a simple query to further verify
    const [result] = await sequelize.query('SELECT NOW() as time');
    logger.success(`✅ Database query successful, server time: ${result[0].time}`);
    
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:');
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

// Export both the connection and test function
module.exports = {
  sequelize,
  testConnection,
  testNativeConnection,
  pool
}; 