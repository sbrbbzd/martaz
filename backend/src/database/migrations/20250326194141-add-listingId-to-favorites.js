'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('favorites');

    // 1. Add the listingId column if it doesn't exist
    if (!tableInfo.listingId) {
      await queryInterface.addColumn('favorites', 'listingId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'listings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      // 2. Update the listingId values from existing itemId values where itemType is 'listing'
      await queryInterface.sequelize.query(`
        UPDATE favorites 
        SET "listingId" = "itemId" 
        WHERE "itemType" = 'listing'
      `);
    }

    // 3. Add an index on listingId if it doesn't exist
    const indexes = await queryInterface.showIndex('favorites');
    const indexExists = indexes.some(index => index.name === 'favorites_listingId_idx');

    if (!indexExists && tableInfo.listingId) {
      await queryInterface.addIndex('favorites', ['listingId'], {
        name: 'favorites_listingId_idx'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // 1. Remove the index
    await queryInterface.removeIndex('favorites', 'favorites_listingId_idx');

    // 2. Remove the column
    await queryInterface.removeColumn('favorites', 'listingId');
  }
};
