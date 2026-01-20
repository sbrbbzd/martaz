'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tables = await queryInterface.showAllTables();
    if (tables.includes('favorites')) {
      console.log('favorites table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('favorites', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      itemId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      itemType: {
        type: Sequelize.ENUM('product', 'listing'),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add a unique constraint to prevent duplicate favorites
    await queryInterface.addIndex('favorites', ['userId', 'itemId', 'itemType'], {
      unique: true,
      name: 'favorites_unique_constraint',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('favorites');
  },
}; 