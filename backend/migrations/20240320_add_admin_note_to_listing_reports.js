'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('listing_reports', 'adminNote', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Internal notes by admin regarding this report'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('listing_reports', 'adminNote');
  }
}; 