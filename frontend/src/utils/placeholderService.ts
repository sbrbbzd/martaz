/**
 * Placeholder Image Service
 * 
 * This service provides a centralized way to manage placeholder images
 * across the application, preventing redundant network requests and
 * providing fallbacks when the image server is unavailable.
 */

// Import the image server configuration
const imageServerUrl = import.meta.env.VITE_IMAGE_SERVER_URL || 
  `http://${import.meta.env.VITE_IMAGE_SERVER_HOST || 'localhost'}:${import.meta.env.VITE_IMAGE_SERVER_PORT || '3001'}${import.meta.env.VITE_IMAGE_SERVER_PATH || '/api/images'}`;

// Placeholder image paths - with absolute URLs as higher priority
const PLACEHOLDER_PATHS = [
  // Use the configured image server URL
  `${imageServerUrl}/placeholder.jpg`,
  `${imageServerUrl}/placeholder-blank.png`,
  // Local static paths as fallbacks (problematic in development with Vite server)
  '/images/placeholder.jpg',
  '/placeholder.jpg'
];

// Base64 encoded tiny placeholder image for extreme fallback
export const BASE64_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// We keep a reference to the selected placeholder to avoid switching during the session
let selectedPlaceholder = '';

/**
 * Get a placeholder image URL
 * This chooses one of the available placeholder options
 */
export function getPlaceholder(): string {
  // Only select once to avoid switching during the session
  if (!selectedPlaceholder) {
    // Use the first item in our priority list
    selectedPlaceholder = PLACEHOLDER_PATHS[0];
  }
  return selectedPlaceholder;
}

/**
 * Set a specific placeholder to use
 * @param path Path to the placeholder image
 */
export function setPlaceholder(path: string): void {
  if (path && typeof path === 'string') {
    selectedPlaceholder = path;
  }
} 