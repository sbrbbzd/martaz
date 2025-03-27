/**
 * Direct database initialization module
 * This will be loaded at the very beginning of the application
 */
const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../utils/logger');

// Get database config directly from environment variables
const dbHost = process.env.DB_HOST || process.env.DATABASE_HOST || process.env.PGHOST;
const dbPort = process.env.DB_PORT || process.env.DATABASE_PORT || process.env.PGPORT || 5432;
const dbName = process.env.DB_NAME || process.env.DATABASE_NAME || process.env.PGDATABASE;
const dbUser = process.env.DB_USERNAME || process.env.DB_USER || process.env.PGUSER;
const dbPassword = process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || process.env.PGPASSWORD;
const dbUrl = process.env.DATABASE_URL;

logger.info('🚀 Direct database initialization module loaded');

// Create a function that initializes the database
async function initializeDatabase() {
  logger.info('🔧 Starting direct database initialization...');
  logger.info(`Database: ${dbName} at ${dbHost}:${dbPort}`);
  
  // Skip in development mode unless forced
  if (process.env.NODE_ENV !== 'production' && process.env.FORCE_INIT !== 'true') {
    logger.info('Skipping direct initialization in development mode');
    return { success: true, skipped: true };
  }
  
  // Create Sequelize instance
  let sequelize;
  try {
    if (dbUrl) {
      logger.info('Using database connection URL');
      sequelize = new Sequelize(dbUrl, {
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
        dbName,
        dbUser,
        dbPassword,
        {
          host: dbHost,
          port: dbPort,
          dialect: 'postgres',
          logging: (msg) => logger.debug(msg),
          dialectOptions: {
            ssl: process.env.NODE_ENV === 'production' ? {
              require: true,
              rejectUnauthorized: false
            } : false
          }
        }
      );
    }
  } catch (error) {
    logger.error(`❌ Failed to create Sequelize instance: ${error.message}`);
    return { success: false, error };
  }
  
  // Test connection
  try {
    logger.info('Testing database connection...');
    await sequelize.authenticate();
    logger.success('✅ Database connection successful');
  } catch (error) {
    logger.error(`❌ Database connection failed: ${error.message}`);
    return { success: false, error };
  }
  
  // Create raw SQL queries to create tables directly
  // This ensures the tables exist before any ORM operations
  const createTablesSQL = `
  -- First create ENUM types
  DO $$
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
  $$;

  -- Users table
  CREATE TABLE IF NOT EXISTS "users" (
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
  );

  -- Categories table
  CREATE TABLE IF NOT EXISTS "categories" (
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
    CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") 
      REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  -- Listings table
  CREATE TABLE IF NOT EXISTS "listings" (
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
    CONSTRAINT "listings_userId_fkey" FOREIGN KEY ("userId") 
      REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "listings_categoryId_fkey" FOREIGN KEY ("categoryId") 
      REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );

  -- Listing Reports table
  CREATE TABLE IF NOT EXISTS "listing_reports" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "reason" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) DEFAULT 'pending',
    "listingId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "listing_reports_listingId_fkey" FOREIGN KEY ("listingId") 
      REFERENCES "listings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "listing_reports_reporterId_fkey" FOREIGN KEY ("reporterId") 
      REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  -- Favorites table
  CREATE TABLE IF NOT EXISTS "favorites" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") 
      REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_listingId_fkey" FOREIGN KEY ("listingId") 
      REFERENCES "listings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE ("userId", "listingId")
  );

  -- SEO Settings table
  CREATE TABLE IF NOT EXISTS "seo_settings" (
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
  );
  `;
  
  // Create admin user SQL
  const createAdminUserSQL = `
  INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "phone", "role", "status")
  SELECT gen_random_uuid(), 'admin@mart.az', '$2a$10$ywMNY5xyRABjDu/OGtS.XuI5rc2t0RFFRooBr0hQBt2mCpMQYQQPK', 'Admin', 'User', '+994501234567', 'admin', 'active'
  WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "email" = 'admin@mart.az');
  `;
  
  // Create sample category SQL
  const createSampleCategorySQL = `
  INSERT INTO "categories" ("id", "name", "slug", "description", "icon", "isActive")
  SELECT gen_random_uuid(), 'Electronics', 'electronics', 'Electronic devices and gadgets', 'laptop', true
  WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "slug" = 'electronics');
  `;
  
  // Execute SQL directly for maximum reliability
  try {
    // Begin transaction
    await sequelize.transaction(async (transaction) => {
      // Create tables
      logger.info('Creating database tables...');
      await sequelize.query(createTablesSQL, { transaction });
      logger.success('✅ Tables created successfully');
      
      // Create admin user
      logger.info('Creating admin user...');
      await sequelize.query(createAdminUserSQL, { transaction });
      logger.success('✅ Admin user created or already exists');
      
      // Create sample category
      logger.info('Creating sample category...');
      await sequelize.query(createSampleCategorySQL, { transaction });
      logger.success('✅ Sample category created or already exists');
    });
    
    logger.success('✅ Database initialization completed successfully');
    return { success: true };
  } catch (error) {
    logger.error(`❌ Failed to initialize database: ${error.message}`);
    logger.error(error.stack);
    return { success: false, error };
  } finally {
    // Close the connection
    try {
      await sequelize.close();
    } catch (error) {
      logger.error(`❌ Error closing connection: ${error.message}`);
    }
  }
}

// Export the initialization function
module.exports = {
  initializeDatabase
};

// Run directly if this module is executed standalone
if (require.main === module) {
  initializeDatabase()
    .then(result => {
      if (result.success) {
        if (result.skipped) {
          logger.info('Database initialization skipped');
        } else {
          logger.success('🎉 Database initialized successfully');
        }
        process.exit(0);
      } else {
        logger.error('❌ Database initialization failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error(`❌ Unhandled error: ${error.message}`);
      logger.error(error.stack);
      process.exit(1);
    });
} 