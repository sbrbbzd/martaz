import axios from 'axios';
import { axiosInstance } from './api';

export interface UploadResponseFile {
  path?: string;
  filename?: string;
  url?: string;
  originalName?: string;
  fullUrl?: string;
  status?: string;
  [key: string]: any;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  files?: UploadResponseFile[];
}

// Constants
const DEFAULT_IMAGE_SERVER_URL = import.meta.env.VITE_IMAGE_SERVER_URL || 'http://localhost:3001/api/images';

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
 * @param formData FormData object containing images
 * @param onProgress Optional callback for upload progress
 * @returns Promise with upload response
 */
export const uploadImagesToServer = async (
  formData: FormData,
  onProgress?: (percentage: number) => void
): Promise<UploadResponse> => {
  try {
    // Get auth token
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');

    // Try to determine the appropriate API endpoint
    const apiBaseUrl = import.meta.env.VITE_IMAGE_SERVER_URL || import.meta.env.VITE_API_URL || '/api';
    let uploadUrl = '';

    // Handle different URL path structures
    if (apiBaseUrl.includes('/api/images')) {
      // If the base URL already includes the correct path
      uploadUrl = `${apiBaseUrl}/upload`;
    } else if (apiBaseUrl.endsWith('/images')) {
      uploadUrl = `${apiBaseUrl}/upload`;
    } else if (apiBaseUrl.endsWith('/api')) {
      uploadUrl = `${apiBaseUrl}/images/upload`;
    } else {
      // Add /images/upload path if not already included
      uploadUrl = `${apiBaseUrl}/images/upload`;
    }

    console.log('Uploading images to:', uploadUrl);

    // Check what files are being uploaded
    const uploadFiles = formData.getAll('images');
    console.log(`FormData contains ${uploadFiles.length} files/entries:`);

    uploadFiles.forEach((item, index) => {
      if (item instanceof File) {
        console.log(`  File ${index + 1}: ${item.name}, ${item.type}, ${item.size} bytes`);
      } else if (typeof item === 'string') {
        console.log(`  String ${index + 1}: ${item.length > 50 ? item.substring(0, 50) + '...' : item}`);
      } else {
        console.log(`  Unknown ${index + 1}: ${typeof item}`);
      }
    });

    // Create headers with authentication
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Using auth token for image upload');
    } else {
      console.warn('No auth token found for image upload');
    }

    const response = await axios.post(uploadUrl, formData, {
      headers,
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total && onProgress) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      },
    } as any);

    console.log('Upload response status:', response.status);
    console.log('Upload response data:', JSON.stringify(response.data, null, 2));

    // Standardize the response format
    let standardizedResponse: UploadResponse = {
      success: false,
      message: 'Unknown response format',
      files: []
    };

    // Handle different response formats
    const data = response.data as any;
    if (response.status === 200 || response.status === 201) {
      // First try to determine if it's a success
      const isSuccess = data.success === true ||
        data.status === 'success' ||
        response.status === 200;

      standardizedResponse.success = isSuccess;

      // Try to extract message
      if (data.message) {
        standardizedResponse.message = data.message;
      } else if (data.status && typeof data.status === 'string') {
        standardizedResponse.message = data.status;
      }

      // Now extract files array, with lots of fallbacks for different API formats
      if (data.files && Array.isArray(data.files)) {
        // Standard format: { success: true, files: [...] }
        console.log('Standard files format detected');
        standardizedResponse.files = data.files;
      } else if (data.data && Array.isArray(data.data)) {
        // Alternative format: { success: true, data: [...] }
        console.log('Alternative data array format detected');
        standardizedResponse.files = data.data;
      } else if (Array.isArray(data)) {
        // Direct array format: [...]
        console.log('Direct array format detected');
        standardizedResponse.files = data;
      } else if (data.data && data.data.files && Array.isArray(data.data.files)) {
        // Nested format: { data: { files: [...] } }
        console.log('Nested files format detected');
        standardizedResponse.files = data.data.files;
      } else {
        console.warn('Unexpected upload response format:', data);
        // Try to find any array property that might contain files
        for (const key in data) {
          if (Array.isArray(data[key])) {
            console.log(`Found array in response.data.${key}, using as files`);
            standardizedResponse.files = data[key];
            break;
          }
        }
      }

      // If we couldn't find files array, but the upload was successful,
      // try to construct a files array from other properties
      if (isSuccess && (!standardizedResponse.files || standardizedResponse.files.length === 0)) {
        console.log('Files array is empty or missing, but response indicates success');

        // Try to extract filenames or urls from other properties
        if (data.file) {
          // Single file case
          console.log('Found single file object in response');
          standardizedResponse.files = [data.file];
        } else if (data.url) {
          // Direct URL case
          console.log('Found direct URL in response');
          standardizedResponse.files = [{ url: data.url }];
        } else if (data.filename) {
          // Direct filename case
          console.log('Found direct filename in response');
          standardizedResponse.files = [{ filename: data.filename }];
        } else if (data.path) {
          // Direct path case
          console.log('Found direct path in response');
          standardizedResponse.files = [{ path: data.path }];
        } else if (data.status === 'success' || data.success === true) {
          // Last resort: construct placeholder for success case
          console.log('Constructing placeholder file for success response');

          // Try to extract any string that looks like a filename
          let possiblePath = '';
          for (const key in data) {
            if (typeof data[key] === 'string' &&
              (data[key].includes('/api/images/') ||
                data[key].includes('.jpg') ||
                data[key].includes('.png') ||
                data[key].includes('.jpeg'))) {
              possiblePath = data[key];
              break;
            }
          }

          if (possiblePath) {
            standardizedResponse.files = [{ path: possiblePath }];
          } else {
            // If all else fails, make a generic file object
            const timestamp = new Date().getTime();
            standardizedResponse.files = [{
              path: `/api/images/unknown_${timestamp}.jpg`,
              status: 'success'
            }];
          }
        }
      }

      console.log('Standardized response:', JSON.stringify(standardizedResponse, null, 2));
      return standardizedResponse;
    }

    return {
      success: false,
      message: data.message || 'File upload failed',
      files: []
    };
  } catch (error: any) {
    console.error('Error uploading images:', error);

    // Detailed error logging
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);

      // Handle authentication error
      if (error.response.status === 401) {
        return {
          success: false,
          message: 'Authentication required. Please log in again.',
          files: []
        };
      }
    }

    return {
      success: false,
      message: error.response?.data?.message || error.message || 'File upload failed',
      files: []
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

  // If it's an external URL from randomuser.me, route it through our backend proxy
  if (imagePath.includes('randomuser.me')) {
    // For development
    if (import.meta.env.MODE === 'development') {
      // Encode the URL to pass it as a query parameter
      const encodedUrl = encodeURIComponent(imagePath);
      return `http://localhost:3001/api/proxy?url=${encodedUrl}`;
    } else {
      // For production
      const encodedUrl = encodeURIComponent(imagePath);
      return `/api/proxy?url=${encodedUrl}`;
    }
  }

  // If it's already a full URL (but not randomuser.me), return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Check if in development or production environment
  const isDevelopment = import.meta.env.MODE === 'development';

  // Always use the full URL with correct port for the image server in development
  if (isDevelopment) {
    // Remove any leading slashes for consistency
    const cleanPath = imagePath.replace(/^\/+/, '');

    // If the path already includes 'api/images', don't duplicate it
    if (cleanPath.startsWith('api/images/')) {
      return `http://localhost:3001/${cleanPath}`;
    }

    // Otherwise, ensure the path is properly formatted
    return `${import.meta.env.VITE_IMAGE_SERVER_URL || 'http://localhost:3001/api/images'}/${cleanPath}`;
  }

  // For production, use relative URLs
  return imagePath;
};

export default {
  uploadImagesToServer,
  getImageUrl,
}; 