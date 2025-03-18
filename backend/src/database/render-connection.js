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

// EMERGENCY FALLBACK: If config doesn't have database details, use env vars directly
const dbHost = config.database.host || process.env.DB_HOST || process.env.PGHOST || 'dpg-cvcsk38gph6c739d97cg-a';
const dbPort = config.database.port || process.env.DB_PORT || process.env.PGPORT || '5432';
const dbName = config.database.name || process.env.DB_NAME || process.env.PGDATABASE || 'martaz';
const dbUser = config.database.user || process.env.DB_USERNAME || process.env.DB_USER || process.env.PGUSER || 'martaz_user';
const dbPassword = config.database.password || process.env.DB_PASSWORD || process.env.PGPASSWORD || 'EbGHQceGDGNI94ddo08v3c6Ia4TGMtOK';

logger.info(`Database host: ${dbHost}`);
logger.info(`Database port: ${dbPort}`);
logger.info(`Database name: ${dbName}`);
logger.info(`Database user: ${dbUser}`);
logger.info(`Database password: ${dbPassword ? '(set)' : '(not set)'}`);

// Create a native pg pool for direct testing
const pool = new pg.Pool({
  host: dbHost,
  port: dbPort,
  database: dbName,
  user: dbUser,
  password: dbPassword,
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
  dbName,
  dbUser,
  dbPassword,
  {
    host: dbHost,
    port: dbPort,
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
    logger.error(`Connection details: ${dbHost}:${dbPort}/${dbName} as ${dbUser}`);
    
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