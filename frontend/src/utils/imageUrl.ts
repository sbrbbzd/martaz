/**
 * Utility functions for handling image URLs
 */

// Constants
const BASE_IMAGE_URL = 'http://localhost:3000/api/images';
const PLACEHOLDER_IMAGE = `${BASE_IMAGE_URL}/placeholder.jpg`;

/**
 * Helper function to get the correct image URL
 * @param url Image URL or path
 * @returns Full image URL
 */
export function getImageUrl(url?: string | null): string {
  // Return placeholder for null/undefined/empty URLs
  if (!url) return PLACEHOLDER_IMAGE;

  // If the URL already starts with http/https, it's already a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Handle various path formats
  if (url.startsWith('/uploads/')) {
    // Extract the filename from /uploads/filename.jpg
    const filename = url.substring('/uploads/'.length);
    return `${BASE_IMAGE_URL}/${filename}`;
  }

  if (url.startsWith('/tmp/')) {
    // Extract the filename from /tmp/filename.jpg
    const filename = url.substring('/tmp/'.length);
    return `${BASE_IMAGE_URL}/${filename}`;
  }
  
  // If it's just a filename or relative path
  if (!url.startsWith('/')) {
    return `${BASE_IMAGE_URL}/${url}`;
  }

  // For paths starting with / but not /uploads/ or /tmp/
  // Extract the filename if it exists in a path like /some/path/filename.jpg
  const filename = url.substring(url.lastIndexOf('/') + 1);
  return `${BASE_IMAGE_URL}/${filename}`;
} 