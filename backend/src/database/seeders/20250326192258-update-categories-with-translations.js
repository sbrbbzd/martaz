'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Get all existing categories
    const categories = await queryInterface.sequelize.query(
      'SELECT id, name FROM categories',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    // Update each category with translations
    for (const category of categories) {
      // Generate translations based on the original name
      const translations = {
        az: category.name, // Default to keep original name for Azerbaijani
        en: category.name, // English same as original
        ru: null // Russian can be updated manually later
      };
      
      // Update the category with translations
      await queryInterface.sequelize.query(
        `UPDATE categories SET translations = :translations WHERE id = :id`,
        {
          replacements: { 
            id: category.id,
            translations: JSON.stringify(translations)
          },
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    }
  },

  async down (queryInterface, Sequelize) {
    // Reset all translations to null
    await queryInterface.sequelize.query(
      `UPDATE categories SET translations = NULL`,
      { type: Sequelize.QueryTypes.UPDATE }
    );
  }
};
