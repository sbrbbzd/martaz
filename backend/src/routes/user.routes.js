const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { uploadBase64ToS3 } = require('../utils/s3');
const { User } = require('../models');
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
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Profile will be updated in future implementation',
    data: {
      user: req.user
    }
  });
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