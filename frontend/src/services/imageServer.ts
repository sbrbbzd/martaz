import axios from 'axios';
import { axiosInstance } from './api';

// Define interface for successful upload response
export interface UploadResponse {
  success: boolean;
  message?: string;
  files?: {
    originalName: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
  }[];
}

/**
 * Upload images to the server
 * @param formData FormData containing images to upload
 * @returns Promise with upload response
 */
export const uploadImagesToServer = async (formData: FormData): Promise<UploadResponse> => {
  try {
    // Check if in development or production environment
    const isDevelopment = import.meta.env.MODE === 'development';
    
    // Use the appropriate endpoint - in development, we use the standalone image server
    // In production, we use the integrated image server
    const endpoint = isDevelopment
      ? `${import.meta.env.VITE_IMAGE_SERVER_URL || 'http://localhost:3001'}/upload`
      : '/api/images/upload';
    
    console.log(`Uploading images to ${endpoint}...`);
    
    // Use axios instance for the request
    const response = await axiosInstance.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Log the response
    console.log('Image upload response:', response.data);
    
    // Return standardized response
    return {
      success: true,
      message: response.data.message,
      files: response.data.files,
    };
  } catch (error) {
    console.error('Error uploading images:', error);
    
    // Return error response
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload images',
    };
  }
};

/**
 * Get the full URL for an image
 * @param imagePath The path to the image (e.g. /api/images/filename.jpg)
 * @returns The full URL to the image
 */
export const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) return '/placeholder.jpg';
  
  // If it's already a full URL, return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Check if in development or production environment
  const isDevelopment = import.meta.env.MODE === 'development';
  
  // In development, we need to use the full image server URL
  if (isDevelopment && !imagePath.startsWith('/api/')) {
    return `${import.meta.env.VITE_IMAGE_SERVER_URL || 'http://localhost:3001'}/${imagePath}`;
  }
  
  // For production or if the path already includes /api/, use relative URLs
  return imagePath;
};

export default {
  uploadImagesToServer,
  getImageUrl,
}; 