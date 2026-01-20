'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if columns exist before adding
    const tableInfo = await queryInterface.describeTable('listings');
    
    // Add featuredUntil column to listings table if it doesn't exist
    if (!tableInfo.featuredUntil) {
      await queryInterface.addColumn('listings', 'featuredUntil', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
    
    // Add isFeatured column if it doesn't exist
    if (!tableInfo.isFeatured) {
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
