const { Listing, Category, User } = require('../models');
const { ApiError } = require('../utils/errors');
const { uploadToS3 } = require('../utils/s3');
const { Op } = require('sequelize');

exports.getListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'DESC',
      status = 'active',
      categoryId,
      categorySlug,
      category, // Support for both categoryId and category params
      minPrice,
      maxPrice,
      condition,
      location,
      search,
      userId
    } = req.query;

    // Build where clause for filtering
    const where = { status };
    
    // Handle category filtering
    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      // Find the category by slug
      const categoryObj = await Category.findOne({ where: { slug: categorySlug } });
      if (categoryObj) {
        where.categoryId = categoryObj.id;
      } else {
        // If category slug is invalid, return empty results
        return res.json({
          success: true,
          data: {
            listings: [],
            total: 0,
            currentPage: parseInt(page),
            totalPages: 0
          }
        });
      }
    } else if (category) {
      // Check if it's a UUID or a slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      
      if (isUuid) {
        where.categoryId = category;
      } else {
        // Try to find by slug
        const categoryObj = await Category.findOne({ where: { slug: category } });
        if (categoryObj) {
          where.categoryId = categoryObj.id;
        }
      }
    }
    
    // Add price filters
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    
    // Add condition filter
    if (condition) {
      where.condition = condition;
    }
    
    // Add location filter
    if (location) {
      where.location = { [Op.iLike]: `%${location}%` };
    }
    
    // Add search filter
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Add user filter
    if (userId) {
      where.userId = userId;
    }

    console.log('Filtering with where clause:', JSON.stringify(where, null, 2));
    
    const listings = await Listing.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [[sort, order]]
    });

    res.json({
      success: true,
      data: {
        listings: listings.rows,
        total: listings.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(listings.count / limit)
      }
    });
  } catch (error) {
    console.error('Error in getListings:', error);
    next(error);
  }
};

exports.getListing = async (req, res, next) => {
  try {
    // Get the parameter (which could be either an ID or slug)
    const idOrSlug = req.params.idOrSlug || req.params.id;
    
    if (!idOrSlug) {
      throw new ApiError(400, 'Missing listing identifier');
    }
    
    // Determine if it's a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    console.log(`Looking up listing with ${isUUID ? 'UUID' : 'slug'}: ${idOrSlug}`);
    
    // Build the appropriate where condition
    const where = isUUID ? { id: idOrSlug } : { slug: idOrSlug };
    
    // Find the listing using findOne instead of findByPk
    const listing = await Listing.findOne({
      where,
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }

    // Increment views
    await listing.increment('views');

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Error in getListing:', error);
    next(error);
  }
};

exports.createListing = async (req, res, next) => {
  try {
    console.log('createListing called');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user ? req.user.id : 'No user found');
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.error('Authentication error: No user found in request');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or session expired'
      });
    }
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'price', 'location', 'categoryId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('Validation error: Missing required fields', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    const listing = await Listing.create({
      ...req.body,
      userId: req.user.id,
      status: 'pending',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });
    
    console.log('Listing created successfully:', listing.id);

    res.status(201).json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    // Log detailed error information
    if (error.name) console.error('Error name:', error.name);
    if (error.message) console.error('Error message:', error.message);
    if (error.stack) console.error('Error stack:', error.stack);
    if (error.errors) console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    
    // Handle specific error types
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    
    next(error);
  }
};

