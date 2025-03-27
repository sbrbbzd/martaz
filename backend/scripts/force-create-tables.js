/**
 * Emergency script to directly create tables using raw SQL queries
 * This bypasses any potential Sequelize issues
 */

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.RENDER = 'true';

// Import required modules
const logger = require('../src/utils/logger');
const pg = require('pg');

// Get database config from environment
const dbHost = process.env.DB_HOST || process.env.PGHOST || 'dpg-cvcsk38gph6c739d97cg-a';
const dbPort = process.env.DB_PORT || process.env.PGPORT || '5432';
const dbName = process.env.DB_NAME || process.env.PGDATABASE || 'martaz';
const dbUser = process.env.DB_USERNAME || process.env.DB_USER || process.env.PGUSER || 'martaz_user';
const dbPassword = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'EbGHQceGDGNI94ddo08v3c6Ia4TGMtOK';

// Create a connection pool
const pool = new pg.Pool({
  host: dbHost,
  port: dbPort,
  database: dbName,
  user: dbUser,
  password: dbPassword,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

// SQL queries to create tables in the correct order
const createTableQueries = [
  // Users table (create first as it's a dependency for other tables)
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // Categories table (independent table)
  `CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    parent_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // Listings table (depends on users and categories)
  `CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    user_id INTEGER REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // Create listing_reports table (depends on listings)
  `CREATE TABLE IF NOT EXISTS listing_reports (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES listings(id),
    reporter_id INTEGER REFERENCES users(id),
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`
];

// Function to execute queries in sequence
async function createTables() {
  const client = await pool.connect();
  try {
    logger.info('Starting table creation...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    for (const query of createTableQueries) {
      logger.info(`Executing query: ${query.split('\n')[0]}...`);
      await client.query(query);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    logger.success('✅ All tables created successfully');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    logger.error(`❌ Error creating tables: ${error.message}`);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute the table creation
createTables()
  .then(() => {
    logger.success('🎉 Database initialization completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }); 