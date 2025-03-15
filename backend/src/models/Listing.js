const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Listing extends Model {
    static associate(models) {
      Listing.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      Listing.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category'
      });
    }
  }

  Listing.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 100]
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 5000]
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
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
      allowNull: true,
      validate: {
        isEmail: true
      }
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
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Listing',
    tableName: 'listings',
    timestamps: true,
    hooks: {
      beforeCreate: (listing) => {
        // Generate slug from title if not provided
        if (!listing.slug) {
          listing.slug = listing.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }
      }
    }
  });

  return Listing;
}; 