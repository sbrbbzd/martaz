// Base URL for API requests - can be overridden by environment variables
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
export const IMAGE_SERVER_URL = process.env.REACT_APP_IMAGE_SERVER_URL || 'http://localhost:3001';

/**
 * Get a properly formatted image URL that works across environments
 * @param {string} imagePath - The image path or filename
 * @returns {string} The properly formatted URL
 */
export function getImageUrl(imagePath) {
  // Exit early if no image path is provided
  if (!imagePath) {
    const placeholder = `${IMAGE_SERVER_URL}/images/placeholder.jpg`;
    console.log('No image path provided, using placeholder:', placeholder);
    return placeholder;
  }
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('Image is already a full URL:', imagePath);
    return imagePath;
  }
  
  // Handle tmp path format
  if (imagePath.startsWith('/tmp/')) {
    const filename = imagePath.substring(5); // Remove /tmp/
    const url = `${IMAGE_SERVER_URL}/images/${filename}`;
    console.log('Transformed /tmp/ path:', imagePath, 'to:', url);
    return url;
  }
  
  // If it's just a filename without slashes, assume it's in the images directory
  if (!imagePath.includes('/')) {
    const url = `${IMAGE_SERVER_URL}/images/${imagePath}`;
    console.log('Transformed filename:', imagePath, 'to:', url);
    return url;
  }
  
  // Add the image server URL for other paths
  const url = `${IMAGE_SERVER_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  console.log('Using default path transformation:', imagePath, 'to:', url);
  return url;
} 