'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('categories');

    // Add translations column as JSON if it doesn't exist
    if (!tableInfo.translations) {
      await queryInterface.addColumn('categories', 'translations', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {
          az: null,
          en: null,
          ru: null
        },
        comment: 'Translations for category name in different languages (az, en, ru)'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove translations column
    await queryInterface.removeColumn('categories', 'translations');
  }
};
