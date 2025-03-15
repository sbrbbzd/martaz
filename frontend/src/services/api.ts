import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';
import axios from 'axios';
import { store } from '../store';

// Define base types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
  order: number;
  isActive: boolean;
  subcategories?: Category[];
  parent?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  condition?: string;
  location: string;
  images?: string[];
  featuredImage?: string;
  status: string;
  isFeatured: boolean;
  isPromoted: boolean;
  promotionEndDate?: string;
  views: number;
  contactPhone?: string;
  contactEmail?: string;
  attributes?: Record<string, any>;
  expiryDate?: string;
  userId: string;
  categoryId: string;
  user?: User;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

// Define response types
export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    listings: T[];
    total: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface SingleResponse<T> {
  status: string;
  data: T;
}

export interface AuthResponse {
  success?: boolean;
  data?: {
    user: User;
    token: string;
  };
  status?: string;
  token?: string;
  user?: User;
}

// Define request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ListingQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  location?: string;
  status?: string;
  search?: string;
  userId?: string;
  favorites?: boolean;
}

// Create the API
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    prepareHeaders: (headers, { getState }) => {
      // Get token from auth state
      const token = (getState() as RootState).auth.token;
      
      // If we have a token, add it to the headers
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      
      return headers;
    },
  }),
  tagTypes: ['Listing', 'Category', 'User'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      // Standard error handling
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error('Login error:', error);
        }
      },
    }),
    
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    
    // User endpoints
    getProfile: builder.query<SingleResponse<User>, void>({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),
    
    updateProfile: builder.mutation<SingleResponse<User>, Partial<User>>({
      query: (userData) => ({
        url: '/users/profile',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    
    // Category endpoints
    getCategories: builder.query<Category[], void>({
      query: () => '/categories',
      transformResponse: (response: { status: string; data: Category[] }) => response.data,
      providesTags: ['Category'],
    }),
    
    getCategoryTree: builder.query<Category[], void>({
      query: () => '/categories/tree',
      transformResponse: (response: { status: string; data: Category[] }) => response.data,
      providesTags: ['Category'],
    }),
    
    getCategory: builder.query<SingleResponse<Category>, string>({
      query: (idOrSlug) => `/categories/${idOrSlug}`,
      providesTags: (result, error, id) => [{ type: 'Category', id }],
    }),
    
    // Listing endpoints
    getListings: builder.query<PaginatedResponse<Listing>, ListingQueryParams>({
      query: (params) => {
        // Convert params to query string
        const queryParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
        
        return `/listings?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result?.data?.listings
          ? [
              ...result.data.listings.map(({ id }) => ({ type: 'Listing' as const, id })),
              { type: 'Listing', id: 'LIST' },
            ]
          : [{ type: 'Listing', id: 'LIST' }],
    }),
    
    getListing: builder.query<SingleResponse<Listing>, string>({
      query: (idOrSlug) => `/listings/${idOrSlug}`,
      providesTags: (result, error, id) => [{ type: 'Listing', id }],
    }),
    
    getFeaturedListings: builder.query<{ status: string; data: Listing[] }, number | void>({
      query: (limit = 8) => `/listings/featured?limit=${limit}`,
      transformResponse: (response: { status: string; data: Listing[] }) => response,
      providesTags: (result) => 
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Listing' as const, id })),
              { type: 'Listing', id: 'FEATURED' },
            ]
          : [{ type: 'Listing', id: 'FEATURED' }],
    }),
    
    getMyListings: builder.query<PaginatedResponse<Listing>, ListingQueryParams>({
      query: (params) => {
        // Convert params to query string
        const queryParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
        
        return `/listings/user/my-listings?${queryParams.toString()}`;
      },
      providesTags: [{ type: 'Listing', id: 'MY_LISTINGS' }],
    }),
    
    createListing: builder.mutation<SingleResponse<Listing>, Partial<Listing>>({
      query: (listing) => ({
        url: '/listings',
        method: 'POST',
        body: listing,
      }),
      invalidatesTags: [{ type: 'Listing', id: 'LIST' }, { type: 'Listing', id: 'MY_LISTINGS' }],
    }),
    
    updateListing: builder.mutation<SingleResponse<Listing>, { id: string; listing: Partial<Listing> }>({
      query: ({ id, listing }) => ({
        url: `/listings/${id}`,
        method: 'PUT',
        body: listing,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Listing', id },
        { type: 'Listing', id: 'LIST' },
        { type: 'Listing', id: 'MY_LISTINGS' },
      ],
    }),
    
    deleteListing: builder.mutation<{ status: string; message: string }, string>({
      query: (id) => ({
        url: `/listings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Listing', id: 'LIST' }, { type: 'Listing', id: 'MY_LISTINGS' }],
    }),
    
    changeListingStatus: builder.mutation<SingleResponse<Listing>, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/listings/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Listing', id },
        { type: 'Listing', id: 'LIST' },
        { type: 'Listing', id: 'MY_LISTINGS' },
      ],
    }),
    
    // Favorites endpoints
    toggleFavorite: builder.mutation<{ status: string; message: string }, string>({
      query: (id) => ({
        url: `/listings/${id}/favorite`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Listing', id },
        { type: 'Listing', id: 'LIST' },
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetCategoriesQuery,
  useGetCategoryTreeQuery,
  useGetCategoryQuery,
  useGetListingsQuery,
  useGetListingQuery,
  useGetFeaturedListingsQuery,
  useGetMyListingsQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useChangeListingStatusMutation,
  useToggleFavoriteMutation,
} = api;

// Create axios instance with configuration
export const axiosInstance = axios.create({
  // Using import.meta.env for Vite environment variables
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Comment out the debug logging
// console.log('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:3000/api');

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth?.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (logout user)
    if (error.response?.status === 401) {
      store.dispatch({ type: 'auth/logout' });
    }
    
    return Promise.reject(error);
  }
);

// You could also add specific API methods here as named exports 