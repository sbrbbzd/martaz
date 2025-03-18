/**
 * Re-export of admin.routes.js for compatibility
 * This file exists to handle imports like require('./routes/admin')
 */

try {
  // Try to import the admin.routes.js file
  module.exports = require('./admin.routes.js');
} catch (error) {
  console.error('Error importing admin.routes.js:', error.message);
  
  // Provide a minimal router as fallback
  const express = require('express');
  const router = express.Router();
  
  router.get('/', (req, res) => {
    res.status(200).json({
      message: 'Admin API endpoint (fallback)'
    });
  });
  
  module.exports = router;
} 