exports.updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id);

    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }

    if (listing.userId !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to update this listing');
    }

    await listing.update(req.body);

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id);

    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }

    if (listing.userId !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to delete this listing');
    }

    // Actually delete the listing instead of just updating its status
    await listing.destroy();

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadImages = async (req, res, next) => {
  try {
    // Debug incoming request
    console.log('uploadImages request received');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('req.files exists:', !!req.files);
    
    // Get listing ID from URL parameter
    const { id } = req.params;
    console.log('Updating listing with ID:', id);
    
    // Find the listing
    const listing = await Listing.findOne({
      where: { id }
    });
    
    // If no listing found, return 404
    if (!listing) {
      console.error(`Listing with ID ${id} not found`);
      throw new ApiError(404, 'Listing not found');
    }
    
    // Debug authentication info
    console.log('Auth user ID:', req.user.id);
    console.log('Listing user ID:', listing.userId);
    console.log('User roles:', req.user.role);
    
    // Check if the user owns this listing
    if (listing.userId !== req.user.id) {
      // For admin, allow access
      const isAdmin = req.user.role === 'admin';
      
      if (!isAdmin) {
        console.error(`User ${req.user.id} not authorized to update listing ${listing.id}`);
        throw new ApiError(403, 'You do not have permission to upload images to this listing');
      }
    }

    // Check if we have files from multer
    if (!req.files || req.files.length === 0) {
      console.log('No files found in request, checking for JSON image paths');
      console.log('Request body keys:', Object.keys(req.body));
      
      // If images are provided as JSON in the request body
      if (req.body && req.body.images) {
        console.log('Found images in request body:', req.body.images);
        
        // Make sure images is an array
        let imagePaths = req.body.images;
        if (typeof imagePaths === 'string') {
          try {
            // Try to parse if it's a JSON string
            imagePaths = JSON.parse(imagePaths);
          } catch(e) {
            console.error('Failed to parse images JSON:', e);
          }
        }
        
        console.log('Processed image paths:', imagePaths);
        
        if (Array.isArray(imagePaths)) {
          console.log(`Processing ${imagePaths.length} image paths`);
          
          // Add new images to existing ones
          const currentImages = listing.images || [];
          console.log('Current images:', currentImages);
          
          const updatedImages = [...currentImages, ...imagePaths];
          console.log('Updated images array:', updatedImages);
          
          // Update the listing with new images
          await listing.update({
            images: updatedImages,
            featuredImage: listing.featuredImage || imagePaths[0]
          });
          
          console.log('Listing updated successfully with image paths');
          
          return res.json({
            status: 'success',
            data: {
              listing: {
                id: listing.id,
                images: updatedImages,
                featuredImage: listing.featuredImage || imagePaths[0]
              }
            }
          });
        } else {
          console.error('Images in request body is not an array:', imagePaths);
          throw new ApiError(400, 'Images must be provided as an array');
        }
      } else {
        console.error('No images provided in request body');
        throw new ApiError(400, 'No images provided');
      }
    }

    console.log(`Received ${req.files.length} files for upload`);
    console.log('File details:', req.files.map(f => ({ 
      name: f.originalname, 
      size: f.size, 
      mimetype: f.mimetype 
    })));

    // Upload each file to local storage and get the URLs
    const uploadPromises = req.files.map(file => {
      try {
        return uploadToS3(file); // This function now only uses local storage
      } catch (err) {
        console.error(`Error uploading file ${file.originalname}:`, err);
        throw new ApiError(500, `Error uploading file ${file.originalname}: ${err.message}`);
      }
    });
    
    const uploadedImages = await Promise.all(uploadPromises);
    console.log('Uploaded images:', uploadedImages);
    
    // Get current images
    const currentImages = listing.images || [];
    
    // Add new images to existing ones
    const updatedImages = [...currentImages, ...uploadedImages];
    
    // Update the listing with new images
    await listing.update({
      images: updatedImages,
      // If there's no featured image yet, use the first uploaded image
      featuredImage: listing.featuredImage || uploadedImages[0]
    });
    
    res.json({
      status: 'success',
      data: {
        listing: {
          id: listing.id,
          images: updatedImages,
          featuredImage: listing.featuredImage || uploadedImages[0]
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getListingsByCategory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'DESC'
    } = req.query;

    const listings = await Listing.findAndCountAll({
      where: {
        categoryId: req.params.categoryId,
        status: 'active'
      },
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [[sort, order]]
    });

    res.json({
      success: true,
      data: {
        listings: listings.rows,
        total: listings.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(listings.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get featured listings
exports.getFeaturedListings = async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;
    
    const featuredListings = await Listing.findAll({
      where: { 
        status: 'active',
        isPromoted: true
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'profileImage'] }
      ],
      limit: parseInt(limit),
      order: [['updatedAt', 'DESC']]
    });

    res.json({
      status: 'success',
      data: featuredListings
    });
  } catch (error) {
    next(error);
  }
}; 