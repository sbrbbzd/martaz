const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

// Check if we're using Supabase
const isSupabase = config.supabase?.enabled || process.env.USE_SUPABASE === 'true';

let sequelize;
let supabaseService;

// Initialize database connection based on mode
if (isSupabase) {
  logger.info('Using Supabase mode for models');
  supabaseService = require('../services/supabase');
} else {
  logger.info('Using Sequelize mode for models');
  // Try to connect using URL first, then fall back to individual config options
  if (config.database.url) {
    sequelize = new Sequelize(config.database.url, {
      dialect: 'postgres',
      logging: false // Set to console.log to see SQL queries
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
        logging: false
      }
    );
  }
}

// Create models based on mode
let User, Listing, Category, Favorite, ListingReport, SeoSettings;

if (isSupabase) {
  // In Supabase mode, create simplified model objects that use our adapter
  
  // User model with Supabase
  User = {
    findOne: (options) => supabaseService.adapters.findOne('users', options),
    findByPk: (id) => supabaseService.adapters.findOne('users', { where: { id } }),
    findAll: (options) => supabaseService.adapters.findAll('users', options),
    create: (data) => supabaseService.adapters.create('users', data),
    update: (data, options) => supabaseService.adapters.update('users', data, options),
    // Add custom methods similar to the Sequelize model
    comparePassword: async (password, user) => {
      const bcrypt = require('bcryptjs');
      return bcrypt.compare(password, user.password);
    }
  };
  
  // Listing model with Supabase
  Listing = {
    findOne: (options) => supabaseService.adapters.findOne('listings', options),
    findByPk: (id) => supabaseService.adapters.findOne('listings', { where: { id } }),
    findAll: (options) => supabaseService.adapters.findAll('listings', options),
    create: (data) => supabaseService.adapters.create('listings', data),
    update: (data, options) => supabaseService.adapters.update('listings', data, options)
  };
  
  // Category model with Supabase
  Category = {
    findOne: (options) => supabaseService.adapters.findOne('categories', options),
    findByPk: (id) => supabaseService.adapters.findOne('categories', { where: { id } }),
    findAll: (options) => supabaseService.adapters.findAll('categories', options),
    create: (data) => supabaseService.adapters.create('categories', data),
    update: (data, options) => supabaseService.adapters.update('categories', data, options)
  };
  
  // Favorite model with Supabase
  Favorite = {
    findOne: (options) => supabaseService.adapters.findOne('favorites', options),
    findByPk: (id) => supabaseService.adapters.findOne('favorites', { where: { id } }),
    findAll: (options) => supabaseService.adapters.findAll('favorites', options),
    create: (data) => supabaseService.adapters.create('favorites', data),
    update: (data, options) => supabaseService.adapters.update('favorites', data, options)
  };
  
  // ListingReport model with Supabase
  ListingReport = {
    findOne: (options) => supabaseService.adapters.findOne('listing_reports', options),
    findByPk: (id) => supabaseService.adapters.findOne('listing_reports', { where: { id } }),
    findAll: (options) => supabaseService.adapters.findAll('listing_reports', options),
    create: (data) => supabaseService.adapters.create('listing_reports', data),
    update: (data, options) => supabaseService.adapters.update('listing_reports', data, options)
  };
  
  // SeoSettings model with Supabase
  SeoSettings = {
    findOne: (options) => supabaseService.adapters.findOne('seo_settings', options),
    findByPk: (id) => supabaseService.adapters.findOne('seo_settings', { where: { id } }),
    findAll: (options) => supabaseService.adapters.findAll('seo_settings', options),
    create: (data) => supabaseService.adapters.create('seo_settings', data),
    update: (data, options) => supabaseService.adapters.update('seo_settings', data, options)
  };
  
} else {
  // Regular Sequelize models
  // Import model definitions
  User = require('./User')(sequelize);
  Listing = require('./Listing')(sequelize);
  Category = require('./Category')(sequelize);
  Favorite = require('./Favorite')(sequelize, Sequelize.DataTypes);
  ListingReport = require('./ListingReport')(sequelize);
  SeoSettings = require('./SeoSettings')(sequelize);

  // Define associations
  User.hasMany(Listing, {
    foreignKey: 'userId',
    as: 'listings'
  });

  Listing.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  Category.hasMany(Listing, {
    foreignKey: 'categoryId',
    as: 'listings'
  });

  Listing.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category'
  });

  // Self-referential relationship for categories (parent-child)
  Category.belongsTo(Category, {
    foreignKey: 'parentId',
    as: 'parent'
  });

  Category.hasMany(Category, {
    foreignKey: 'parentId',
    as: 'subcategories'
  });

  // Favorites associations
  User.belongsToMany(Listing, {
    through: Favorite,
    foreignKey: 'userId',
    otherKey: 'listingId',
    as: 'favoriteListings'
  });

  Listing.belongsToMany(User, {
    through: Favorite,
    foreignKey: 'listingId',
    otherKey: 'userId',
    as: 'userFavorites'
  });

  // Listing Report associations
  Listing.hasMany(ListingReport, {
    foreignKey: 'listingId',
    as: 'reports'
  });

  ListingReport.belongsTo(Listing, {
    foreignKey: 'listingId',
    as: 'listing'
  });

  User.hasMany(ListingReport, {
    foreignKey: 'reporterId',
    as: 'reportedListings'
  });

  ListingReport.belongsTo(User, {
    foreignKey: 'reporterId',
    as: 'reporter'
  });
}

module.exports = {
  sequelize: isSupabase ? supabaseService.supabase : sequelize,
  User,
  Listing,
  Category,
  Favorite,
  ListingReport,
  SeoSettings,
  isSupabase
}; 