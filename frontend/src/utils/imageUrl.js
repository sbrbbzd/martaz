// Base64 encoded tiny placeholder image (1x1 pixel transparent PNG)
// This ensures we always have a fallback even if static files aren't available
export const BASE64_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// Import image server config values directly
const imageServerUrl = import.meta.env.VITE_IMAGE_SERVER_URL || 
  `http://${import.meta.env.VITE_IMAGE_SERVER_HOST || 'localhost'}:${import.meta.env.VITE_IMAGE_SERVER_PORT || '3001'}${import.meta.env.VITE_IMAGE_SERVER_PATH || '/api/images'}`;

// Default placeholder image from image server
const DEFAULT_PLACEHOLDER = `${imageServerUrl}/placeholder.jpg`;

export const getImageUrl = (path) => {
  if (!path) return DEFAULT_PLACEHOLDER;
  
  // If it's already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // For relative paths, ensure they start with /
  return path.startsWith('/') ? path : `/${path}`;
}; 