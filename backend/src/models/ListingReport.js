const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ListingReport = sequelize.define('ListingReport', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    listingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Listings',
        key: 'id'
      }
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false
    },
    additionalInfo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
      defaultValue: 'pending'
    },
    adminNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Internal notes by admin regarding this report'
    },
    lastUpdatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'User ID of admin who last updated this report'
    },
    statusUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of the last status update'
    },
    actionTaken: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Action taken on the listing (e.g., removed, suspended seller, etc.)'
    },
    notificationSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether notification was sent to the reporter about status changes'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'listing_reports',
    timestamps: true
  });

  return ListingReport;
}; 