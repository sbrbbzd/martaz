const { Listing, User, Category } = require('../models');
const { ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const slugify = require('slugify');
const uuid = require('uuid');
const ApiError = require('../utils/ApiError');

/**
 * Helper function to safely compare user IDs regardless of their type
 * @param {string|object} id1 - First user ID
 * @param {string|object} id2 - Second user ID
 * @returns {boolean} - true if IDs match, false otherwise
 */
const areIdsEqual = (id1, id2) => {
  if (!id1 || !id2) return false;
  
  // Convert both to strings for comparison
  const strId1 = String(id1).trim();
  const strId2 = String(id2).trim();
  
  return strId1 === strId2;
};

/**
 * Get all listings with pagination and filters
 */
exports.getAllListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = 'createdAt',
      order = 'DESC',
      category, // Keep for backward compatibility
      categoryId,
      categorySlug,
      minPrice,
      maxPrice,
      condition,
      location,
      search,
      userId
    } = req.query;

    // Build filter conditions
    const where = { status: 'active' };
    
    // Handle category filtering by ID or slug
    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      // Find the category by slug first
      const category = await Category.findOne({ where: { slug: categorySlug } });
      if (category) {
        where.categoryId = category.id;
      } else {
        // If category slug is invalid, return empty results
        return res.json({
          success: true,
          data: {
            listings: [],
            pagination: {
              total: 0,
              page: parseInt(page, 10),
              totalPages: 0,
              hasMore: false
            }
          }
        });
      }
    } else if (category) {
      // Backward compatibility - try to determine if category is ID or slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      
      if (isUuid) {
        // If it looks like a UUID, use as ID
        where.categoryId = category;
      } else {
        // Otherwise treat as slug
        const categoryBySlug = await Category.findOne({ where: { slug: category } });
        if (categoryBySlug) {
          where.categoryId = categoryBySlug.id;
        }
      }
    }
    
    if (minPrice) {
      where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) };
    }
    
    if (maxPrice) {
      where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };
    }
    
    if (condition) {
      where.condition = condition;
    }
    
    if (location) {
      where.location = { [Op.iLike]: `%${location}%` };
    }
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (userId) {
      where.userId = userId;
    }

    // Determine sort field and order
    const sortField = sort === 'price' ? 'price' : 
                      sort === 'createdAt' ? 'createdAt' : 'createdAt';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Execute query
    const { count, rows } = await Listing.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      limit: limitNum,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ],
      attributes: { 
        exclude: ['featuredUntil']
      }
    });

    const totalPages = Math.ceil(count / limitNum);

    // Return results
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
    logger.error('Get listings error:', error);
    next(error);
  }
};

/**
 * Alias for getAllListings for backward compatibility
 */
exports.getListings = exports.getAllListings;

/**
 * Get listing by ID or slug
 */
exports.getListingById = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    
    // Determine if the parameter is an ID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    // Build where condition based on the parameter type
    const where = isUUID ? { id: idOrSlug } : { slug: idOrSlug };
    
    // If not authenticated or not the owner, only show active listings
    if (!req.user || (req.user && req.user.role !== 'admin')) {
      where.status = 'active';
    }

    const listing = await Listing.findOne({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'profileImage', 'createdAt']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'parentId']
        }
      ],
      attributes: {
        exclude: ['featuredUntil']
      }
    });

    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    // Increment view count (unless it's the owner viewing)
    if (!req.user || (req.user && req.user.id !== listing.userId)) {
      listing.viewCount += 1;
      await listing.save();
    }

    res.json({
      success: true,
      data: {
        listing
      }
    });
  } catch (error) {
    logger.error('Get listing error:', error);
    next(error);
  }
};

/**
 * Alias for getListingById for backward compatibility
 */
exports.getListing = exports.getListingById;

/**
 * Create a new listing
 */
exports.createListing = async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      currency,
      condition,
      location,
      images,
      attributes,
      contactMethod,
      contactPhone,
      contactEmail,
      categoryId
    } = req.body;

    // Generate slug from title
    let slug = slugify(title, { lower: true, strict: true });
    
    // Check for slug uniqueness and append random string if necessary
    const existingSlug = await Listing.findOne({ where: { slug } });
    if (existingSlug) {
      // Append random string to make slug unique
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Validate category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new ValidationError('Selected category does not exist');
    }

    // Create listing
    const listing = await Listing.create({
      title,
      slug,
      description,
      price,
      currency: currency || 'AZN',
      condition,
      location,
      images: images || [],
      attributes: attributes || {},
      contactMethod: contactMethod || 'both',
      contactPhone,
      contactEmail,
      status: 'pending', // New listings are pending by default
      userId: req.user.id,
      categoryId,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    res.status(201).json({
      success: true,
      message: 'Listing created successfully. It will be reviewed shortly.',
      data: {
        listing
      }
    });
  } catch (error) {
    logger.error('Create listing error:', error);
    next(error);
  }
};

