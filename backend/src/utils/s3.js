/**
 * File Storage Utility
 * Handles local file storage for uploads
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

// Get custom uploads directory from environment or use default
const CUSTOM_UPLOADS_DIR = process.env.CUSTOM_UPLOADS_DIR;
const UPLOADS_DIR_NAME = 'uploads';

// Choose uploads directory
let LOCAL_UPLOADS_DIR;

if (CUSTOM_UPLOADS_DIR) {
  // Use custom directory from environment
  LOCAL_UPLOADS_DIR = path.resolve(CUSTOM_UPLOADS_DIR);
  logger.info(`Using custom uploads directory: ${LOCAL_UPLOADS_DIR}`);
} else {
  // Use default directory in backend/public/uploads
  LOCAL_UPLOADS_DIR = path.join(__dirname, '../../public', UPLOADS_DIR_NAME);
  logger.info(`Using default uploads directory: ${LOCAL_UPLOADS_DIR}`);
}

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  try {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
    logger.info(`Created uploads directory: ${LOCAL_UPLOADS_DIR}`);
  } catch (err) {
    logger.error(`Failed to create uploads directory: ${err.message}`);
  }
}

/**
 * Upload a file to local storage
 * @param {Object} file - Express file object (from multer)
 * @returns {Promise<string>} - The URL of the uploaded file
 */
exports.uploadToS3 = async (file) => {
  const fileExtension = file.originalname.split('.').pop();
  const filename = `${uuidv4()}.${fileExtension}`;
  
  try {
    const filePath = path.join(LOCAL_UPLOADS_DIR, filename);
    
    // Create a write stream
    await fs.promises.writeFile(filePath, file.buffer);
    
    logger.info(`File saved locally: ${filePath}`);
    
    // Determine the URL-like path
    let urlPath;
    
    if (CUSTOM_UPLOADS_DIR) {
      // For custom directory, use the /tmp endpoint path
      urlPath = `/tmp/${filename}`;
    } else {
      // For default directory, return a relative path
      urlPath = `/${UPLOADS_DIR_NAME}/${filename}`;
    }
    
    return urlPath;
  } catch (error) {
    logger.error(`Error saving file locally: ${error.message}`);
    throw new Error(`Failed to save file: ${error.message}`);
  }
};

/**
 * Delete a file from local storage
 * @param {string} url - The URL of the file to delete
 * @returns {Promise<void>}
 */
exports.deleteFromS3 = async (url) => {
  try {
    let filePath;
    
    if (url.startsWith('/uploads/')) {
      // Default path format
      const filename = url.replace('/uploads/', '');
      filePath = path.join(LOCAL_UPLOADS_DIR, filename);
    } else if (url.startsWith('/tmp/')) {
      // Custom path format for /tmp
      const filename = url.replace('/tmp/', '');
      filePath = path.join(LOCAL_UPLOADS_DIR, filename);
    } else if (url.startsWith('/custom-uploads/')) {
      // Handle legacy custom-uploads paths
      const filename = url.replace('/custom-uploads/', '');
      filePath = path.join(LOCAL_UPLOADS_DIR, filename);
    }
    
    // Check if file exists before deleting
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.info(`Local file deleted successfully: ${filePath}`);
    } else {
      logger.warn(`File not found for deletion: ${url}`);
    }
  } catch (error) {
    logger.error(`Error deleting local file: ${error.message}`);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Upload a base64-encoded file to local storage
 * @param {Object} fileData - Object containing base64 file data
 * @param {string} fileData.name - Original filename
 * @param {string} fileData.type - File mimetype
 * @param {string} fileData.data - Base64-encoded file data
 * @returns {Promise<string>} - The URL of the uploaded file
 */
exports.uploadBase64ToS3 = async (fileData) => {
  // Extract file extension from mime type or original name
  let fileExtension;
  if (fileData.name) {
    fileExtension = fileData.name.split('.').pop();
  } else {
    // Extract extension from mime type (e.g., image/png -> png)
    fileExtension = fileData.type.split('/').pop();
  }
  
  const filename = `${uuidv4()}.${fileExtension}`;
  
  // Convert base64 to buffer
  const buffer = Buffer.from(fileData.data, 'base64');
  
  try {
    const filePath = path.join(LOCAL_UPLOADS_DIR, filename);
    
    // Write the file
    await fs.promises.writeFile(filePath, buffer);
    
    logger.info(`Base64 file saved locally: ${filePath}`);
    
    // Determine the URL-like path
    let urlPath;
    
    if (CUSTOM_UPLOADS_DIR) {
      // For custom directory, use the /tmp endpoint path (ensure no double slash)
      urlPath = `/tmp/${filename}`;
    } else {
      // For default directory, return a relative path
      urlPath = `/${UPLOADS_DIR_NAME}/${filename}`;
    }
    
    return urlPath;
  } catch (error) {
    logger.error(`Error saving base64 file locally: ${error.message}`);
    throw new Error(`Failed to save file: ${error.message}`);
  }
}; 