const { Listing, Category, User } = require('../models');
const { ApiError } = require('../utils/errors');
const { uploadToS3 } = require('../utils/s3'); // You'll need to implement this

exports.getListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'DESC',
      status = 'active'
    } = req.query;

    const listings = await Listing.findAndCountAll({
      where: { status },
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
    next(error);
  }
};

exports.getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id, {
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
    next(error);
  }
};

exports.createListing = async (req, res, next) => {
  try {
    const listing = await Listing.create({
      ...req.body,
      userId: req.user.id,
      status: 'pending',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    res.status(201).json({
      success: true,
      data: listing
    });
  } catch (error) {
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

    await listing.update({ status: 'deleted' });

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
    const listing = await Listing.findByPk(req.params.id);

    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }

    if (listing.userId !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to update this listing');
    }

    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, 'No images provided');
    }

    const uploadedImages = await Promise.all(
      req.files.map(file => uploadToS3(file))
    );

    const updatedImages = [...listing.images, ...uploadedImages];
    await listing.update({
      images: updatedImages,
      featuredImage: listing.featuredImage || uploadedImages[0]
    });

    res.json({
      success: true,
      data: {
        images: updatedImages
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