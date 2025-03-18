/**
 * Converts a relative image path to a full URL
 * @param path - The image path
 * @param fallback - Optional fallback image if path is empty
 * @returns Full URL to the image
 */

// Create a global cache to track failed image loads
// Load previously failed images from localStorage
const loadFailedImagesFromStorage = (): Record<string, boolean> => {
  try {
    const savedCache = localStorage.getItem('failedImageCache');
    return savedCache ? JSON.parse(savedCache) : {};
  } catch (e) {
    console.error('Error loading failed image cache from localStorage:', e);
    return {};
  }
};

const failedImageCache: Record<string, boolean> = loadFailedImagesFromStorage();

// Save the cache to localStorage (debounced to avoid excessive writes)
const saveFailedImagesToStorage = (() => {
  let timeoutId: number | null = null;
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      try {
        localStorage.setItem('failedImageCache', JSON.stringify(failedImageCache));
        timeoutId = null;
      } catch (e) {
        console.error('Error saving failed image cache to localStorage:', e);
      }
    }, 500);
  };
})();

export const getFullImageUrl = (path?: string, fallback: string = ''): string => {
  if (!path) return fallback;
  
  // If the image is already cached as failed, return fallback immediately
  if (failedImageCache[path]) {
    return fallback || '/images/placeholder.jpg';
  }
  
  // If already a full URL, return as is
  if (path.startsWith('http')) return path;
  
  // If a relative path from the public folder, return as is
  if (path.startsWith('/images/')) return path;
  
  // For tmp uploads, use the image server
  if (path.startsWith('/tmp/')) {
    const filename = path.substring(5); // Remove /tmp/
    return `http://localhost:3001/images/${filename}`;
  }
  
  // Handle legacy custom-uploads paths
  if (path.startsWith('/custom-uploads/')) {
    const filename = path.replace('/custom-uploads/', '');
    return `http://localhost:3001/images/${filename}`;
  }
  
  // If uploads from the default directory
  if (path.startsWith('/uploads/')) {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${backendUrl}${path}`;
  }
  
  // If it's just a filename, assume it's in the tmp directory
  if (!path.startsWith('/')) {
    return `http://localhost:3001/images/${path}`;
  }
  
  // Otherwise, use the default backend URL
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${backendUrl}${path}`;
};

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
export const markImageAsFailed = (url: string): void => {
  if (url) {
    failedImageCache[url] = true;
    // Save to localStorage
    saveFailedImagesToStorage();
    console.log(`Marked image as failed and won't request again: ${url}`);
  }
};

/**
 * Checks if an image URL is already known to fail
 * @param url - The image URL to check
 * @returns Boolean indicating if the image is known to fail
 */
export const isFailedImage = (url: string): boolean => {
  return !!failedImageCache[url];
};

/**
 * Clears the failed image cache
 * Useful for when you want to retry all failed images
 */
export const clearFailedImageCache = (): void => {
  Object.keys(failedImageCache).forEach(key => {
    delete failedImageCache[key];
  });
  localStorage.removeItem('failedImageCache');
  console.log('Cleared failed image cache');
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