'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Define proper Azerbaijani translations for categories
    const categoryTranslations = {
      'Electronics': { az: 'Elektronika', en: 'Electronics', ru: null },
      'Vehicles': { az: 'Nəqliyyat', en: 'Vehicles', ru: null },
      'Fashion': { az: 'Moda', en: 'Fashion', ru: null },
      'Home & Garden': { az: 'Ev və Bağ', en: 'Home & Garden', ru: null },
      'Smartphones': { az: 'Smartfonlar', en: 'Smartphones', ru: null },
      'Laptops': { az: 'Noutbuklar', en: 'Laptops', ru: null },
      'Cars': { az: 'Avtomobillər', en: 'Cars', ru: null },
      'Motorcycles': { az: 'Motosikletlər', en: 'Motorcycles', ru: null },
      'Men\'s Clothing': { az: 'Kişi Geyimləri', en: 'Men\'s Clothing', ru: null },
      'Women\'s Clothing': { az: 'Qadın Geyimləri', en: 'Women\'s Clothing', ru: null },
      'Furniture': { az: 'Mebel', en: 'Furniture', ru: null },
      'Test': { az: 'Test', en: 'Test', ru: null }
    };
    
    // Fetch all categories to update translations
    const categories = await queryInterface.sequelize.query(
      'SELECT id, name, translations FROM categories',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log(`Found ${categories.length} categories to update`);
    
    for (const category of categories) {
      console.log(`Updating category: ${category.name}, current translations:`, category.translations);
      
      // Get the proper translations for this category from our mapping
      const properTranslations = categoryTranslations[category.name];
      
      if (properTranslations) {
        console.log(`Setting proper translations for ${category.name}:`, properTranslations);
        
        // Update the category with proper translations
        await queryInterface.sequelize.query(
          `UPDATE categories SET translations = :translations WHERE id = :id`,
          {
            replacements: { 
              id: category.id,
              translations: JSON.stringify(properTranslations)
            },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      } else {
        console.log(`No proper translations defined for ${category.name}, keeping existing values`);
      }
    }
    
    // Log final state of categories
    const updatedCategories = await queryInterface.sequelize.query(
      'SELECT name, translations FROM categories',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('Updated categories with translations:');
    for (const category of updatedCategories) {
      console.log(`- ${category.name}:`, category.translations);
    }
  },

  async down (queryInterface, Sequelize) {
    // Revert to using English names for all languages
    const categories = await queryInterface.sequelize.query(
      'SELECT id, name FROM categories',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    for (const category of categories) {
      const defaultTranslations = {
        az: category.name,
        en: category.name,
        ru: null
      };
      
      await queryInterface.sequelize.query(
        `UPDATE categories SET translations = :translations WHERE id = :id`,
        {
          replacements: { 
            id: category.id,
            translations: JSON.stringify(defaultTranslations)
          },
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    }
  }
};
