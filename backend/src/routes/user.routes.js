const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { uploadBase64ToS3 } = require('../utils/s3');
const { User, Listing } = require('../models');
// We'll implement the user controller later, for now just create simple placeholder responses
//const userController = require('../controllers/userController');

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', auth, (req, res) => {
  res.json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user: req.user
    }
  });
});

/**
 * @route   GET /api/users/listings
 * @desc    Get listings for the current user
 * @access  Private
 */
router.get('/listings', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const userId = req.user.id;
    
    // Set up conditions
    const conditions = { userId };
    
    // If status is not 'all', add it to conditions
    if (status !== 'all') {
      conditions.status = status;
    }
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Find all listings for the user with pagination
    const { count, rows: listings } = await Listing.findAndCountAll({
      where: conditions,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / parseInt(limit));
    
    res.json({
      success: true,
      data: {
        listings,
        total: count,
        currentPage: parseInt(page),
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    next(error);
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    // Validate required fields
    if (!firstName && !lastName && !phone) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (firstName, lastName, phone) is required for update'
      });
    }
    
    // Build update object with only provided fields
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    
    // Update user profile in database
    await User.update(
      updateData,
      { where: { id: req.user.id } }
    );
    
    // Get updated user data
    const updatedUser = await User.findByPk(req.user.id);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    next(error);
  }
});

/**
 * @route   POST /api/users/profile/image
 * @desc    Upload profile image
 * @access  Private
 */
router.post('/profile/image', auth, async (req, res, next) => {
  try {
    const { imageData, mimeType, fileName } = req.body;
    
    if (!imageData || !mimeType) {
      return res.status(400).json({
        success: false,
        message: 'Image data and mime type are required'
      });
    }
    
    // Prepare image data object for upload
    const fileData = {
      name: fileName || 'profile.jpg',
      type: mimeType,
      data: imageData
    };
    
    // Upload image to S3 or local storage
    const imageUrl = await uploadBase64ToS3(fileData);
    
    // Update user profile in database
    await User.update(
      { profileImage: imageUrl },
      { where: { id: req.user.id } }
    );
    
    // Return success with image URL
    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: imageUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 