module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define('Favorite', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    itemType: {
      type: DataTypes.ENUM('product', 'listing'),
      allowNull: false,
    },
    listingId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'listings',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'favorites',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'itemId', 'itemType'],
        name: 'favorites_unique_constraint',
      },
      {
        fields: ['listingId'],
        name: 'favorites_listingId_idx',
      },
    ],
    hooks: {
      beforeCreate: (favorite) => {
        // Set listingId automatically when the itemType is 'listing'
        if (favorite.itemType === 'listing' && favorite.itemId) {
          favorite.listingId = favorite.itemId;
        }
      },
      beforeUpdate: (favorite) => {
        // Update listingId when itemType is changed to 'listing'
        if (favorite.itemType === 'listing' && favorite.itemId) {
          favorite.listingId = favorite.itemId;
        } else if (favorite.itemType !== 'listing') {
          favorite.listingId = null;
        }
      },
    },
  });

  Favorite.associate = (models) => {
    Favorite.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    
    Favorite.belongsTo(models.Listing, {
      foreignKey: 'listingId',
      as: 'listing',
    });
  };

  return Favorite;
}; 