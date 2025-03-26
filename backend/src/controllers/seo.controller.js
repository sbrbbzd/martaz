const { SeoSettings, Category, Listing, User } = require('../models');
const { ApiError } = require('../utils/errors');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { Sequelize } = require('sequelize');

/**
 * Get all SEO settings or filter by page type
 */
exports.getAllSeoSettings = async (req, res, next) => {
  try {
    const { pageType } = req.query;
    const where = pageType ? { pageType } : {};
    
    const seoSettings = await SeoSettings.findAll({
      where,
      order: [['pageType', 'ASC'], ['createdAt', 'DESC']]
    });
    
    res.json({ success: true, data: seoSettings });
  } catch (error) {
    logger.error('Error fetching SEO settings:', error);
    next(error);
  }
};

/**
 * Get SEO settings by ID
 */
exports.getSeoSettingsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seoSettings = await SeoSettings.findByPk(id);
    
    if (!seoSettings) {
      throw new ApiError(404, 'SEO settings not found');
    }
    
    res.json({ success: true, data: seoSettings });
  } catch (error) {
    logger.error('Error fetching SEO settings by ID:', error);
    next(error);
  }
};

/**
 * Get SEO settings for a specific page type and identifier
 */
exports.getSeoSettingsByPage = async (req, res, next) => {
  try {
    const { pageType, pageIdentifier } = req.query;
    
    if (!pageType) {
      throw new ApiError(400, 'Page type is required');
    }
    
    const where = { pageType };
    if (pageIdentifier) where.pageIdentifier = pageIdentifier;
    
    let seoSettings = await SeoSettings.findOne({
      where,
      order: [['priority', 'DESC']]
    });
    
    // Fallback to page type default if no specific settings
    if (!seoSettings && pageIdentifier) {
      seoSettings = await SeoSettings.findOne({
        where: { pageType, pageIdentifier: null },
        order: [['priority', 'DESC']]
      });
    }
    
    // Fallback to global defaults
    if (!seoSettings) {
      seoSettings = await SeoSettings.findOne({
        where: { pageType: 'global', pageIdentifier: null },
        order: [['priority', 'DESC']]
      });
    }
    
    res.json({ success: true, data: seoSettings });
  } catch (error) {
    logger.error('Error fetching SEO settings by page:', error);
    next(error);
  }
};

/**
 * Create new SEO settings
 */
exports.createSeoSettings = async (req, res, next) => {
  try {
    const {
      pageType, pageIdentifier, title, description, keywords,
      ogTitle, ogDescription, ogImage, twitterTitle, twitterDescription,
      twitterImage, canonical, robotsDirectives, structuredData, priority
    } = req.body;
    
    // Check for existing settings
    if (pageIdentifier) {
      const existing = await SeoSettings.findOne({
        where: { pageType, pageIdentifier }
      });
      
      if (existing) {
        throw new ApiError(400, 'SEO settings already exist for this page');
      }
    } else if (pageType === 'global') {
      const existingGlobal = await SeoSettings.findOne({
        where: { pageType: 'global', pageIdentifier: null }
      });
      
      if (existingGlobal) {
        throw new ApiError(400, 'Global SEO settings already exist. Please update existing settings.');
      }
    }
    
    // Create settings
    const seoSettings = await SeoSettings.create({
      pageType, pageIdentifier, title, description, keywords,
      ogTitle, ogDescription, ogImage, twitterTitle, twitterDescription,
      twitterImage, canonical, robotsDirectives, structuredData,
      priority: priority || 0
    });
    
    res.status(201).json({
      success: true,
      message: 'SEO settings created successfully',
      data: seoSettings
    });
  } catch (error) {
    logger.error('Error creating SEO settings:', error);
    next(error);
  }
};

/**
 * Update existing SEO settings
 */
exports.updateSeoSettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seoSettings = await SeoSettings.findByPk(id);
    
    if (!seoSettings) {
      throw new ApiError(404, 'SEO settings not found');
    }
    
    await seoSettings.update(req.body);
    
    res.json({
      success: true,
      message: 'SEO settings updated successfully',
      data: seoSettings
    });
  } catch (error) {
    logger.error('Error updating SEO settings:', error);
    next(error);
  }
};

/**
 * Delete SEO settings
 */
