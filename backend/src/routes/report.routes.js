const express = require('express');
const { 
  reportListing, 
  getReportReasons, 
  getReportedListings, 
  updateReportStatus,
  getUserReportHistory,
  getReportStats
} = require('../controllers/report.controller');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Public route to get report reasons
router.get('/reasons', getReportReasons);

// Protected routes requiring authentication
router.post('/', auth, reportListing);
router.get('/my-reports', auth, getUserReportHistory);

// Admin routes requiring admin privileges
router.get('/admin', [auth, isAdmin], getReportedListings);
router.patch('/admin/:id', [auth, isAdmin], updateReportStatus);
router.get('/stats', [auth, isAdmin], getReportStats);

module.exports = router; 