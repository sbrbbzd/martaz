const { Listing, User, Category } = require('../models');
const { ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const slugify = require('slugify');
const uuid = require('uuid');
const ApiError = require('../utils/ApiError');

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
      category,
      minPrice,
      maxPrice,
      condition,
      location,
      search,
      userId
    } = req.query;

    // Build filter conditions
    const where = { status: 'active' };
    
    if (category) {
      where.categoryId = category;
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
      ]
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
 * Get listing by ID or slug
 */
exports.getListingById = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    
    // Determine if the parameter is an ID or slug
    const isUUID = uuid.validate(idOrSlug);
    
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
      ]
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
    
    // Find the listing
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }
    
    // Check if user is authorized to update this listing
    if (listing.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing'
      });
    }

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
    
    // Check if user is authorized to delete this listing
    if (listing.userId !== req.user.id && req.user.role !== 'admin') {
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
      ]
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
    
    // Check if user is authorized to update this listing
    if (listing.userId !== req.user.id) {
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
      ]
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
      ]
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
 * Get all listings with pagination and filtering
 */
exports.getListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'DESC',
      category,
      condition,
      minPrice,
      maxPrice,
      location,
      status = 'active',
      search,
      userId
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where clause for filtering
    const where = {
      status: status === 'all' && req.user?.role === 'admin' ? { [Op.ne]: 'deleted' } : status
    };
    
    // Add filters if provided
    if (category) where.categoryId = category;
    if (condition) where.condition = condition;
    if (location) where.location = { [Op.iLike]: `%${location}%` };
    if (userId) where.userId = userId;
    
    // Price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    
    // Search term
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Get listings with count
    const { count, rows } = await Listing.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, order]],
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
      ]
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      status: 'success',
      count,
      totalPages,
      currentPage: parseInt(page),
      results: rows
    });
  } catch (error) {
    logger.error('Error fetching listings:', error);
    next(error);
  }
};

/**
 * Get listing by ID or slug
 */
exports.getListing = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    
    // Determine if parameter is ID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    const where = isUUID 
      ? { id: idOrSlug }
      : { slug: idOrSlug };
    
    // Add status check if not admin
    if (!req.user || req.user.role !== 'admin') {
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
      ]
    });
    
    if (!listing) {
      return next(new ApiError('Listing not found', 404));
    }
    
    // Increment views counter
    if (req.query.track !== 'false') {
      await listing.increment('views');
    }
    
    res.status(200).json({
      status: 'success',
      data: listing
    });
  } catch (error) {
    logger.error('Error fetching listing:', error);
    next(error);
  }
};

/**
 * Create a new listing
 */
exports.createListing = async (req, res, next) => {
  try {
    // Get current user ID from authenticated request
    const userId = req.user.id;
    
    // Create the listing
    const listing = await Listing.create({
      ...req.body,
      userId,
      status: 'pending' // New listings start as pending
    });
    
    res.status(201).json({
      status: 'success',
      data: listing
    });
  } catch (error) {
    logger.error('Error creating listing:', error);
    next(error);
  }
};

/**
 * Update a listing
 */
exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      return next(new ApiError('Listing not found', 404));
    }
    
    // Check if user owns the listing or is admin
    if (listing.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new ApiError('You are not authorized to update this listing', 403));
    }
    
    // Update listing
    await listing.update(req.body);
    
    res.status(200).json({
      status: 'success',
      data: listing
    });
  } catch (error) {
    logger.error('Error updating listing:', error);
    next(error);
  }
};

/**
 * Delete a listing
 */
exports.deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      return next(new ApiError('Listing not found', 404));
    }
    
    // Check if user owns the listing or is admin
    if (listing.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new ApiError('You are not authorized to delete this listing', 403));
    }
    
    // Soft delete by changing status
    await listing.update({ status: 'deleted' });
    
    res.status(200).json({
      status: 'success',
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting listing:', error);
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
    
    // Check if user is admin or owns the listing
    if (req.user.role !== 'admin' && listing.userId !== req.user.id) {
      return next(new ApiError('You are not authorized to change this listing status', 403));
    }
    
    // Only admin can activate a pending listing
    if (status === 'active' && listing.status === 'pending' && req.user.role !== 'admin') {
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
      ]
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