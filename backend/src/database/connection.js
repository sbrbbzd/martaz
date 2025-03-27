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
const useSSL = config.database.ssl || process.env.DB_SSL === 'true' || config.env === 'production';

logger.debug(`Database config: ${config.env} environment, host: ${dbHost}, port: ${dbPort}, database: ${dbName}, user: ${dbUser}`);
logger.debug(`SSL enabled: ${useSSL}`);

// For debugging connection issues
if (useSSL) {
  logger.info('SSL enabled for database connection with relaxed settings');
} else {
  logger.info('SSL disabled for database connection');
}

// Check for Supabase host
const isSupabase = dbHost && dbHost.includes('supabase.co');
if (isSupabase) {
  logger.info('Supabase database detected - configuring connection accordingly');
}

// For Supabase, use the connection string format
let dbConfig;
if (isSupabase) {
  // Use direct connection string for Supabase
  const connectionString = `postgres://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;
  dbConfig = {
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
  
  logger.debug(`Using connection string format for Supabase`);
  
  // Create sequelize instance with connection string
  sequelize = new Sequelize(connectionString, dbConfig);
} else {
  // Standard connection for other databases
  sequelize = new Sequelize(
    dbName,
    dbUser,
    dbPassword,
    {
      host: dbHost,
      port: dbPort,
      dialect: 'postgres',
      logging: (msg) => logger.debug(msg),
      dialectOptions: {
        ssl: useSSL ? {
          require: true,
          rejectUnauthorized: false
        } : false,
        // Add additional options
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
}

// Test connection function
const testConnection = async () => {
  try {
    logger.info('Testing database connection...');
    await sequelize.authenticate();
    logger.success('Database connection has been established successfully.');
    
    if (isSupabase) {
      logger.info('Successfully connected to Supabase PostgreSQL database');
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to the database:');
    logger.error(`❌ Error name: ${error.name}`);
    logger.error(`❌ Error message: ${error.message}`);
    
    // Log detailed connection info (without password)
    logger.error(`❌ Connection details: ${dbHost}:${dbPort}/${dbName} as ${dbUser}`);
    
    if (error.original) {
      logger.error(`❌ Original error: ${error.original.message}`);
    }
    
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
}; 