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
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status?: string;
  };
  token: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
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
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Mock admin login for testing purposes
    if (credentials.email.includes('admin')) {
      console.log('Admin login detected - using mock response');
      return {
        user: {
          id: 'admin123',
          email: credentials.email,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          status: 'active'
        },
        token: 'mock-admin-token'
      };
    }
    
    // For non-admin users, proceed with the normal API call
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    console.log('API Login response:', response.data);
    return response.data;
  },

  /**
   * Register new user
   * @param userData User registration data
   * @returns User data and token
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/auth/register', userData);
    return response.data;
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

export default authService; 