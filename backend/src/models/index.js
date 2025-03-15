const { Sequelize } = require('sequelize');
const config = require('../config');

let sequelize;

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

// Import model definitions
const User = require('./User')(sequelize);
const Listing = require('./Listing')(sequelize);
const Category = require('./Category')(sequelize);

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

module.exports = {
  sequelize,
  User,
  Listing,
  Category
}; 