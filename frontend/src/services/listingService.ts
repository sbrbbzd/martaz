import axios from 'axios';

interface ListingData {
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  categoryId: string;
  condition: string;
  images: string[];
}

/**
 * Various possible response formats from the backend
 */
export interface ListingResponse {
  success: boolean;
  message?: string;
  listing?: {
    id: string;
    [key: string]: any;
  };
  id?: string;
  data?: {
    id: string;
    [key: string]: any;
  };
}

export interface ListingFormData {
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  location: string;
  categoryId: string;
  contactPhone: string;
  contactEmail: string;
  images: string[];
}

/**
 * Create a new listing
 */
export const createListing = async (data: ListingFormData): Promise<ListingResponse> => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    // Set up headers with authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Using auth token from localStorage');
    } else {
      console.warn('No auth token found in localStorage');
    }
    
    const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
    console.log(`Sending create listing request to: ${apiBaseUrl}/listings`, data);
    
    // Make API request with explicit headers
    const response = await axios.post(`${apiBaseUrl}/listings`, data, { headers });
    console.log('Raw axios response:', response);
    
    // If response.data has a standard format, return it directly
    if (response.data && 
        (response.data.success === true || 
         response.data.status === 'success' || 
         response.data.success === undefined)) {
      // Ensure we have a success flag set
      const result = {
        success: true,
        ...response.data
      };
      
      // Log the response before returning
      console.log('Processed response in createListing:', result);
      return result;
    }
    
    // If we got here, format is unexpected
    console.warn('Unexpected response format in createListing:', response.data);
    return {
      success: false,
      message: 'Unexpected response format from server'
    };
  } catch (error: any) {
    console.error('Error creating listing:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      
      // Handle different error formats
      if (error.response.status === 401) {
        console.error('Authentication error - unauthorized');
        return {
          success: false,
          message: 'You are not authorized. Please log in again.'
        };
      }
      
      if (error.response.data) {
        // If response has a data object with message
        if (error.response.data.message) {
          return {
            success: false,
            message: error.response.data.message
          };
        }
        
        // If response has a direct error message
        if (typeof error.response.data === 'string') {
          return {
            success: false,
            message: error.response.data
          };
        }
      }
    }
    
    // Generic error handling
    return {
      success: false,
      message: error.message || 'Unknown error occurred'
    };
  }
};

/**
 * Update an existing listing
 */
export const updateListing = async (id: string, listingData: Partial<ListingData>): Promise<ListingResponse> => {
  try {
    const response = await axios.put(`/api/listings/${id}`, listingData);
    
    if (response.status === 200) {
      return {
        success: true,
        listing: response.data
      };
    }
    
    return {
      success: false,
      message: response.data.message || 'Failed to update listing'
    };
  } catch (error: any) {
    console.error('Error updating listing:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'An error occurred while updating the listing'
    };
  }
};

/**
 * Get a single listing by ID
 */
export const getListing = async (id: string): Promise<ListingResponse> => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
    const endpointUrl = `${apiBaseUrl}/listings/${id}`;
    
    console.log(`Fetching listing from: ${endpointUrl}`);
    
    const response = await axios.get(endpointUrl);
    console.log('Listing fetch response:', response);
    
    // Handle different response formats
    if (response.data) {
      if (response.data.success === true || response.data.status === 'success') {
        // If the response has a success flag, use its structure
        return response.data;
      } else if (response.data.id || response.data._id) {
        // If it's a direct listing object with ID
        return {
          success: true,
          listing: response.data
        };
      } else {
        // For any other format, assume it's the listing object
        return {
          success: true,
          listing: response.data
        };
      }
    }
    
    // If response has no data, return error
    return {
      success: false,
      message: 'Received empty response from server'
    };
  } catch (error: any) {
    console.error('Error fetching listing:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      
      // If 404, provide specific not found message
      if (error.response.status === 404) {
        return {
          success: false,
          message: `Listing with ID ${id} not found`
        };
      }
    }
    
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to fetch listing'
    };
  }
};

/**
 * Get all listings for the current user
 */
export const getMyListings = async (): Promise<any> => {
  try {
    const response = await axios.get('/api/users/listings');
    
    if (response.status === 200) {
      return {
        success: true,
        listings: response.data
      };
    }
    
    return {
      success: false,
      message: response.data.message || 'Failed to fetch listings'
    };
  } catch (error: any) {
    console.error('Error fetching listings:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'An error occurred while fetching listings'
    };
  }
};

/**
 * Delete a listing
 */
export const deleteListing = async (id: string): Promise<ListingResponse> => {
  try {
    const response = await axios.delete(`/api/listings/${id}`);
    
    if (response.status === 200) {
      return {
        success: true
      };
    }
    
    return {
      success: false,
      message: response.data.message || 'Failed to delete listing'
    };
  } catch (error: any) {
    console.error('Error deleting listing:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'An error occurred while deleting the listing'
    };
  }
}; 