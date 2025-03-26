const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seo.controller');
const { validateCreateSeoSettings, validateUpdateSeoSettings } = require('../validations/seo.validation');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// Debug route - no auth required
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'SEO routes are working'
  });
});

// Sitemap routes - publicly accessible
router.get('/sitemap.xml', seoController.generateSitemap);
router.get('/:lang/sitemap.xml', seoController.generateSitemap);

// Temporarily disabled authentication for all SEO routes
// TODO: Re-enable authentication when testing is complete
// router.use(authenticate, isAdmin);

// Get all SEO settings
router.get('/', seoController.getAllSeoSettings);

// Get available page types and categories for SEO settings
router.get('/available-pages', seoController.getAvailablePages);

// Get SEO settings by page type and identifier
router.get('/by-page', seoController.getSeoSettingsByPage);

// Get SEO settings by ID
router.get('/:id', seoController.getSeoSettingsById);

// Create new SEO settings
router.post('/', validateCreateSeoSettings, seoController.createSeoSettings);

// Update SEO settings
router.put('/:id', validateUpdateSeoSettings, seoController.updateSeoSettings);

// Delete SEO settings
router.delete('/:id', seoController.deleteSeoSettings);

module.exports = router; 