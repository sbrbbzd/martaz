const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
const config = require('../src/config');
const logger = require('../src/utils/logger');

// Create Sequelize instance using the same configuration as the app
let sequelize;
if (config.database.url) {
  sequelize = new Sequelize(config.database.url, {
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg)
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
      logging: (msg) => logger.debug(msg)
    }
  );
}

// Configure Umzug to use Sequelize
const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, '../src/database/migrations/*.js'),
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

// Run migrations
(async () => {
  try {
    logger.info('Testing database connection...');
    await sequelize.authenticate();
    logger.success('Database connection established successfully.');

    logger.info('Running migrations...');
    const pending = await umzug.pending();
    
    if (pending.length === 0) {
      logger.info('No pending migrations.');
    } else {
      logger.info(`Found ${pending.length} pending migrations: ${pending.map(m => m.name).join(', ')}`);
      const migrations = await umzug.up();
      logger.success(`Executed ${migrations.length} migrations successfully.`);
    }

    process.exit(0);
  } catch (error) {
    logger.error('Error running migrations:');
    logger.error(error);
    process.exit(1);
  }
})(); 