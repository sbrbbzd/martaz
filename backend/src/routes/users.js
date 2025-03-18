/**
 * Re-export of user.routes.js for compatibility
 * This file exists to handle imports like require('./routes/users')
 */

try {
  // Try to import the user.routes.js file
  module.exports = require('./user.routes.js');
} catch (error) {
  console.error('Error importing user.routes.js:', error.message);
  
  // Provide a minimal router as fallback
  const express = require('express');
  const router = express.Router();
  
  router.get('/', (req, res) => {
    res.status(200).json({
      message: 'Users API endpoint (fallback)'
    });
  });
  
  module.exports = router;
} 