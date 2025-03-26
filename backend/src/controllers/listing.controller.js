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
      userId,
      promoted,
      random
    } = req.query;

    // Build where clause for filtering
    const where = { status };
    
    // If promoted is true, filter for promoted listings only
    if (promoted === 'true') {
      where.isPromoted = true;
    }
    
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
    
    // Prepare ordering - if random is true, use random order
    let orderCriteria = [[sort, order]];
    if (random === 'true') {
      orderCriteria = [[Listing.sequelize.literal('RANDOM()')]]
    }
    
    const listings = await Listing.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: orderCriteria
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

    // Special case for "new" - commonly used in frontend routes for creating new items
    if (idOrSlug === 'new') {
      throw new ApiError(404, 'This is a route for creating a new listing, not viewing an existing one');
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
      // Ensure images is an array if provided
      images: req.body.images ? (Array.isArray(req.body.images) ? req.body.images : []) : [],
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

exports.uploadImages = async (req, res) => {
  try {
    console.log('=== UPLOAD IMAGES REQUEST ===');
    console.log('Request content-type:', req.headers['content-type']);
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', Object.keys(req.body));
    
    // Handle direct JSON request (not multipart/form-data)
    const contentType = req.headers['content-type'] || '';
    const isJson = contentType.includes('application/json');
    
    if (isJson) {
      console.log('Handling JSON request');
      console.log('Request body:', req.body);
      
      // If this is a direct JSON request, process the images array directly
      if (req.body.images && Array.isArray(req.body.images)) {
        const imageUrls = req.body.images.filter(url => url && typeof url === 'string' && url.trim() !== '');
        console.log(`Found ${imageUrls.length} image URLs in JSON request:`, imageUrls);
        
        // Get the listing ID from the route params
        const { id } = req.params;
        console.log('Looking up listing with ID:', id);
        
        // Find the listing
        const listing = await Listing.findByPk(id);
        
        if (!listing) {
          console.log('Listing not found with ID:', id);
          return res.status(404).json({ success: false, message: 'Listing not found' });
        }
        
        console.log('Listing found:', listing.id);
        console.log('Listing user ID:', listing.userId);
        console.log('Current user ID:', req.user.id);
        
        // Check if the user has permission to update the listing
        if (listing.userId !== req.user.id && req.user.role !== 'admin') {
          console.log('Permission denied - user is not owner or admin');
          return res.status(403).json({ success: false, message: 'Not authorized to update this listing' });
        }
        
        // Check if we have any valid images
        if (imageUrls.length === 0) {
          console.log('No valid image URLs found in the request');
          return res.status(400).json({ success: false, message: 'No images provided' });
        }
        
        // Append to existing images if requested
        let finalImageUrls = [...imageUrls];
        if (req.body.appendToExisting === true || req.body.appendToExisting === 'true') {
          const currentImages = listing.images || [];
          console.log('Current listing images:', currentImages);
          finalImageUrls = [...currentImages, ...imageUrls];
          console.log('Appending to existing images, new total:', finalImageUrls.length);
        }
        
        // Update the listing with the new images
        console.log('Updating listing with images:', finalImageUrls);
        await listing.update({ images: finalImageUrls });
        
        return res.status(200).json({
          success: true,
          message: 'Listing images updated successfully',
          data: {
            images: finalImageUrls,
            listing: {
              id: listing.id,
              images: finalImageUrls
            }
          }
        });
      }
    }
    
    // For multipart/form-data or other request formats, use the existing code...
    console.log('Handling multipart/form-data request');
    console.log('Request files:', req.files ? req.files.length : 'No files');
    
    // Detailed request analysis for debugging
    if (req.files && req.files.length > 0) {
      console.log('Files found:', req.files.length);
      req.files.forEach((file, index) => {
        console.log(`File ${index}: ${file.originalname}, ${file.mimetype}, ${file.size} bytes`);
      });
    }
    
    if (req.body.images) {
      console.log('Images in body:', typeof req.body.images);
      if (typeof req.body.images === 'string') {
        try {
          const parsedImages = JSON.parse(req.body.images);
          console.log('Parsed images from body:', Array.isArray(parsedImages) ? 
                     `Array with ${parsedImages.length} items` : 
                     typeof parsedImages);
        } catch (e) {
          console.log('Images is not valid JSON:', req.body.images.substring(0, 100));
        }
      }
    }
    
    const { id } = req.params;
    
    // Verify listing exists and user owns it
    console.log('Looking up listing with ID:', id);
    console.log('Auth user ID:', req.user.id);
    
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      console.log('Listing not found with ID:', id);
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    
    console.log('Listing user ID:', listing.userId);
    
    if (listing.userId !== req.user.id && req.user.role !== 'admin') {
      console.log('Permission denied - user is not owner or admin');
      return res.status(403).json({ success: false, message: 'Not authorized to update this listing' });
    }
    
    // Process images - check both req.files (direct uploads) and req.body.images (URLs)
    let imageUrls = [];
    
    // Check for direct file uploads via multipart form
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      console.log('Found files in req.files array:', req.files.length);
      imageUrls = req.files.map(file => `/api/images/${file.filename}`);
    } 
    // Check for image URLs in request body
    else if (req.body.images) {
      console.log('Looking for images in request body');
      console.log('Type of images in body:', typeof req.body.images);
      
      try {
        // If it's a string, try to parse it as JSON
        let parsedImages = req.body.images;
        
        if (typeof req.body.images === 'string') {
          console.log('Parsing images JSON:', req.body.images.substring(0, 100) + (req.body.images.length > 100 ? '...' : ''));
          try {
            parsedImages = JSON.parse(req.body.images);
            console.log('Successfully parsed images JSON');
          } catch (parseError) {
            console.error('Error parsing JSON, treating as a single URL:', parseError);
            // If parsing fails, treat it as a single URL string
            if (req.body.images.trim()) {
              parsedImages = [req.body.images.trim()];
            }
          }
          console.log('Parsed images result type:', typeof parsedImages);
          if (Array.isArray(parsedImages)) {
            console.log('Parsed images length:', parsedImages.length);
            console.log('Parsed images content:', JSON.stringify(parsedImages).substring(0, 200));
          } else {
            console.log('Parsed images result:', parsedImages);
          }
        }
        
        // Handle array of image URLs
        if (Array.isArray(parsedImages)) {
          console.log('Found image array, filtering nulls');
          
          // Filter out null, undefined, or empty values
          imageUrls = parsedImages.filter(url => url && url !== 'null' && url !== '');
          console.log(`Found ${imageUrls.length} valid URLs after filtering`);
          if (imageUrls.length > 0) {
            console.log('Sample URL:', imageUrls[0]);
          }
        }
        // Handle direct URL string (not in array)
        else if (parsedImages && typeof parsedImages === 'string' && parsedImages.trim() !== '') {
          console.log('Found single image URL string');
          imageUrls = [parsedImages];
        }
        // Handle raw files upload response format
        else if (parsedImages && parsedImages.files && Array.isArray(parsedImages.files)) {
          console.log('Found files array in parsed images', parsedImages.files.length);
          imageUrls = parsedImages.files
            .filter(file => file && (file.filename || file.url || file.path))
            .map(file => file.url || file.path || `/api/images/${file.filename}`);
        }
      } catch (error) {
        console.error('Error parsing image URLs:', error);
      }
      
      // Last resort - scan for filenames directly in the body
      if (imageUrls.length === 0) {
        console.log('Scanning request body for image filenames');
        
        // Look for any properties that might contain image filenames
        Object.keys(req.body).forEach(key => {
          if (typeof req.body[key] === 'string' && 
              (req.body[key].includes('/api/images/') || 
               req.body[key].includes('.jpg') || 
               req.body[key].includes('.png') || 
               req.body[key].includes('.jpeg'))) {
            imageUrls.push(req.body[key]);
          }
        });
      }
    }
    
    console.log('Final image URLs for update:', imageUrls);
    
    // Ensure we have at least one image
    if (imageUrls.length === 0) {
      console.log('No images found in request - looking at raw body');
      console.log('Raw body:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ success: false, message: 'No images provided' });
    }
    
    // Merge with existing images if needed
    if (req.body.appendToExisting === 'true' || req.body.appendToExisting === true) {
      const currentImages = listing.images || [];
      console.log('Current listing images:', currentImages);
      imageUrls = [...currentImages, ...imageUrls];
      console.log('Appending to existing images, new total:', imageUrls.length);
    }
    
    // Update listing with image URLs
    console.log('Updating listing with images:', imageUrls);
    await listing.update({ images: imageUrls });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Listing images updated successfully',
      data: { 
        images: imageUrls,
        listing: {
          id: listing.id,
          images: imageUrls
        }
      }
    });
    
  } catch (error) {
    console.error('Error uploading images:', error);
    return res.status(500).json({ success: false, message: error.message });
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

/**
 * Change listing status (active, pending, sold, etc.)
 */
exports.changeListingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'pending', 'sold', 'expired', 'deleted'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }
    
    // Debug log for authorization check
    console.log('Change status authorization check:');
    console.log('Listing userId:', listing.userId, 'type:', typeof listing.userId);
    console.log('Request user id:', req.user.id, 'type:', typeof req.user.id);
    
    // Check if user is admin or owns the listing
    const isOwner = String(listing.userId) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to change this listing status'
      });
    }
    
    // Only admin can activate a pending listing
    if (status === 'active' && listing.status === 'pending' && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can approve pending listings'
      });
    }
    
    await listing.update({ status });
    
    res.status(200).json({
      success: true,
      message: `Listing status updated to ${status}`,
      data: listing
    });
  } catch (error) {
    console.error('Error changing listing status:', error);
    next(error);
  }
};

/**
 * Feature a listing for increased visibility
 */
exports.featureListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;
    
    if (!duration || !['day', 'week', 'month'].includes(duration)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid duration. Must be day, week, or month.'
      });
    }
    
    // Get the listing
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }
    
    // Check if user is authorized (owner or admin)
    if (listing.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to feature this listing'
      });
    }
    
    // Calculate the end date based on duration
    let endDate = new Date();
    
    switch (duration) {
      case 'day':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'week':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'month':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }
    
    // Update the listing
    await listing.update({
      isPromoted: true,
      promotionEndDate: endDate
    });
    
    res.json({
      status: 'success',
      data: listing
    });
  } catch (error) {
    console.error('Error featuring listing:', error);
    next(error);
  }
}; 