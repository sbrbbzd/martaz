import axios from 'axios';
import { API_BASE_URL } from './api';

/**
 * Utility function to make authenticated API requests
 * @param endpoint - API endpoint to fetch from
 * @param method - HTTP method (GET, POST, PUT, DELETE)
 * @param data - Optional data to send with request
 * @returns Promise with the API response
 */
export const fetchWithAuth = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('No authentication token found in localStorage');
    }

    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    console.log(`Making ${method} request to: ${url}`);
    console.log('Request headers:', headers);
    if (data) console.log('Request data:', data);

    const config: any = {
      method,
      headers,
      url,
      data: method !== 'GET' ? data : undefined
    };
    const response = await axios(config);
    console.log(`Response from ${endpoint}:`, response.status, response.data);
    return response.data;
  } catch (error: any) {
    // Handle error
    console.error(`API error for ${endpoint}:`, error);

    if (error.response) {
      // Log more details about the error response
      console.error(`Status: ${error.response.status}`, error.response.data);
      return error.response.data;
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }

    // Generic error object for network errors
    return {
      success: false,
      message: error.message || 'Network error occurred'
    };
  }
};