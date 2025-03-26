const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const SeoSettings = sequelize.define('SeoSettings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    pageType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of page (global, home, listings, category, etc)'
    },
    pageIdentifier: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Optional identifier for specific pages (like category IDs or static page paths)'
    },
    title: {
      type: DataTypes.STRING(70),
      allowNull: true,
      comment: 'Meta title for the page'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Meta description for the page'
    },
    keywords: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Meta keywords for the page, comma separated'
    },
    ogTitle: {
      type: DataTypes.STRING(70),
      allowNull: true,
      comment: 'Open Graph title'
    },
    ogDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Open Graph description'
    },
    ogImage: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Open Graph image URL'
    },
    twitterTitle: {
      type: DataTypes.STRING(70),
      allowNull: true,
      comment: 'Twitter card title'
    },
    twitterDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Twitter card description'
    },
    twitterImage: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Twitter card image URL'
    },
    canonical: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Canonical URL if needed'
    },
    robotsDirectives: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Robots meta directives (e.g., noindex, nofollow)'
    },
    structuredData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON-LD structured data'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Priority when multiple settings match (higher number = higher priority)'
    }
  }, {
    tableName: 'seo_settings',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['pageType', 'pageIdentifier'],
        where: {
          pageIdentifier: {
            [Op.ne]: null
          }
        },
        name: 'seo_settings_type_identifier_idx'
      }
    ]
  });

  return SeoSettings;
}; 