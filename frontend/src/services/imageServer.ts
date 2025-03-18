import axios from 'axios';

// Create a separate axios instance for the image server
const imageServerUrl = 'http://localhost:3001';

const imageServerAxios = axios.create({
  baseURL: imageServerUrl,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'multipart/form-data',
  }
});

/**
 * Interface for the image upload response
 */
export interface ImageUploadResponse {
  success: boolean;
  message?: string;
  files?: Array<{
    originalName: string;
    filename: string;
    size: number;
    mimetype: string;
    path: string;
  }>;
}

/**
 * Upload images directly to the image server
 * @param formData FormData containing images to upload
 * @returns Promise with uploaded file paths if successful
 */
export const uploadImagesToServer = async (formData: FormData): Promise<ImageUploadResponse> => {
  try {
    const response = await imageServerAxios.post('/upload', formData);
    return response.data;
  } catch (error) {
    console.error('Error uploading images to image server:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message: error.response.data?.message || error.message
      };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload images'
    };
  }
};

/**
 * Check if an image exists on the server
 * @param filename The filename to check
 * @returns Promise with the check result
 */
export const checkImageExists = async (filename: string): Promise<{ exists: boolean; path?: string }> => {
  try {
    const response = await imageServerAxios.get(`/check/${filename}`);
    return response.data;
  } catch (error) {
    console.error('Error checking image existence:', error);
    return { exists: false };
  }
};

/**
 * Get the full URL for an image on the image server
 * @param path The path returned from the image server (e.g. /tmp/filename.jpg)
 * @returns The full URL to the image
 */
export const getImageServerUrl = (path?: string): string => {
  if (!path) return `${imageServerUrl}/images/placeholder.jpg`;
  
  if (path.startsWith('/tmp/')) {
    const filename = path.substring(5); // Remove /tmp/
    return `${imageServerUrl}/images/${filename}`;
  }
  
  if (!path.includes('/')) {
    return `${imageServerUrl}/images/${path}`;
  }
  
  return path;
}; 