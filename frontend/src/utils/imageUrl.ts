/**
 * Utility functions for handling image URLs
 */

// Constants
const IMAGE_SERVER_HOST = import.meta.env.VITE_IMAGE_SERVER_HOST || 'localhost';
const IMAGE_SERVER_PORT = import.meta.env.VITE_IMAGE_SERVER_PORT || '3001';
const IMAGE_SERVER_PATH = import.meta.env.VITE_IMAGE_SERVER_PATH || '/api/images';
const DEV_SERVER_PORT = import.meta.env.VITE_DEV_SERVER_PORT || '5173';

// Build the full base URL for the image server - prioritize VITE_IMAGE_SERVER_URL if available
const BASE_IMAGE_URL = import.meta.env.VITE_IMAGE_SERVER_URL || 
  `http://${IMAGE_SERVER_HOST}:${IMAGE_SERVER_PORT}${IMAGE_SERVER_PATH}`;

const PLACEHOLDER_IMAGE = '/placeholder.jpg';
const DEFAULT_PLACEHOLDER = '/images/placeholder.jpg';

/**
 * Export image server configuration for use in other components
 */
export function getImageServerConfig() {
  return {
    host: IMAGE_SERVER_HOST,
    port: IMAGE_SERVER_PORT,
    path: IMAGE_SERVER_PATH,
    url: BASE_IMAGE_URL,
    devServerPort: DEV_SERVER_PORT
  };
}

// Track if the image server is available
let imageServerAvailable = true;
let lastImageServerCheck = 0;
const CHECK_INTERVAL = 10000; // 10 seconds between availability checks

/**
 * Check if image server is available
 * @returns Promise that resolves to a boolean
 */
async function checkImageServer(): Promise<boolean> {
  try {
    const now = Date.now();
    // Only check if it's been a while since our last check
    if (now - lastImageServerCheck < CHECK_INTERVAL) {
      return imageServerAvailable;
    }
    
    lastImageServerCheck = now;
    
    // Try to fetch a specific image from the server
    const response = await fetch(`${BASE_IMAGE_URL}/placeholder.jpg`, {
      method: 'HEAD', // Just check headers, don't download the image
      cache: 'no-store', // Don't use cache for this check
      mode: 'no-cors', // Try to avoid CORS issues
    });
    
    imageServerAvailable = response.ok;
    return imageServerAvailable;
  } catch (error) {
    console.warn('Error checking image server:', error);
    imageServerAvailable = false;
    return false;
  }
}

// Check image server availability when this module loads
checkImageServer().catch(console.error);

/**
 * Utility function to get the proper URL for an image path
 * Handles both relative and absolute paths, and returns a fallback for invalid inputs
 */
export const getImageUrl = (path: string | null | undefined, fallback: string = PLACEHOLDER_IMAGE): string => {
  try {
    // Handle invalid inputs
    if (!path || typeof path !== 'string' || path === 'null' || path === 'undefined' || path.trim() === '') {
      console.warn('Invalid image path, using fallback', { originalPath: path });
      return fallback;
    }
    
    // Clean the path first
    let cleanPath = path.trim();
    
    // Handle curly braces in image paths - common issue with certain UUID formats
    if (cleanPath.includes('{') && cleanPath.includes('}')) {
      cleanPath = cleanPath.replace(/[{}]/g, '');
    }
    
    // Handle blob URLs
    if (cleanPath.startsWith('blob:')) {
      return cleanPath;
    }
    
    // Handle data URLs
    if (cleanPath.startsWith('data:')) {
      return cleanPath;
    }
    
    // Handle absolute URLs (http/https)
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      // If URL is from our Vite dev server, redirect to image server
      if (cleanPath.includes(':5173')) {
        const filename = cleanPath.split('/').pop();
        if (filename) {
          return `${BASE_IMAGE_URL}/${filename}`;
        }
      }
      return cleanPath;
    }
    
    // Handle UUID-style paths (with or without extension)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.[a-z]+)?$/i;
    if (uuidPattern.test(cleanPath) || (cleanPath.includes('/') && uuidPattern.test(cleanPath.split('/').pop() || ''))) {
      const filename = cleanPath.split('/').pop();
      return `${BASE_IMAGE_URL}/${filename}`;
    }
    
    // Handle paths that start with /api/images/
    if (cleanPath.startsWith('/api/images/')) {
      const filename = cleanPath.split('/api/images/').pop();
      if (filename) {
        return `${BASE_IMAGE_URL}/${filename}`;
      }
    }
    
    // Handle static files in public directory
    if (cleanPath.startsWith('/public/') || cleanPath === '/placeholder.jpg' || cleanPath === '/images/placeholder.jpg') {
      return cleanPath;
    }
    
    // Handle paths that start with a slash
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // For all other cases, assume it's a relative path and combine with base URL
    return `${BASE_IMAGE_URL}/${cleanPath}`;
  } catch (error) {
    console.error('Error processing image URL:', error);
    return fallback;
  }
};

/**
 * Helper function to get the correct image URL
 * @param url Image URL or path
 * @returns Full image URL
 */
export function getImageUrlOld(url?: string | null): string {
  // Return placeholder for null/undefined/empty URLs
  if (!url || url === 'null') {
    // First try static placeholder, and if server isn't available, use public placeholder
    return imageServerAvailable ? `${BASE_IMAGE_URL}/placeholder.jpg` : PLACEHOLDER_IMAGE;
  }

  // Handle blob URLs (for file previews)
  if (url.startsWith('blob:')) {
    return url;
  }
  
  // Handle data URLs (inline images)
  if (url.startsWith('data:')) {
    return url;
  }

  // If the URL already starts with http/https, it's already a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // For static files in the public folder
  if (url.startsWith('/public/') || url === '/placeholder.jpg' || url === '/images/placeholder.jpg') {
    return url;
  }

  // Handle uploads path format
  if (url.startsWith('/uploads/')) {
    // Extract the filename from /uploads/filename.jpg
    const filename = url.substring('/uploads/'.length);
    return imageServerAvailable ? `${BASE_IMAGE_URL}/${filename}` : PLACEHOLDER_IMAGE;
  }
  
  // For backward compatibility - handle /tmp/ path format
  if (url.startsWith('/tmp/')) {
    // Extract the filename from /tmp/filename.jpg
    const filename = url.substring('/tmp/'.length);
    return imageServerAvailable ? `${BASE_IMAGE_URL}/${filename}` : PLACEHOLDER_IMAGE;
  }
  
  // If it's just a filename or relative path
  if (!url.startsWith('/')) {
    return imageServerAvailable ? `${BASE_IMAGE_URL}/${url}` : PLACEHOLDER_IMAGE;
  }

  // For paths starting with / but not /uploads/
  // Extract the filename if it exists in a path like /some/path/filename.jpg
  const filename = url.substring(url.lastIndexOf('/') + 1);
  return imageServerAvailable ? `${BASE_IMAGE_URL}/${filename}` : PLACEHOLDER_IMAGE;
}

// Update this function to use the environment variable for the API base URL
export function getRandomUserImageUrl(seed: string): string {
  // Get the correct API base depending on environment
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  
  // Check if we're dealing with an absolute URL
  const isAbsoluteUrl = seed.startsWith('http://') || seed.startsWith('https://');
  
  // If it's already an absolute URL and from randomuser.me, route through proxy
  if (isAbsoluteUrl && seed.includes('randomuser.me')) {
    // Use our proxy endpoint
    const encodedUrl = encodeURIComponent(seed);
    return `${apiBase}/proxy?url=${encodedUrl}`;
  }
  
  // Otherwise return the original seed
  return seed;
}