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

logger.info('🔧 Starting emergency table creation script');
logger.info(`Database: ${dbName} at ${dbHost}:${dbPort}`);

// SQL queries to create tables in the correct order
const createTableQueries = [
  // First create ENUM types
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
      CREATE TYPE "enum_users_role" AS ENUM ('user', 'admin');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_status') THEN
      CREATE TYPE "enum_users_status" AS ENUM ('active', 'inactive', 'banned');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_listings_currency') THEN
      CREATE TYPE "enum_listings_currency" AS ENUM ('AZN', 'USD', 'EUR');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_listings_condition') THEN
      CREATE TYPE "enum_listings_condition" AS ENUM ('new', 'like-new', 'good', 'fair', 'poor');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_listings_status') THEN
      CREATE TYPE "enum_listings_status" AS ENUM ('active', 'pending', 'sold', 'expired', 'deleted');
    END IF;
  END
  $$;`,

  // Users table - using the actual schema from User.js
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255),
    "role" "enum_users_role" DEFAULT 'user',
    "status" "enum_users_status" DEFAULT 'active',
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    "resetPasswordToken" VARCHAR(255),
    "resetPasswordExpires" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,

  // Categories table - using the actual schema from Category.js
  `CREATE TABLE IF NOT EXISTS "categories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "icon" VARCHAR(255),
    "parentId" UUID,
    "order" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  // Listings table - using the actual schema from Listing.js
  `CREATE TABLE IF NOT EXISTS "listings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10, 2) NOT NULL,
    "currency" "enum_listings_currency" DEFAULT 'AZN' NOT NULL,
    "condition" "enum_listings_condition",
    "location" VARCHAR(255) NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featuredImage" VARCHAR(255),
    "status" "enum_listings_status" DEFAULT 'pending' NOT NULL,
    "isFeatured" BOOLEAN DEFAULT FALSE,
    "featuredUntil" TIMESTAMP WITH TIME ZONE,
    "isPromoted" BOOLEAN DEFAULT FALSE,
    "promotionEndDate" TIMESTAMP WITH TIME ZONE,
    "views" INTEGER DEFAULT 0,
    "contactPhone" VARCHAR(255),
    "contactEmail" VARCHAR(255),
    "attributes" JSONB DEFAULT '{}'::JSONB,
    "expiryDate" TIMESTAMP WITH TIME ZONE,
    "userId" UUID NOT NULL,
    "categoryId" UUID,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "listings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "listings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );`,

  // Listing Reports table 
  `CREATE TABLE IF NOT EXISTS "listing_reports" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "reason" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) DEFAULT 'pending',
    "listingId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "listing_reports_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "listing_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  // Favorites table
  `CREATE TABLE IF NOT EXISTS "favorites" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE ("userId", "listingId")
  );`,

  // SEO Settings table
  `CREATE TABLE IF NOT EXISTS "seo_settings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "pagePath" VARCHAR(255) NOT NULL UNIQUE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "keywords" TEXT,
    "ogTitle" VARCHAR(255),
    "ogDescription" TEXT,
    "ogImage" VARCHAR(255),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
      logger.info(`Executing query: ${query.substring(0, 50)}...`);
      await client.query(query);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    logger.success('✅ All tables created successfully');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    logger.error(`❌ Error creating tables: ${error.message}`);
    logger.error(error.stack);
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