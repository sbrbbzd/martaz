'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add translations column as JSON
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
  },

  async down (queryInterface, Sequelize) {
    // Remove translations column
    await queryInterface.removeColumn('categories', 'translations');
  }
};
