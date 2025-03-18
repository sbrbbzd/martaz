import { axiosInstance } from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface AuthResponse {
  success?: boolean;
  data?: {
    user: User;
    token: string;
  };
  user?: User;
  token?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
}

// Normalized response that ensures user and token are always present
interface NormalizedAuthResponse {
  user: User;
  token: string;
}

// Function to normalize API responses to a consistent format
function normalizeAuthResponse(response: AuthResponse): NormalizedAuthResponse {
  if (response.success && response.data) {
    return {
      user: response.data.user,
      token: response.data.token
    };
  }
  
  if (response.user && response.token) {
    return {
      user: response.user,
      token: response.token
    };
  }
  
  throw new Error('Invalid auth response format');
}

/**
 * Service for handling authentication-related API calls
 */
const authService = {
  /**
   * Login user
   * @param credentials User credentials
   * @returns User data and token
   */
  async login(credentials: LoginCredentials): Promise<NormalizedAuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    console.log('API Login response:', response.data);
    return normalizeAuthResponse(response.data);
  },

  /**
   * Register new user
   * @param userData User registration data
   * @returns User data and token
   */
  async register(userData: RegisterData): Promise<NormalizedAuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/auth/register', userData);
    return normalizeAuthResponse(response.data);
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await axiosInstance.post('/auth/logout');
    // Clear local storage or cookies if needed
  },

  /**
   * Request password reset
   * @param email User email
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await axiosInstance.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   * @param token Reset token
   * @param password New password
   */
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await axiosInstance.post<{ message: string }>('/auth/reset-password', { token, password });
    return response.data;
  },

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<{ token: string }> {
    const response = await axiosInstance.post<{ token: string }>('/auth/refresh-token');
    return response.data;
  },

  /**
   * Update user profile
   * @param userData User data to update
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await axiosInstance.put<User>('/users/profile', userData);
    return response.data;
  },

  /**
   * Update profile image
   * @param formData Form data with image file
   */
  async updateProfileImage(formData: FormData): Promise<{ profileImage: string }> {
    const response = await axiosInstance.post<{ profileImage: string }>('/users/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

// Function to extract auth token from storage or response
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

// Helper function to debug token and user info
export const debugAuthState = () => {
  const token = getAuthToken();
  const authState = localStorage.getItem('authState');
  
  console.log('==== AUTH DEBUG ====');
  console.log('Token exists:', !!token);
  console.log('Auth state exists:', !!authState);
  
  if (authState) {
    try {
      const parsed = JSON.parse(authState);
      console.log('User in auth state:', parsed.user ? `ID: ${parsed.user.id}` : 'No user');
      console.log('Token in auth state:', !!parsed.token);
      
      return {
        token: parsed.token,
        user: parsed.user
      };
    } catch (e) {
      console.error('Error parsing auth state:', e);
    }
  }
  
  return null;
};

export default authService; 