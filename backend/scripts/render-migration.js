/**
 * Specialized migration script for Render deployment
 */

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.RENDER = 'true';

const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
const config = require('../src/config');
const logger = require('../src/utils/logger');

logger.info('🔄 Starting Render migration process');
logger.info(`Environment: ${process.env.NODE_ENV}`);
logger.info('Database config:', {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  // No password for security
});

// Function to delay execution for retry
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create Sequelize instance
let sequelize;
if (config.database.url) {
  logger.info(`Using connection URL: ${config.database.url.replace(/:[^:]*@/, ':****@')}`);
  sequelize = new Sequelize(config.database.url, {
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  logger.info('Using individual connection parameters');
  sequelize = new Sequelize(
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
        }
      }
    }
  );
}

// Configure Umzug to use Sequelize
const umzug = new Umzug({
  migrations: {
    glob: [
      path.join(__dirname, '../src/database/migrations/*.js'),
      path.join(__dirname, '../migrations/*.js')
    ],
    resolve: ({ name, path, context }) => {
      const migration = require(path);
      return {
        name,
        up: async () => migration.up(context.queryInterface, context.Sequelize),
        down: async () => migration.down(context.queryInterface, context.Sequelize),
      };
    },
  },
  context: { queryInterface: sequelize.getQueryInterface(), Sequelize },
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Run migrations with retry logic
async function runMigrations() {
  let connected = false;
  let attempts = 0;
  const maxAttempts = 5;
  
  while (!connected && attempts < maxAttempts) {
    attempts++;
    try {
      logger.info(`Connection attempt ${attempts}/${maxAttempts}...`);
      await sequelize.authenticate();
      connected = true;
      logger.success('✅ Database connection successful');
    } catch (error) {
      logger.error(`❌ Connection attempt ${attempts} failed: ${error.message}`);
      if (attempts < maxAttempts) {
        const delayMs = attempts * 2000;
        logger.info(`Waiting ${delayMs/1000} seconds before next attempt...`);
        await delay(delayMs);
      }
    }
  }
  
  if (!connected) {
    throw new Error(`Failed to connect to database after ${maxAttempts} attempts`);
  }
  
  logger.info('Checking pending migrations...');
  const pending = await umzug.pending();
  
  if (pending.length === 0) {
    logger.info('No pending migrations to run.');
  } else {
    logger.info(`Found ${pending.length} pending migrations: ${pending.map(m => m.name).join(', ')}`);
    const migrations = await umzug.up();
    logger.success(`✅ Executed ${migrations.length} migrations successfully.`);
  }
}

// Execute the migrations
runMigrations()
  .then(() => {
    logger.success('🎉 Migration process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`❌ Migration process failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }); 