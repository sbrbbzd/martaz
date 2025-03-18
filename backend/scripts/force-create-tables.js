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

logger.info('🔧 Starting emergency table creation script');
logger.info(`Connecting to database: ${dbHost}:${dbPort}/${dbName} as ${dbUser}`);

// Create client
const client = new pg.Client({
  host: dbHost,
  port: dbPort,
  database: dbName,
  user: dbUser,
  password: dbPassword,
  ssl: {
    rejectUnauthorized: false
  }
});

// SQL queries to create the tables
const createUsersTable = `
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(255),
  "role" VARCHAR(50) DEFAULT 'user',
  "isActive" BOOLEAN DEFAULT true,
  "isVerified" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const createCategoriesTable = `
CREATE TABLE IF NOT EXISTS "categories" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) UNIQUE NOT NULL,
  "description" TEXT,
  "parentId" INTEGER REFERENCES "categories"("id") ON DELETE SET NULL,
  "isActive" BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

// Function to create admin user
const createAdminUser = `
INSERT INTO "users" ("firstName", "lastName", "email", "password", "phone", "role", "isActive", "isVerified")
SELECT 'Admin', 'User', 'admin@mart.az', '$2a$10$OMVdvJSrOa0zN0DuVLPMNuRWs.bmZIu18cdFD3M9jMzHtZMvRv9dO', '+994501234567', 'admin', true, true
WHERE NOT EXISTS (
  SELECT 1 FROM "users" WHERE "email" = 'admin@mart.az'
);
`;

// Create categories
const seedCategories = `
INSERT INTO "categories" ("name", "slug", "description", "isActive", "order")
SELECT 'Electronics', 'electronics', 'Electronic devices and accessories', true, 1
WHERE NOT EXISTS (
  SELECT 1 FROM "categories" WHERE "slug" = 'electronics'
);

INSERT INTO "categories" ("name", "slug", "description", "isActive", "order")
SELECT 'Vehicles', 'vehicles', 'Cars, motorcycles, and other vehicles', true, 2
WHERE NOT EXISTS (
  SELECT 1 FROM "categories" WHERE "slug" = 'vehicles'
);

INSERT INTO "categories" ("name", "slug", "description", "isActive", "order")
SELECT 'Fashion', 'fashion', 'Clothing, shoes, and accessories', true, 3
WHERE NOT EXISTS (
  SELECT 1 FROM "categories" WHERE "slug" = 'fashion'
);

INSERT INTO "categories" ("name", "slug", "description", "isActive", "order")
SELECT 'Home & Garden', 'home-garden', 'Furniture, home decor, and garden supplies', true, 4
WHERE NOT EXISTS (
  SELECT 1 FROM "categories" WHERE "slug" = 'home-garden'
);
`;

// Execute all queries
async function createTables() {
  try {
    // Connect to the database
    await client.connect();
    logger.success('✅ Connected to database');

    // Create tables
    logger.info('Creating users table...');
    await client.query(createUsersTable);
    logger.success('✅ Users table created');

    logger.info('Creating categories table...');
    await client.query(createCategoriesTable);
    logger.success('✅ Categories table created');

    // Seed data
    logger.info('Creating admin user...');
    await client.query(createAdminUser);
    logger.success('✅ Admin user created');

    logger.info('Creating categories...');
    await client.query(seedCategories);
    logger.success('✅ Categories created');

    logger.success('🎉 All tables created successfully');
  } catch (error) {
    logger.error(`❌ Error creating tables: ${error.message}`);
    logger.error(error.stack);
    throw error;
  } finally {
    // Close the connection
    await client.end();
    logger.info('Database connection closed');
  }
}

// Run the function
createTables()
  .then(() => {
    logger.success('🎉 Database initialization completed successfully');
    process.exit(0);
  })
  .catch(error => {
    logger.error(`❌ Database initialization failed: ${error.message}`);
    process.exit(1);
  }); 