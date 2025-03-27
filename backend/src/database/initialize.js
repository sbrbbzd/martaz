/**
 * Direct database initialization script
 * This creates all required tables directly through Sequelize
 */
const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../utils/logger');
const config = require('../config');

// Get database config
const dbHost = process.env.DB_HOST || config.database.host;
const dbPort = process.env.DB_PORT || config.database.port;
const dbName = process.env.DB_NAME || config.database.name;
const dbUser = process.env.DB_USERNAME || process.env.DB_USER || config.database.user;
const dbPassword = process.env.DB_PASSWORD || config.database.password;
const dbUrl = process.env.DATABASE_URL || config.database.url;

logger.info('🔧 Direct database initialization starting...');
logger.info(`Database: ${dbName} at ${dbHost}:${dbPort}`);

// Create Sequelize instance
let sequelize;
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
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    }
  );
}

// Define all models directly here
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned'),
    defaultValue: 'active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'categories',
  timestamps: true
});

const Listing = sequelize.define('Listing', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.ENUM('AZN', 'USD', 'EUR'),
    defaultValue: 'AZN',
    allowNull: false
  },
  condition: {
    type: DataTypes.ENUM('new', 'like-new', 'good', 'fair', 'poor'),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  featuredImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'pending', 'sold', 'expired', 'deleted'),
    defaultValue: 'pending',
    allowNull: false
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  featuredUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isPromoted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  promotionEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  attributes: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'listings',
  timestamps: true
});

const ListingReport = sequelize.define('ListingReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  listingId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  reporterId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'listing_reports',
  timestamps: true
});

const Favorite = sequelize.define('Favorite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  listingId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'favorites',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'listingId']
    }
  ]
});

const SeoSettings = sequelize.define('SeoSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  pagePath: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  keywords: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ogTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ogDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ogImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'seo_settings',
  timestamps: true
});

// Define associations
Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });
Category.hasMany(Category, { foreignKey: 'parentId', as: 'subcategories' });

User.hasMany(Listing, { foreignKey: 'userId', as: 'listings' });
Listing.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Category.hasMany(Listing, { foreignKey: 'categoryId', as: 'listings' });
Listing.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Listing.hasMany(ListingReport, { foreignKey: 'listingId', as: 'reports' });
ListingReport.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });

User.hasMany(ListingReport, { foreignKey: 'reporterId', as: 'reports' });
ListingReport.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });

User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Listing.hasMany(Favorite, { foreignKey: 'listingId', as: 'favoritedBy' });
Favorite.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });

// Function to initialize the database
async function initializeDatabase() {
  try {
    // Test connection first
    logger.info('Testing database connection...');
    await sequelize.authenticate();
    logger.success('✅ Database connection successful');
    
    // Sync all models with force: true to ensure clean start
    logger.info('Creating all tables...');
    await sequelize.sync({ force: true });
    
    logger.success('✅ All tables created successfully');
    
    // Create admin user
    logger.info('Creating admin user...');
    try {
      await User.create({
        email: 'admin@mart.az',
        password: '$2a$10$ywMNY5xyRABjDu/OGtS.XuI5rc2t0RFFRooBr0hQBt2mCpMQYQQPK', // "Admin123!"
        firstName: 'Admin',
        lastName: 'User',
        phone: '+994501234567',
        role: 'admin',
        status: 'active'
      });
      logger.success('✅ Admin user created successfully');
    } catch (error) {
      logger.error(`❌ Failed to create admin user: ${error.message}`);
    }
    
    // Create test category
    logger.info('Creating test category...');
    try {
      const category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        icon: 'laptop',
        isActive: true
      });
      logger.success(`✅ Test category created successfully (ID: ${category.id})`);
    } catch (error) {
      logger.error(`❌ Failed to create test category: ${error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    logger.error(`❌ Database initialization failed: ${error.message}`);
    logger.error(error.stack);
    return { success: false, error };
  }
}

// Export the function
module.exports = {
  initializeDatabase,
  models: {
    User,
    Category,
    Listing,
    ListingReport,
    Favorite,
    SeoSettings
  }
};

// Execute directly if called from command line
if (require.main === module) {
  initializeDatabase()
    .then((result) => {
      if (result.success) {
        logger.success('🎉 Database initialization completed');
        process.exit(0);
      } else {
        logger.error('❌ Database initialization failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error(`❌ Unhandled error: ${error.message}`);
      logger.error(error.stack);
      process.exit(1);
    });
} 