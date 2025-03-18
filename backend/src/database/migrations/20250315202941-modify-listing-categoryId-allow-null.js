'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // Modify the categoryId column to allow null values
    await queryInterface.changeColumn('listings', 'categoryId', {
      type: Sequelize.UUID,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // Revert the change - make categoryId required again
    await queryInterface.changeColumn('listings', 'categoryId', {
      type: Sequelize.UUID,
      allowNull: false
    });
  }
};