/**
 * Update an existing listing
 */
exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    console.log('========== UPDATE LISTING DEBUG ==========');
    console.log('Listing ID:', id);
    console.log('Request user:', JSON.stringify(req.user));
    
    // Find the listing
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      console.log('Listing not found');
      throw new NotFoundError('Listing not found');
    }
    
    console.log('Listing found:', JSON.stringify(listing));
    console.log('Listing.userId:', listing.userId, 'type:', typeof listing.userId);
    console.log('req.user.id:', req.user.id, 'type:', typeof req.user.id);
    
    // Use the helper function for ID comparison
    const isOwner = areIdsEqual(listing.userId, req.user.id);
    const isAdmin = req.user.role === 'admin';
    
    console.log('Is owner:', isOwner, 'Is admin:', isAdmin);
    
    // Check if user is authorized to update this listing
    if (!isOwner && !isAdmin) {
      console.log('AUTHORIZATION FAILED');
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing'
      });
    }

    console.log('Authorization passed, proceeding with update');
    
    const {
      title,
      description,
      price,
      currency,
      condition,
      location,
      images,
      attributes,
      contactMethod,
      contactPhone,
      contactEmail,
      categoryId,
      status
    } = req.body;

    // If title changes, update the slug
    let slug = listing.slug;
    if (title && title !== listing.title) {
      slug = slugify(title, { lower: true, strict: true });
      
      // Check for slug uniqueness
      const existingSlug = await Listing.findOne({ 
        where: { 
          slug,
          id: { [Op.ne]: id } // Exclude the current listing
        } 
      });
      
      if (existingSlug) {
        // Append random string to make slug unique
        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
      }
    }

    // Only admins can update status
    const newStatus = req.user.role === 'admin' && status ? status : listing.status;
    
    // If it was previously rejected and is being updated, set to pending for review
    if (listing.status === 'rejected' && req.user.role !== 'admin') {
      newStatus = 'pending';
    }

    // Update listing
    await listing.update({
      title: title || listing.title,
      slug,
      description: description || listing.description,
      price: price || listing.price,
      currency: currency || listing.currency,
      condition: condition || listing.condition,
      location: location || listing.location,
      images: images || listing.images,
      attributes: attributes || listing.attributes,
      contactMethod: contactMethod || listing.contactMethod,
      contactPhone: contactPhone || listing.contactPhone,
      contactEmail: contactEmail || listing.contactEmail,
      categoryId: categoryId || listing.categoryId,
      status: newStatus
    });

    res.json({
      success: true,
      message: 'Listing updated successfully',
      data: {
        listing
      }
    });
  } catch (error) {
    logger.error('Update listing error:', error);
    next(error);
  }
};

/**
 * Delete a listing
 */
exports.deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the listing
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }
    
    // Debug log and fix for ID comparison
    console.log('Delete authorization check:');
    console.log('Listing userId:', listing.userId, 'type:', typeof listing.userId);
    console.log('Request user id:', req.user.id, 'type:', typeof req.user.id);
    
    // Use our helper function for consistent ID comparison
    const isOwner = areIdsEqual(listing.userId, req.user.id);
    const isAdmin = req.user.role === 'admin';
    
    // Check if user is authorized to delete this listing
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this listing'
      });
    }

    // Delete the listing
    await listing.destroy();

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    logger.error('Delete listing error:', error);
    next(error);
  }
};

/**
 * Get user's listings
 */
exports.getUserListings = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    // Check if user is authorized to view these listings
    // Regular users can only see their own listings, admins can see all
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view these listings'
      });
    }
    
    // Build filter conditions
    const where = { userId };
    
    if (status) {
      where.status = status;
    }
    
    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Execute query
    const { count, rows } = await Listing.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ],
      attributes: {
        exclude: ['featuredUntil']
      }
    });

    const totalPages = Math.ceil(count / limitNum);

    // Return results
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
    logger.error('Get user listings error:', error);
    next(error);
  }
};

