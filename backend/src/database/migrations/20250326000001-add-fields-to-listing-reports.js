'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('listing_reports', 'adminNote', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Internal notes by admin regarding this report'
    });

    await queryInterface.addColumn('listing_reports', 'lastUpdatedBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User ID of admin who last updated this report'
    });

    await queryInterface.addColumn('listing_reports', 'statusUpdatedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of the last status update'
    });

    await queryInterface.addColumn('listing_reports', 'actionTaken', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Action taken on the listing (e.g., removed, suspended seller, etc.)'
    });

    await queryInterface.addColumn('listing_reports', 'notificationSent', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'Whether notification was sent to the reporter about status changes'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('listing_reports', 'adminNote');
    await queryInterface.removeColumn('listing_reports', 'lastUpdatedBy');
    await queryInterface.removeColumn('listing_reports', 'statusUpdatedAt');
    await queryInterface.removeColumn('listing_reports', 'actionTaken');
    await queryInterface.removeColumn('listing_reports', 'notificationSent');
  }
}; 