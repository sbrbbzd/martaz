const express = require('express');
const router = express.Router();

// Basic test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'SEO test router is working'
  });
});

// This endpoint doesn't require any authentication
router.get('/seo-data', async (req, res) => {
  try {
    // Manually query the database to get SEO settings
    const { SeoSettings } = require('../models');
    
    if (!SeoSettings) {
      return res.status(500).json({
        success: false,
        message: 'SeoSettings model not found'
      });
    }
    
    const seoSettings = await SeoSettings.findAll({
      limit: 10
    });
    
    res.json({
      success: true,
      data: seoSettings
    });
  } catch (error) {
    console.error('Error in test SEO route:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

module.exports = router; 