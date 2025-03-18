/**
 * Re-export of category.routes.js for compatibility
 * This file exists to handle imports like require('./routes/categories')
 */

try {
  // Try to import the category.routes.js file
  module.exports = require('./category.routes.js');
} catch (error) {
  // Try categoryRoutes.js as fallback
  try {
    module.exports = require('./categoryRoutes.js');
  } catch (error2) {
    console.error('Error importing category routes:', error2.message);
    
    // Provide a minimal router as fallback
    const express = require('express');
    const router = express.Router();
    
    router.get('/', (req, res) => {
      res.status(200).json({
        message: 'Categories API endpoint (fallback)'
      });
    });
    
    module.exports = router;
  }
} 