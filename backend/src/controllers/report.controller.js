const { ListingReport, Listing, User } = require('../models');
const { ApiError } = require('../utils/errors');
const sequelize = require('sequelize');

// Pre-defined list of report reasons
const reportReasons = [
  { id: '1', name: 'Fake or fraudulent listing', description: 'The listing appears to be a scam or fraudulent' },
  { id: '2', name: 'Inappropriate content', description: 'The listing contains inappropriate text, images, or other content' },
  { id: '3', name: 'Prohibited item', description: 'The item being sold is prohibited according to our policies' },
  { id: '4', name: 'Incorrect category', description: 'The listing is posted in the wrong category' },
  { id: '5', name: 'Price gouging', description: 'The price is excessively high compared to market value' },
  { id: '6', name: 'Duplicate listing', description: 'This listing is a duplicate of another listing' },
  { id: '7', name: 'Item unavailable', description: 'The listing is for an item that is not actually available' },
  { id: '8', name: 'Other', description: 'Other issue not listed above' }
];

// Create a new report for a listing
exports.reportListing = async (req, res, next) => {
  try {
    // User must be authenticated to report a listing
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required to report a listing');
    }

    const { listingId, reason, additionalInfo } = req.body;

    // Validate inputs
    if (!listingId) {
      throw new ApiError(400, 'Listing ID is required');
    }
    
    if (!reason) {
      throw new ApiError(400, 'Reason is required');
    }

    // Check if the listing exists
    const listing = await Listing.findByPk(listingId);
    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }

    // Check if user has already reported this listing
    const existingReport = await ListingReport.findOne({
      where: {
        listingId,
        reporterId: req.user.id,
        status: ['pending', 'reviewed'] // Only check for active reports
      }
    });

    if (existingReport) {
      throw new ApiError(400, 'You have already reported this listing and the report is being processed');
    }

    // Create the report
    const report = await ListingReport.create({
      listingId,
      reporterId: req.user.id,
      reason,
      additionalInfo: additionalInfo || null,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Listing reported successfully',
      data: report
    });
  } catch (error) {
    console.error('Error reporting listing:', error);
    next(error);
  }
};

// Get a list of pre-defined report reasons
exports.getReportReasons = (req, res) => {
  res.json({
    success: true,
    data: reportReasons
  });
};

// Get user's report history
exports.getUserReportHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    // User must be authenticated
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required');
    }

    // Build query conditions
    const where = {
      reporterId: req.user.id
    };
    
    if (status) {
      where.status = status;
    }

    // Get reports with listing info
    const reports = await ListingReport.findAndCountAll({
      where,
      include: [
        { 
          model: Listing, 
          as: 'listing',
          attributes: ['id', 'title', 'price', 'images', 'status']
        }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        reports: reports.rows,
        total: reports.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(reports.count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting user report history:', error);
    next(error);
  }
};

// Admin endpoint to get all reported listings
exports.getReportedListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    // Validate if the user is an admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
      throw new ApiError(403, 'Admin access required');
    }

    // Build query conditions
    const where = {};
    if (status) {
      where.status = status;
    }

    // Get reports with listing and reporter info
    const reports = await ListingReport.findAndCountAll({
      where,
      include: [
        { 
          model: Listing, 
          as: 'listing',
          include: [
            { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
          ]
        },
        { 
          model: User, 
          as: 'reporter', 
          attributes: ['id', 'firstName', 'lastName', 'email'] 
        }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        reports: reports.rows,
        total: reports.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(reports.count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting reported listings:', error);
    next(error);
  }
};

// Update the status of a report
exports.updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote, actionTaken } = req.body;
    
    // Validate if the user is an admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
      throw new ApiError(403, 'Admin access required');
    }

    // Validate the status
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid status. Must be one of: pending, reviewed, resolved, dismissed');
    }

    // Find the report
    const report = await ListingReport.findByPk(id);
    if (!report) {
      throw new ApiError(404, 'Report not found');
    }

    // Update the status and add admin note if provided
    report.status = status;
    if (adminNote) {
      report.adminNote = adminNote;
    }
    
    // Record action taken if provided
    if (actionTaken) {
      report.actionTaken = actionTaken;
    }
    
    // Track who made the update and when
    report.lastUpdatedBy = req.user.id;
    report.statusUpdatedAt = new Date();
    
    await report.save();

    // TODO: Send notification to reporter about status change
    // This could be implemented with a notification service

    res.json({
      success: true,
      message: `Report status updated to ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    next(error);
  }
};

// Bulk update report statuses
exports.bulkUpdateReportStatus = async (req, res, next) => {
  try {
    const { reportIds, status, adminNote, actionTaken } = req.body;
    
    // Validate if the user is an admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
      throw new ApiError(403, 'Admin access required');
    }
    
    // Validate required fields
    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      throw new ApiError(400, 'Report IDs are required and must be an array');
    }
    
    // Validate the status
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!status || !validStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid status. Must be one of: pending, reviewed, resolved, dismissed');
    }
    
    // Update reports in a transaction
    const result = await sequelize.transaction(async (t) => {
      // Find all reports
      const reports = await ListingReport.findAll({
        where: {
          id: reportIds
        },
        transaction: t
      });
      
      if (reports.length === 0) {
        throw new ApiError(404, 'No reports found with the provided IDs');
      }
      
      // Update each report
      const updatePromises = reports.map(report => {
        report.status = status;
        if (adminNote) report.adminNote = adminNote;
        if (actionTaken) report.actionTaken = actionTaken;
        report.lastUpdatedBy = req.user.id;
        report.statusUpdatedAt = new Date();
        
        return report.save({ transaction: t });
      });
      
      await Promise.all(updatePromises);
      
      return reports.length;
    });
    
    res.json({
      success: true,
      message: `Successfully updated ${result} reports to status: ${status}`
    });
  } catch (error) {
    console.error('Error performing bulk update of reports:', error);
    next(error);
  }
};

// Get report statistics for admin dashboard
exports.getReportStats = async (req, res, next) => {
  try {
    // Validate if the user is an admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
      throw new ApiError(403, 'Admin access required');
    }
    
    // Get counts by status
    const pendingCount = await ListingReport.count({ where: { status: 'pending' } });
    const reviewedCount = await ListingReport.count({ where: { status: 'reviewed' } });
    const resolvedCount = await ListingReport.count({ where: { status: 'resolved' } });
    const dismissedCount = await ListingReport.count({ where: { status: 'dismissed' } });
    
    // Get most common report reasons (top 5)
    const reportReasonCounts = await ListingReport.findAll({
      attributes: ['reason', [sequelize.fn('COUNT', sequelize.col('reason')), 'count']],
      group: ['reason'],
      order: [[sequelize.fn('COUNT', sequelize.col('reason')), 'DESC']],
      limit: 5,
      raw: true
    });
    
    // Get recent trend (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const dailyReports = await ListingReport.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'day', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [sequelize.Op.gte]: last7Days
        }
      },
      group: [sequelize.fn('date_trunc', 'day', sequelize.col('createdAt'))],
      order: [[sequelize.fn('date_trunc', 'day', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });
    
    res.json({
      success: true,
      data: {
        statusCounts: {
          pending: pendingCount,
          reviewed: reviewedCount,
          resolved: resolvedCount,
          dismissed: dismissedCount,
          total: pendingCount + reviewedCount + resolvedCount + dismissedCount
        },
        topReasons: reportReasonCounts,
        dailyTrend: dailyReports
      }
    });
  } catch (error) {
    console.error('Error fetching report statistics:', error);
    next(error);
  }
}; 