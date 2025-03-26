'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SeoSettings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      pageType: {
        type: Sequelize.ENUM(
          'global',
          'home',
          'listings',
          'listing_detail',
          'category',
          'user_profile',
          'search',
          'static'
        ),
        allowNull: false
      },
      pageIdentifier: {
        type: Sequelize.STRING,
        allowNull: true
      },
      title: {
        type: Sequelize.STRING(70),
        allowNull: true
      },
      description: {
        type: Sequelize.STRING(160),
        allowNull: true
      },
      keywords: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ogTitle: {
        type: Sequelize.STRING(70),
        allowNull: true
      },
      ogDescription: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      ogImage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      twitterTitle: {
        type: Sequelize.STRING(70),
        allowNull: true
      },
      twitterDescription: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      twitterImage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      canonical: {
        type: Sequelize.STRING,
        allowNull: true
      },
      robotsDirectives: {
        type: Sequelize.STRING,
        allowNull: true
      },
      structuredData: {
        type: Sequelize.JSON,
        allowNull: true
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add unique index for pageType + pageIdentifier to prevent duplicates
    await queryInterface.addIndex('SeoSettings', ['pageType', 'pageIdentifier'], {
      unique: true,
      where: {
        pageIdentifier: { [Sequelize.Op.ne]: null }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('SeoSettings');
  }
}; 