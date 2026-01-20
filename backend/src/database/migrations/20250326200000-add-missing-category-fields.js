'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('categories');

        // Add image column if it doesn't exist
        if (!tableInfo.image) {
            await queryInterface.addColumn('categories', 'image', {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'Category image URL'
            });
        }

        // Add metaTitle column if it doesn't exist
        if (!tableInfo.metaTitle) {
            await queryInterface.addColumn('categories', 'metaTitle', {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'SEO meta title'
            });
        }

        // Add metaDescription column if it doesn't exist
        if (!tableInfo.metaDescription) {
            await queryInterface.addColumn('categories', 'metaDescription', {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'SEO meta description'
            });
        }

        // Add attributes column if it doesn't exist
        if (!tableInfo.attributes) {
            await queryInterface.addColumn('categories', 'attributes', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: {},
                comment: 'Custom attributes for the category'
            });
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('categories', 'image');
        await queryInterface.removeColumn('categories', 'metaTitle');
        await queryInterface.removeColumn('categories', 'metaDescription');
        await queryInterface.removeColumn('categories', 'attributes');
    }
};