/**
 * Mark listing as sold
 */
exports.markAsSold = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the listing
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }
    
    // Debug log and fix for ID comparison
    console.log('Mark as sold authorization check:');
    console.log('Listing userId:', listing.userId, 'type:', typeof listing.userId);
    console.log('Request user id:', req.user.id, 'type:', typeof req.user.id);
    
    // Use our helper function for consistent ID comparison
    const isOwner = areIdsEqual(listing.userId, req.user.id);
    
    // Check if user is authorized to update this listing
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing'
      });
    }

    // Update listing status
    await listing.update({ status: 'sold' });

    res.json({
      success: true,
      message: 'Listing marked as sold',
      data: {
        listing
      }
    });
  } catch (error) {
    logger.error('Mark as sold error:', error);
    next(error);
  }
};

/**
 * Promote a listing
 */
exports.promoteListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { promotionDays } = req.body;
    
    if (!promotionDays || promotionDays < 1 || promotionDays > 30) {
      throw new ValidationError('Invalid promotion duration. Must be between 1 and 30 days.');
    }
    
    // Find the listing
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }
    
    // Check if user is authorized to promote this listing
    if (listing.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to promote this listing'
      });
    }

    // Calculate promotion end date
    const promotionEndDate = new Date();
    promotionEndDate.setDate(promotionEndDate.getDate() + promotionDays);

    // Update listing
    await listing.update({
      isPromoted: true,
      promotionEndDate
    });

    // In a real application, you would handle payment processing here
    // For now, we assume the payment was successful

    res.json({
      success: true,
      message: 'Listing promoted successfully',
      data: {
        listing,
        promotionEndDate
      }
    });
  } catch (error) {
    logger.error('Promote listing error:', error);
    next(error);
  }
};

/**
 * Search listings
 */
exports.searchListings = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;
    
    if (!q) {
      throw new ValidationError('Search query is required');
    }
    
    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build search query
    const where = {
      status: 'active',
      [Op.or]: [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } }
      ]
    };

    // Execute search
    const { count, rows } = await Listing.findAndCountAll({
      where,
      order: [
        ['isPromoted', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: limitNum,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ],
      attributes: {
        exclude: ['featuredUntil']
      }
    });

    const totalPages = Math.ceil(count / limitNum);

    // Return results
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
        },
        query: q
      }
    });
  } catch (error) {
    logger.error('Search listings error:', error);
    next(error);
  }
};

/**
 * Get featured listings for homepage
 */
exports.getFeaturedListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 8;
    
    // Get promoted listings first, then recent listings
    const listings = await Listing.findAll({
      where: { status: 'active' },
      order: [
        ['isPromoted', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ],
      attributes: {
        exclude: ['featuredUntil']
      }
    });

    res.json({
      success: true,
      data: {
        listings
      }
    });
  } catch (error) {
    logger.error('Get featured listings error:', error);
    next(error);
  }
};

/**
 * Get user's own listings
 */
exports.getMyListings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Add user ID to query params and call getListings
    req.query.userId = userId;
    req.query.status = req.query.status || 'all'; // Show all user's listings by default
    
    return await exports.getListings(req, res, next);
  } catch (error) {
    logger.error('Error fetching user listings:', error);
    next(error);
  }
};

/**
 * Change listing status
 */
exports.changeListingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'pending', 'sold', 'expired', 'deleted'].includes(status)) {
      return next(new ApiError('Invalid status', 400));
    }
    
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      return next(new ApiError('Listing not found', 404));
    }
    
    // Debug log and fix for ID comparison
    console.log('Change status authorization check:');
    console.log('Listing userId:', listing.userId, 'type:', typeof listing.userId);
    console.log('Request user id:', req.user.id, 'type:', typeof req.user.id);
    
    // Use our helper function for consistent ID comparison
    const isOwner = areIdsEqual(listing.userId, req.user.id);
    const isAdmin = req.user.role === 'admin';
    
    // Check if user is admin or owns the listing
    if (!isAdmin && !isOwner) {
      return next(new ApiError('You are not authorized to change this listing status', 403));
    }
    
    // Only admin can activate a pending listing
    if (status === 'active' && listing.status === 'pending' && !isAdmin) {
      return next(new ApiError('Only admins can approve pending listings', 403));
    }
    
    await listing.update({ status });
    
    res.status(200).json({
      status: 'success',
      message: `Listing status updated to ${status}`,
      data: listing
    });
  } catch (error) {
    logger.error('Error changing listing status:', error);
    next(error);
  }
};

