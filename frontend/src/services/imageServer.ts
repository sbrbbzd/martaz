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

// Constants
const DEFAULT_IMAGE_SERVER_URL = 'http://localhost:3000/api/images';

/**
 * Upload images to the image server
 * @param files Files to upload
 * @returns Response from the image server
 */
export async function uploadImages(files: File[]): Promise<any> {
  try {
    // Create FormData object for file upload
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    // Get environment variable or use default URL for the upload endpoint
    const uploadUrl = import.meta.env.VITE_IMAGE_SERVER_URL 
      ? `${import.meta.env.VITE_IMAGE_SERVER_URL}/upload`
      : `${DEFAULT_IMAGE_SERVER_URL}/upload`;

    // Make the upload request
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    // Check if request was successful
    if (!response.ok) {
      throw new Error(`Failed to upload images: ${response.statusText}`);
    }

    // Parse and return the response
    return await response.json();
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
}

/**
 * Get the full URL for an image path
 * @param imagePath Path to the image
 * @returns Full URL to the image
 */
export function getImageServerUrl(imagePath: string): string {
  // If the path already has a protocol, return it as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // If the path starts with a slash, ensure we don't add another one
  const normalizedPath = imagePath.startsWith('/') 
    ? imagePath.substring(1) 
    : imagePath;

  // Use environment variable or default URL
  return `${import.meta.env.VITE_IMAGE_SERVER_URL || DEFAULT_IMAGE_SERVER_URL}/${normalizedPath}`;
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
    
    // Use the image server URL from environment or default
    const endpoint = `${import.meta.env.VITE_IMAGE_SERVER_URL || DEFAULT_IMAGE_SERVER_URL}/upload`;
    
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
    return `${import.meta.env.VITE_IMAGE_SERVER_URL || DEFAULT_IMAGE_SERVER_URL}/${imagePath}`;
  }
  
  // For production or if the path already includes /api/, use relative URLs
  return imagePath;
};

export default {
  uploadImagesToServer,
  getImageUrl,
}; 