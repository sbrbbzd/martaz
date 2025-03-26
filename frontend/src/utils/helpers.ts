/**
 * Converts a relative image path to a full URL
 * @param path - The image path
 * @param fallback - Optional fallback image if path is empty
 * @returns Full URL to the image
 */

// Create a global cache to track failed image loads
const failedImageCache: Record<string, boolean> = {};

// Save the cache to sessionStorage (more appropriate for navigation)
const saveFailedImagesToStorage = (() => {
  let timeoutId: number | null = null;
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      try {
        sessionStorage.setItem('failedImageCache', JSON.stringify(failedImageCache));
        timeoutId = null;
      } catch (e) {
        console.error('Error saving failed image cache to sessionStorage:', e);
      }
    }, 500);
  };
})();

// Load failed images from sessionStorage on page load
const loadFailedImagesFromStorage = (): void => {
  try {
    const savedCache = sessionStorage.getItem('failedImageCache');
    if (savedCache) {
      const parsed = JSON.parse(savedCache);
      Object.assign(failedImageCache, parsed);
    }
  } catch (e) {
    console.error('Error loading failed image cache from sessionStorage:', e);
  }
};

// Initialize cache on module load
loadFailedImagesFromStorage();

// Image URL helpers
const IMAGE_SERVER_URL = import.meta.env.VITE_IMAGE_SERVER_URL || 'http://localhost:3001/api/images';
const IMAGE_SERVER_BASE_URL = IMAGE_SERVER_URL.endsWith('/') ? IMAGE_SERVER_URL.slice(0, -1) : IMAGE_SERVER_URL;
const PLACEHOLDER_IMAGE = `${IMAGE_SERVER_BASE_URL}/placeholder.jpg`;

// Cache for constructed image URLs
const imageUrlCache = new Map<string, string>();

/**
 * Get the base URL for the image server
 * @returns The base URL for the image server
 */
export function getImageServerBaseUrl(): string {
  return IMAGE_SERVER_BASE_URL;
}

/**
 * Get the URL for the placeholder image
 * @returns The URL for the placeholder image
 */
export function getPlaceholderImageUrl(): string {
  return PLACEHOLDER_IMAGE;
}

/**
 * Convert a relative path to a full image URL
 * @param path - The image path or URL
 * @returns The properly formatted URL
 */
export function getImageUrl(path?: string | null, fallback: string = PLACEHOLDER_IMAGE): string {
  // Check cache first to avoid repeated processing
  if (path && imageUrlCache.has(path)) {
    return imageUrlCache.get(path)!;
  }

  try {
    // Handle invalid inputs
    if (!path || typeof path !== 'string' || path === 'null' || path === 'undefined' || path.trim() === '') {
      return fallback;
    }

    // Clean the path
    let cleanPath = path.trim()
      .replace(/[{}]/g, '') // Remove curly braces
      .replace(/^\/+/, '') // Remove leading slashes
      .replace(/^(api\/images\/|uploads\/|tmp\/)/i, ''); // Remove common prefixes

    // Handle special URLs
    if (cleanPath.startsWith('data:') || cleanPath.startsWith('blob:')) {
      return cleanPath;
    }

    // Handle full URLs
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      // If URL is from Vite dev server, redirect to image server
      if (cleanPath.includes(':5173')) {
        const filename = cleanPath.split('/').pop();
        return filename ? `${IMAGE_SERVER_BASE_URL}/${filename}` : fallback;
      }
      return cleanPath;
    }

    // Handle UUID-style paths (with or without extension)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.[a-z]+)?$/i;
    if (uuidPattern.test(cleanPath) || (cleanPath.includes('/') && uuidPattern.test(cleanPath.split('/').pop() || ''))) {
      const filename = cleanPath.split('/').pop();
      const url = filename ? `${IMAGE_SERVER_BASE_URL}/${filename}` : fallback;
      
      // Cache the result
      if (path) {
        imageUrlCache.set(path, url);
      }
      
      return url;
    }

    // For all other cases, ensure full URL with base
    const fullUrl = cleanPath.startsWith(IMAGE_SERVER_BASE_URL) 
      ? cleanPath 
      : `${IMAGE_SERVER_BASE_URL}/${cleanPath}`;
    
    // Cache the result
    if (path) {
      imageUrlCache.set(path, fullUrl);
    }
    
    return fullUrl;

  } catch (error) {
    console.error('Error constructing image URL:', error, 'Path:', path);
    return fallback;
  }
}

/**
 * Format price with currency symbol and thousands separator
 * @param value - The price value
 * @param currency - Currency code (default: AZN)
 * @returns Formatted price string
 */
export const formatPrice = (value?: number | string, currency: string = 'AZN'): string => {
  if (value === undefined || value === null) return '';
  
  // If value is a string, try to convert to number
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // If conversion failed or NaN, return empty string
  if (isNaN(numValue)) return '';
  
  // Use ₼ symbol for AZN
  if (currency === 'AZN') {
    return `₼ ${numValue.toLocaleString('az-AZ')}`;
  }
  
  return `${currency} ${numValue.toLocaleString('az-AZ')}`;
};

/**
 * Format date to localized string
 * @param date - Date string or object
 * @param locale - Locale for formatting (default: az)
 * @returns Formatted date string
 */
export const formatDate = (date?: string | Date, locale: string = 'az'): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
};

/**
 * Marks an image URL as failed to prevent further loading attempts
 * @param url - The image URL that failed to load
 */
export const markImageAsFailed = (imagePath: string) => {
  if (!imagePath) return;
  
  try {
    failedImageCache[imagePath] = true;
    saveFailedImagesToStorage();
  } catch (e) {
    console.error('Error marking image as failed:', e);
  }
};

/**
 * Checks if an image URL is already known to fail
 * @param url - The image URL to check
 * @returns Boolean indicating if the image is known to fail
 */
export const isFailedImage = (imagePath: string): boolean => {
  return !!failedImageCache[imagePath];
};

/**
 * Clears the failed image cache and forces a reload of all images
 */
export const clearFailedImageCache = (): void => {
  Object.keys(failedImageCache).forEach(key => {
    delete failedImageCache[key];
  });
  sessionStorage.removeItem('failedImageCache');
  
  // Clear any image URL caches
  clearImageCaches();
  
  console.log('Image caches cleared');
};

/**
 * Clears browser cache for images and forces reload
 * This is a last resort for troubleshooting image loading issues
 */
export const forceReloadImages = (): void => {
  // Clear failed image cache
  clearFailedImageCache();
  
  // Force reload the page
  window.location.reload();
  
  console.log('Forcing reload of all images...');
};

// Utility to clear image caches if needed
export const clearImageCaches = () => {
  try {
    // Clear failed images
    sessionStorage.removeItem('failedImages');
    
    // Clear image URL caches
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('img_url_') || key.startsWith('img_path_')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('Image caches cleared');
  } catch (e) {
    console.error('Error clearing image caches:', e);
  }
};

// Add event listener for page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Reload failed images cache when page becomes visible again
    loadFailedImagesFromStorage();
  }
});

// Add a function to clear the URL cache if needed
export function clearImageUrlCache(): void {
  imageUrlCache.clear();
} 