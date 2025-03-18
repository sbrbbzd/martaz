'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add featuredUntil column to listings table
    await queryInterface.addColumn('listings', 'featuredUntil', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    // Check if isFeatured column exists
    const tableInfo = await queryInterface.describeTable('listings');
    if (!tableInfo.isFeatured) {
      // Add isFeatured column if it doesn't exist
      await queryInterface.addColumn('listings', 'isFeatured', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove featuredUntil column
    await queryInterface.removeColumn('listings', 'featuredUntil');
    
    // We don't remove the isFeatured column in down migration
    // since it might have existed before
  }
};
