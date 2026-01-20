import axios from 'axios';

// Base URL for API requests
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Base URL for image server
export const IMAGE_SERVER_URL = process.env.REACT_APP_IMAGE_SERVER_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases here
    if (error.response && error.response.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Get a properly formatted image URL that works across environments
 * @param imagePath - The image path or filename
 * @returns The properly formatted URL
 */
export function getImageUrl(imagePath: string | undefined): string {
  if (!imagePath) return '';

  // If it's already a full URL, return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

  // Join with image server URL
  return `${IMAGE_SERVER_URL}/${cleanPath}`;
}

export default api; 