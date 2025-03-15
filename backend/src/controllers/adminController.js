const { User, Listing, Category, Message, Conversation } = require('../models');
const { ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { sequelize } = require('../database/connection');
const bcrypt = require('bcryptjs');

/**
 * Get admin dashboard statistics
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get current date range for today's stats
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get user statistics
    const totalUsers = await User.count();
    const newUsersToday = await User.count({
      where: {
        createdAt: {
          [Op.gte]: startOfDay
        }
      }
    });
    
    // Get listing statistics
    const totalListings = await Listing.count();
    const activeListings = await Listing.count({
      where: {
        status: 'active'
      }
    });
    const pendingListings = await Listing.count({
      where: {
        status: 'pending'
      }
    });
    
    // Get other statistics
    const totalCategories = await Category.count();
    const reportedListings = await Listing.count({
      where: {
        status: 'reported'
      }
    });
    const messagesSent = await Message.count();
    
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          newUsersToday,
          totalListings,
          activeListings,
          pendingListings,
          totalCategories,
          reportedListings,
          messagesSent
        }
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    next(error);
  }
};

/**
 * Get recent activity for admin dashboard
 */
exports.getRecentActivity = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get recent user registrations
    const recentUsers = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });
    
    // Get recent listings
    const recentListings = await Listing.findAll({
      attributes: ['id', 'title', 'status', 'createdAt', 'userId'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });
    
    // Combine and sort activity by date
    const activity = [
      ...recentUsers.map(user => ({
        type: 'user',
        action: 'registered',
        id: user.id,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        timestamp: user.createdAt
      })),
      ...recentListings.map(listing => ({
        type: 'listing',
        action: 'created',
        id: listing.id,
        title: listing.title,
        status: listing.status,
        user: {
          id: listing.user.id,
          firstName: listing.user.firstName,
          lastName: listing.user.lastName
        },
        category: listing.category.name,
        timestamp: listing.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        activity
      }
    });
  } catch (error) {
    logger.error('Get recent activity error:', error);
    next(error);
  }
};

/**
 * Get pending listings for admin approval
 */
exports.getPendingListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;
    
    // Get pending listings
    const { count, rows } = await Listing.findAndCountAll({
      where: {
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: limitNum,
      offset
    });
    
    const totalPages = Math.ceil(count / limitNum);
    
    res.json({
      success: true,
      data: {
        listings: rows,
        pagination: {
          total: count,
          page: pageNum,
          totalPages,
          limit: limitNum,
          hasMore: pageNum < totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Get pending listings error:', error);
    next(error);
  }
};

/**
 * Approve a listing
 */
exports.approveListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the listing
    const listing = await Listing.findByPk(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }
    
    // Check if the listing is pending
    if (listing.status !== 'pending') {
      throw new ValidationError('Only pending listings can be approved');
    }
    
    // Update listing status
    await listing.update({
      status: 'active',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });
    
    res.json({
      success: true,
      message: 'Listing approved successfully',
      data: {
        listing
      }
    });
  } catch (error) {
    logger.error('Approve listing error:', error);
    next(error);
  }
};

/**
 * Reject a listing
 */
exports.rejectListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Find the listing
    const listing = await Listing.findByPk(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }
    
    // Update listing status
    await listing.update({
      status: 'rejected',
      rejectionReason: reason || 'Listing does not meet our guidelines'
    });
    
    res.json({
      success: true,
      message: 'Listing rejected successfully',
      data: {
        listing
      }
    });
  } catch (error) {
    logger.error('Reject listing error:', error);
    next(error);
  }
};

/**
 * Get all users with pagination and filters
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;
    
    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;
    
    // Build where clause
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    if (status) {
      where.status = status;
    }
    
    // Get users
    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
      where,
      order: [[sortBy, sortOrder]],
      limit: limitNum,
      offset
    });
    
    const totalPages = Math.ceil(count / limitNum);
    
    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page: pageNum,
          totalPages,
          limit: limitNum,
          hasMore: pageNum < totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    next(error);
  }
};

/**
 * Get user by ID with their listings
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the user
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
    });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Get user's listings count
    const listingsCount = await Listing.count({
      where: { userId: id }
    });
    
    // Get user's messages count
    const messagesCount = await Message.count({
      where: {
        [Op.or]: [
          { senderId: id },
          { receiverId: id }
        ]
      }
    });
    
    // Get user data with counts
    const userData = {
      ...user.toJSON(),
      listingsCount,
      messagesCount
    };
    
    res.json({
      success: true,
      data: {
        user: userData
      }
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    next(error);
  }
};

/**
 * Update user status (activate, suspend, etc.)
 */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      throw new ValidationError('Invalid status value');
    }
    
    // Find the user
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Cannot modify other admins if you're not a super admin
    if (user.role === 'admin' && req.user.role !== 'superadmin') {
      throw new ValidationError('You do not have permission to modify another admin');
    }
    
    // Update user status
    await user.update({ status });
    
    res.json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : status === 'inactive' ? 'deactivated' : 'suspended'} successfully`,
      data: {
        user: {
          id: user.id,
          status: user.status
        }
      }
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    next(error);
  }
};

/**
 * Create a new admin user
 */
exports.createAdminUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Check if the current user is a super admin
    if (req.user.role !== 'superadmin') {
      throw new ValidationError('Only super admins can create new admin users');
    }
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ValidationError('Email is already registered');
    }
    
    // Create new admin user
    const user = await User.create({
      email,
      password, // Will be hashed in the model hook
      firstName,
      lastName,
      phone,
      role: 'admin',
      status: 'active'
    });
    
    // Return user data (excluding password)
    const userData = user.toJSON();
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        user: userData
      }
    });
  } catch (error) {
    logger.error('Create admin user error:', error);
    next(error);
  }
};

/**
 * Get site settings
 */
exports.getSiteSettings = async (req, res, next) => {
  try {
    // In a real implementation, this would fetch from a settings table
    // For now, return mock settings
    res.json({
      success: true,
      data: {
        settings: {
          general: {
            siteName: 'Mart.az',
            tagline: 'The marketplace for Azerbaijan',
            description: 'Buy and sell anything in Azerbaijan',
            contactEmail: 'contact@mart.az',
            supportEmail: 'support@mart.az'
          },
          listings: {
            approvalRequired: true,
            expireDays: 30,
            maxImagesPerListing: 10,
            allowedImageTypes: ['jpg', 'jpeg', 'png', 'webp'],
            maxImageSize: 5 // MB
          },
          users: {
            allowRegistration: true,
            requireEmailVerification: true,
            requireProfileImage: false,
            allowUserDeletion: true
          },
          localization: {
            defaultLanguage: 'az',
            availableLanguages: ['az', 'en', 'ru'],
            timezone: 'Asia/Baku',
            currency: 'AZN'
          }
        }
      }
    });
  } catch (error) {
    logger.error('Get site settings error:', error);
    next(error);
  }
};

/**
 * Update site settings
 */
exports.updateSiteSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    // In a real implementation, this would update a settings table
    // For now, just return success
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        settings
      }
    });
  } catch (error) {
    logger.error('Update site settings error:', error);
    next(error);
  }
};