exports.deleteSeoSettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seoSettings = await SeoSettings.findByPk(id);
    
    if (!seoSettings) {
      throw new ApiError(404, 'SEO settings not found');
    }
    
    if (seoSettings.pageType === 'global' && !seoSettings.pageIdentifier) {
      throw new ApiError(400, 'Cannot delete global SEO settings');
    }
    
    await seoSettings.destroy();
    
    res.json({
      success: true,
      message: 'SEO settings deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting SEO settings:', error);
    next(error);
  }
};

/**
 * Get available pages and categories for SEO settings
 */
exports.getAvailablePages = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'slug'],
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    
    const staticPages = [
      { id: 'about', name: 'About Us', path: '/about' },
      { id: 'contact', name: 'Contact Us', path: '/contact' },
      { id: 'terms', name: 'Terms of Service', path: '/terms' },
      { id: 'privacy', name: 'Privacy Policy', path: '/privacy' },
      { id: 'faq', name: 'FAQ', path: '/faq' }
    ];
    
    res.json({
      success: true,
      data: {
        pageTypes: [
          { id: 'global', name: 'Global Settings' },
          { id: 'home', name: 'Homepage' },
          { id: 'listings', name: 'Listings Pages' },
          { id: 'listing_detail', name: 'Listing Detail Pages' },
          { id: 'category', name: 'Category Pages' },
          { id: 'user_profile', name: 'User Profile Pages' },
          { id: 'search', name: 'Search Results Pages' },
          { id: 'static', name: 'Static Pages' }
        ],
        categories,
        staticPages
      }
    });
  } catch (error) {
    logger.error('Error fetching available pages:', error);
    next(error);
  }
};

/**
 * Generate dynamic sitemap with language support
 */
exports.generateSitemap = async (req, res, next) => {
  try {
    const { lang } = req.params;
    const baseUrl = process.env.FRONTEND_URL || 'https://mart.az';
    const supportedLanguages = ['az', 'en', 'ru'];
    const currentLang = lang && supportedLanguages.includes(lang) ? lang : 'az';
    
    // Start XML content
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
    
    // Add homepage
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${currentLang !== 'az' ? '/' + currentLang : ''}/</loc>\n`;
    
    // Add language alternates for homepage
    supportedLanguages.forEach(lang => {
      const langPath = lang === 'az' ? '' : '/' + lang;
      xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}${langPath}/" />\n`;
    });
    
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';
    
    // Add static pages
    const staticPages = [
      { path: 'about', priority: 0.8, changefreq: 'monthly' },
      { path: 'contact', priority: 0.8, changefreq: 'monthly' },
      { path: 'categories', priority: 0.9, changefreq: 'weekly' },
      { path: 'terms', priority: 0.7, changefreq: 'monthly' },
      { path: 'privacy', priority: 0.7, changefreq: 'monthly' },
      { path: 'faq', priority: 0.8, changefreq: 'monthly' }
    ];
    
    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${currentLang !== 'az' ? '/' + currentLang : ''}/${page.path}</loc>\n`;
      
      // Add language alternates for static pages
      supportedLanguages.forEach(lang => {
        const langPath = lang === 'az' ? '' : '/' + lang;
        xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}${langPath}/${page.path}" />\n`;
      });
      
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });
    
    // Add category pages
    const categories = await Category.findAll({
      where: { isActive: true }
    });
    
    for (const category of categories) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${currentLang !== 'az' ? '/' + currentLang : ''}/listings?category=${category.slug}</loc>\n`;
      
      // Add language alternates for category pages
      supportedLanguages.forEach(lang => {
        const langPath = lang === 'az' ? '' : '/' + lang;
        xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}${langPath}/listings?category=${category.slug}" />\n`;
      });
      
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }
    
    // Add listing pages (active listings only, limit to most recent 1000)
    const listings = await Listing.findAll({
      where: { 
        status: 'active',
        isApproved: true,
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['updatedAt', 'DESC']],
      limit: 1000
    });
    
    for (const listing of listings) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${currentLang !== 'az' ? '/' + currentLang : ''}/listing/${listing.slug}</loc>\n`;
      xml += `    <lastmod>${new Date(listing.updatedAt).toISOString().split('T')[0]}</lastmod>\n`;
      
      // Add language alternates for listing pages
      supportedLanguages.forEach(lang => {
        const langPath = lang === 'az' ? '' : '/' + lang;
        xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}${langPath}/listing/${listing.slug}" />\n`;
      });
      
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }
    
    // Close XML
    xml += '</urlset>';
    
    // Send response
    res.header('Content-Type', 'application/xml');
    res.send(xml);
    
  } catch (error) {
    logger.error('Error generating sitemap:', error);
    next(error);
  }
}; 