/**
 * Feature or promote a listing
 */
exports.promoteListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feature, promote, days = 7 } = req.body;
    
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      return next(new ApiError('Listing not found', 404));
    }
    
    // Only admin can feature or promote listings
    if (req.user.role !== 'admin') {
      return next(new ApiError('Only admins can feature or promote listings', 403));
    }
    
    // Update the listing
    const updates = {};
    
    if (feature !== undefined) {
      updates.isFeatured = !!feature;
    }
    
    if (promote !== undefined) {
      updates.isPromoted = !!promote;
      
      if (promote) {
        // Calculate promotion end date
        const promotionEndDate = new Date();
        promotionEndDate.setDate(promotionEndDate.getDate() + parseInt(days));
        updates.promotionEndDate = promotionEndDate;
      } else {
        updates.promotionEndDate = null;
      }
    }
    
    await listing.update(updates);
    
    res.status(200).json({
      status: 'success',
      message: 'Listing promotion status updated',
      data: listing
    });
  } catch (error) {
    logger.error('Error promoting listing:', error);
    next(error);
  }
};

/**
 * Get featured listings
 */
exports.getFeaturedListings = async (req, res, next) => {
  try {
    const limit = req.query.limit || 8;
    
    const listings = await Listing.findAll({
      where: {
        status: 'active',
        isFeatured: true
      },
      limit: parseInt(limit),
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ],
      attributes: {
        exclude: ['featuredUntil']
      }
    });
    
    res.status(200).json({
      status: 'success',
      results: listings.length,
      data: listings
    });
  } catch (error) {
    logger.error('Error fetching featured listings:', error);
    next(error);
  }
};

/**
 * Feature a listing for a specific duration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.makeListingFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Listing ID is required'
      });
    }
    
    if (!duration || !['day', 'week', 'month'].includes(duration)) {
      return res.status(400).json({
        success: false,
        message: 'Valid duration is required (day, week, or month)'
      });
    }
    
    // Find the listing
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }
    
    // Check if user is authorized (must be the owner or admin)
    if (listing.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to feature this listing'
      });
    }
    
    // Calculate feature end date based on duration
    const now = new Date();
    let featuredUntil = new Date(now);
    
    switch(duration) {
      case 'day':
        featuredUntil.setDate(now.getDate() + 1);
        break;
      case 'week':
        featuredUntil.setDate(now.getDate() + 7);
        break;
      case 'month':
        featuredUntil.setMonth(now.getMonth() + 1);
        break;
      default:
        featuredUntil.setDate(now.getDate() + 1);
    }
    
    // Update the listing
    await listing.update({
      isFeatured: true
    });
    
    return res.status(200).json({
      success: true,
      message: 'Listing successfully featured',
      data: {
        listing: {
          ...listing.toJSON(),
          isFeatured: true
        }
      }
    });
  } catch (error) {
    console.error('Error featuring listing:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to feature listing',
      error: error.message
    });
  }
};

/**
 * Get all featured listings
 */
exports.getFeaturedListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Get featured listings that haven't expired
    const { count, rows } = await Listing.findAndCountAll({
      where: {
        isFeatured: true,
        status: 'active' // Only show active listings
      },
      order: [['createdAt', 'DESC']], // Changed from featuredUntil to createdAt
      limit: limitNum,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ],
      attributes: {
        exclude: ['featuredUntil']
      }
    });

    const totalPages = Math.ceil(count / limitNum);

    // Return results
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
    logger.error('Get featured listings error:', error);
    next(error);
  }
};

/**
 * Check for expired featured listings and update them
 * This should be called by a scheduled job/cron
 */
exports.checkFeaturedExpiration = async () => {
  try {
    // Find all featured listings
    const expiredListings = await Listing.findAll({
      where: {
        isFeatured: true
      },
      attributes: {
        exclude: ['featuredUntil']
      }
    });
    
    // Update all listings
    if (expiredListings.length > 0) {
      const updates = expiredListings.map(listing => 
        listing.update({ isFeatured: false })
      );
      
      await Promise.all(updates);
      
      logger.info(`Updated ${expiredListings.length} expired featured listings`);
      return expiredListings.length;
    }
    
    return 0;
  } catch (error) {
    logger.error('Error checking expired featured listings:', error);
    throw error;
  }
};

module.exports = exports; 