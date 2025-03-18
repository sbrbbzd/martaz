/**
 * Utility functions for handling image URLs
 */

/**
 * Get the full URL for an image
 * @param url Image URL or path
 * @returns Full URL
 */
export const getImageUrl = (url?: string): string => {
  if (!url) return 'http://localhost:3001/images/placeholder.jpg';
  
  // For debugging
  console.log(`Processing image URL: ${url}`);
  
  // Absolute URL - return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Handle different types of image paths
  
  // 1. tmp path - directly convert to image server URL
  if (url.startsWith('/tmp/')) {
    const filename = url.substring(5); // Remove /tmp/
    return `http://localhost:3001/images/${filename}`;
  }
  
  // 2. custom-uploads path - convert to image server format
  if (url.startsWith('/custom-uploads/')) {
    const filename = url.substring(15); // Remove /custom-uploads/
    return `http://localhost:3001/images/${filename}`;
  }
  
  // 3. Just a filename - assume it's in tmp and use image server
  if (!url.includes('/')) {
    return `http://localhost:3001/images/${url}`;
  }
  
  // 4. Standard public path from frontend - return as is
  if (url.startsWith('/images/')) {
    // Check if this is a relative URL that should point to the image server
    if (!url.startsWith('/images/http')) {
      // Extract filename
      const filename = url.split('/').pop();
      if (filename) {
        return `http://localhost:3001/images/${filename}`;
      }
    }
    return url;
  }
  
  // Default - use as is (likely a public asset)
  return url;
}; 