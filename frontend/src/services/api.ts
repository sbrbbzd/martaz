import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';
import axios from 'axios';
import { store } from '../store';
import { transformApiError } from '../utils/errorHandling';

// Define base types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
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

export type FeatureDuration = 'day' | 'week' | 'month';

export interface FeatureListingRequest {
  duration: FeatureDuration;
}

export interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  location: string;
  images: string[];
  featuredImage?: string;
  status: string;
  isPromoted?: boolean;
  promotionEndDate?: string;
  views: number;
  contactPhone?: string;
  contactEmail?: string;
  attributes?: Record<string, any>;
  expiryDate?: string;
  userId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  user?: User;
}

// Admin Dashboard Types
export interface AdminDashboardListing {
  id: string;
  title: string;
  user: string;
  category: string;
  createdAt: string;
  price?: number;
  images?: string[];
}

export interface AdminDashboardActivity {
  id: string;
  type: 'user-registered' | 'user-updated' | 'listing-created' | 'listing-reported' | 'listing-sold';
  user: string;
  email?: string;
  role?: string;
  title?: string;
  reporter?: string;
  reason?: string;
  timestamp: string;
}

export interface AdminDashboardData {
  totalUsers: {
    count: number;
  };
  totalListings: {
    count: number;
  };
  pendingListings: AdminDashboardListing[];
  activeCategories: {
    count: number;
    list: string[];
  };
  userGrowth: number;
  listingGrowth: number;
  recentActivity: AdminDashboardActivity[];
  totalRevenue?: number;
}

// Define admin response types
export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminDashboardResponse {
  data: AdminDashboardData;
}

export interface ListingActionResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
  };
}

export interface RejectListingRequest {
  reason?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    listings: T[];
    total: number;
    currentPage: number;
    totalPages: number;
  };
}

// Define response types
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
  promoted?: boolean;
  random?: boolean;
}

// Define missing interfaces
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}

// Import or define missing interfaces
interface UploadListingImagesResponse {
  images: string[];
  listing: {
    id: string;
    images: string[];
  };
}

interface UploadImagesResponse {
  files: Array<{
    filename?: string;
    url?: string;
    path?: string;
  }>;
}

// Export axios instance for direct use in components
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token') || store.getState().auth.token;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Create the API
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api',
    prepareHeaders: (headers, { getState }) => {
      // Add specific debugging for auth
      console.log('Preparing headers for API request');
      
      // Get token from auth state
      const token = (getState() as RootState).auth.token;
      console.log('Token from state:', token ? 'Present (hidden for security)' : 'Not present');
      
      // If we have a token, add it to the headers
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
        console.log('Authorization header set');
      } else {
        console.log('Warning: No auth token available');
      }
      
      return headers;
    },
    responseHandler: async (response) => {
      // Check if the response is JSON before trying to parse it
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        return response.json();
      }
      
      // If it's not JSON, log it and try to return the text
      console.error('Received non-JSON response:', await response.text());
      throw new Error('Non-JSON response received from API');
    }
  }),
  tagTypes: ['Listing', 'Category', 'User', 'FeaturedListings', 'Favorites'],
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
      transformResponse: (response: { status: string; data: Category[] }) => {
        console.log('Raw categories response:', response);
        return response.data;
      },
      providesTags: ['Category'],
      keepUnusedDataFor: 600, // Cache for 10 minutes
      extraOptions: {
        maxRetries: 3,
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getCacheEntry, dispatch }
      ) {
        // Wait for the initial query to resolve before proceeding
        try {
          await cacheDataLoaded;
          // After data is cached, log success
          const currentData = getCacheEntry().data;
          console.log('Categories cached successfully, count:', currentData?.length || 0);
          
          // Store in localStorage as backup
          if (currentData && currentData.length > 0) {
            try {
              localStorage.setItem('cached_categories', JSON.stringify(currentData));
              console.log('Categories saved to localStorage');
            } catch (e) {
              console.error('Failed to cache categories in localStorage:', e);
            }
          }
        } catch (error) {
          // On error, try to load from localStorage
          console.error('Failed to cache categories:', error);
          try {
            const cachedData = localStorage.getItem('cached_categories');
            if (cachedData) {
              const parsedData = JSON.parse(cachedData);
              console.log('Loaded categories from localStorage:', parsedData.length);
              updateCachedData(() => parsedData);
            }
          } catch (e) {
            console.error('Failed to load cached categories from localStorage:', e);
          }
        }
        // Clean up subscription when cache entry is removed
        await cacheEntryRemoved;
      },
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
    getListings: builder.query<any, ListingQueryParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.sort) queryParams.append('sort', params.sort);
        if (params.order) queryParams.append('order', typeof params.order === 'string' ? params.order.toUpperCase() : 'DESC');
        // If category is provided and looks like a slug (not a UUID), use the category slug endpoint
        if (params.category) {
          // Check if the category is a UUID (categoryId) or a slug
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.category);
          
          if (isUuid) {
            // If it's a UUID, use it as categoryId directly
            queryParams.append('categoryId', params.category);
          } else {
            // If it's a slug, use the slug parameter instead
            queryParams.append('categorySlug', params.category);
          }
        }
        if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
        if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
        if (params.condition) queryParams.append('condition', params.condition);
        if (params.location) queryParams.append('location', params.location);
        if (params.status) queryParams.append('status', params.status);
        if (params.search) queryParams.append('search', params.search);
        if (params.userId) queryParams.append('userId', params.userId);
        if (params.favorites) queryParams.append('favorites', 'true');
        if (params.promoted) queryParams.append('promoted', 'true');
        if (params.random) queryParams.append('random', 'true');
        
        const queryString = queryParams.toString();
        console.log('getListings API call:', {
          url: `/listings${queryString ? `?${queryString}` : ''}`,
          params: params
        });
        
        return {
          url: `/listings${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
          responseHandler: (response) => response.json(),
          validateStatus: (response, body) => {
            return response.status >= 200 && response.status < 300;
          },
        };
      },
      transformResponse: (response: any) => {
        console.log('Raw listings response:', response);
        
        // Handle the different possible response formats
        if (response && response.data) {
          if (Array.isArray(response.data)) {
            // Handle array directly in data field
            console.log('Response contains array directly in data field');
            const listings = response.data.map((listing: any) => convertImageUrls(listing));
            return {
              data: {
                listings: listings,
                total: listings.length,
                currentPage: 1,
                totalPages: 1
              }
            };
          } else if (response.data.listings && Array.isArray(response.data.listings)) {
            // Handle standard format with data.listings
            console.log('Response contains standard data.listings format');
            response.data.listings = response.data.listings.map((listing: any) => convertImageUrls(listing));
            return response;
          }
        }
        
        // Handle unexpected format
        console.error('Unexpected response format:', response);
        return {
          data: {
            listings: [],
            total: 0,
            currentPage: 1,
            totalPages: 1
          }
        };
      },
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error('Error fetching listings:', error);
        }
      },
      transformErrorResponse: (response: any) => {
        console.error('Listings API error response:', response);
        return { error: 'Failed to load listings', details: response };
      },
      providesTags: (result) => 
        result && result.data && result.data.listings
          ? [
              ...result.data.listings.map(({ id }: { id: string }) => ({ type: 'Listing' as const, id })),
              { type: 'Listing', id: 'LIST' },
            ]
          : [{ type: 'Listing', id: 'LIST' }],
      // Keep cached data for 5 minutes (300 seconds) to reduce excessive API calls
      keepUnusedDataFor: 300,
      extraOptions: {
        maxRetries: 3,
        retryDelay: (attempt: number) => attempt * 1000, // 1s, 2s, 3s
      },
    }),
    
    getListing: builder.query<any, string>({
      query: (idOrSlug) => `/listings/${idOrSlug}`,
      transformResponse: (response: any) => {
        if (response.data) {
          response.data = convertImageUrls(response.data);
        }
        return response;
      },
      providesTags: (result, error, id) => [{ type: 'Listing', id }],
      // Keep cached data for 5 minutes (300 seconds) to reduce excessive API calls
      keepUnusedDataFor: 300,
    }),
    
    getFeaturedListings: builder.query<PaginatedResponse<Listing>, void>({
      query: () => '/listings/featured',
      providesTags: ['Listing'],
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
        
        // Fix path to match the backend route directly
        return `/users/listings?${queryParams.toString()}`;
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
      query: ({ id, listing }) => {
        console.log('Updating listing:', id);
        console.log('With data:', JSON.stringify(listing));
        
        return {
          url: `/listings/${id}`,
          method: 'PUT',
          body: listing,
        };
      },
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
    
    featureListing: builder.mutation<SingleResponse<Listing>, { id: string; duration: FeatureDuration }>({
      query: ({ id, duration }) => ({
        url: `/listings/${id}/feature`,
        method: 'POST',
        body: { duration },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Listing', id },
        { type: 'Listing', id: 'LIST' },
        { type: 'Listing', id: 'MY_LISTINGS' },
        'FeaturedListings',
      ],
    }),
    
    // Favorites endpoints
    getFavorites: builder.query<PaginatedResponse<Listing>, { page?: number; limit?: number; sort?: string }>({
      query: (params) => ({
        url: 'favorites',
        method: 'GET',
        params,
      }),
      providesTags: ['Favorites'],
    }),

    addFavorite: builder.mutation<any, { itemId: string | number; itemType: 'product' | 'listing' }>({
      query: (body) => ({
        url: 'favorites',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Favorites'],
    }),

    removeFavorite: builder.mutation<any, string | number>({
      query: (id) => ({
        url: `favorites/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Favorites'],
    }),

    checkFavorite: builder.query<{ isFavorite: boolean }, { itemId: string | number; itemType: 'product' | 'listing' }>({
      query: ({ itemId, itemType }) => ({
        url: 'favorites/check',
        method: 'GET',
        params: { itemId, itemType },
      }),
      providesTags: ['Favorites'],
    }),

    getFavorite: builder.query<{ id: string }, { itemId: string | number; itemType: 'product' | 'listing' }>({
      query: ({ itemId, itemType }) => ({
        url: 'favorites/get',
        method: 'GET',
        params: { itemId, itemType },
      }),
      providesTags: ['Favorites'],
    }),
    
    // Legacy toggleFavorite endpoint that uses the new favorites API
    toggleFavorite: builder.mutation<{ status: string; message: string }, string>({
      query: (id) => ({
        url: 'favorites',
        method: 'POST',
        body: { itemId: id, itemType: 'listing' },
      }),
      invalidatesTags: ['Favorites', 'Listing'],
    }),
    
    // Admin endpoints
    getAdminDashboardData: builder.query<AdminDashboardData, void>({
      query: () => '/admin/dashboard/data',
      transformResponse: (response: AdminDashboardResponse) => response.data,
      providesTags: ['User', 'Listing', 'Category'],
      keepUnusedDataFor: 60, // Cache for 60 seconds
    }),
    
    // Import endpoints
    importFromUrl: builder.mutation<{ status: string, message: string, data: Listing }, { url: string, categoryId?: string }>({
      query: (data) => ({
        url: '/import/url',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Listing', id: 'LIST' }],
    }),
    
    getSupportedImportSources: builder.query<{ name: string, domains: string[] }[], void>({
      query: () => '/import/sources',
      transformResponse: (response: { status: string, data: { name: string, domains: string[] }[] }) => response.data,
    }),
    
    getAdminUsers: builder.query<UsersResponse, { page?: number; limit?: number; search?: string; status?: string; role?: string }>({
      query: (params) => ({
        url: '/admin/users',
        params,
      }),
      // Transform the response to handle nested data structure
      transformResponse: (response: any) => {
        console.log('Admin users API response:', response);
        // Check if response has the expected structure
        if (response && response.success && response.data) {
          const { users, total, currentPage, totalPages } = response.data;
          // Map to expected UsersResponse format
          return {
            users,
            total,
            page: currentPage || 1,
            limit: users.length || 10
          };
        }
        // Return as is if response doesn't match expected structure
        return response;
      },
      // Add fallback response when backend returns a 500 error
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
        } catch (rawError) {
          console.error('Admin users API error:', rawError);
          
          // Use our utility to transform the error
          const transformedError = transformApiError(rawError);
          console.log('Transformed error:', transformedError);
          
          // If server returned 500 error or network error, provide mock data
          if (transformedError.type === 'serverError' || transformedError.type === 'networkError') {
            // Create mock user that matches User type
            const createMockUser = (index: number): User => ({
              id: `mock-user-${index}`,
              email: `user${index}@example.com`,
              firstName: `User`,
              lastName: `${index}`,
              phone: index % 2 === 0 ? `+994 50 ${100 + index} ${1000 + index}` : undefined,
              profileImage: index % 3 === 0 ? '/placeholder-avatar.jpg' : undefined,
              role: index === 0 ? 'admin' : index === 1 ? 'moderator' : 'user',
              status: index % 4 === 0 ? 'active' : index % 4 === 1 ? 'inactive' : index % 4 === 2 ? 'suspended' : 'active',
              createdAt: new Date(Date.now() - index * 86400000).toISOString(), // Each user created a day apart
              updatedAt: new Date(Date.now() - index * 43200000).toISOString(), // Each user updated half a day apart
            });
            
            const mockData: UsersResponse = {
              users: Array(8).fill(null).map((_, index) => createMockUser(index)),
              total: 25,
              page: arg.page || 1,
              limit: arg.limit || 10
            };
            
            // Dispatch result manually to update the store with mock data
            dispatch(
              api.util.upsertQueryData(
                'getAdminUsers',
                arg,
                mockData
              )
            );
          }
        }
      },
      providesTags: [{ type: 'User', id: 'LIST' }],
      // Add error handling to transform errors
      transformErrorResponse: (response: any) => {
        const transformedError = transformApiError(response);
        return { message: transformedError.message };
      }
    }),
    
    updateUserStatus: builder.mutation<{ message: string }, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/admin/users/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    
    deleteUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    
    getAdminListings: builder.query<ListingsResponse, { page?: number; limit?: number; search?: string; status?: string; sort?: string }>({
      query: (params) => ({
        url: '/admin/listings',
        params,
      }),
      // Transform the response to handle nested data structure
      transformResponse: (response: any) => {
        console.log('Admin listings API response:', response);
        // Check if response has the expected structure
        if (response && response.success && response.data) {
          const { listings, total, currentPage, totalPages } = response.data;
          // Map to expected ListingsResponse format
          return {
            listings,
            total,
            page: currentPage || 1,
            limit: listings.length || 10
          };
        }
        // Return as is if response doesn't match expected structure
        return response;
      },
      // Add fallback response when backend returns a 500 error
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
        } catch (rawError) {
          console.error('Admin listings API error:', rawError);
          
          // Use our utility to transform the error
          const transformedError = transformApiError(rawError);
          console.log('Transformed error:', transformedError);
          
          // If server returned 500 error or network error, provide mock data
          if (transformedError.type === 'serverError' || transformedError.type === 'networkError') {
            // Create mock listing that matches Listing type
            const createMockListing = (index: number): Listing => ({
              id: `mock-listing-${index}`,
              title: `Mock Listing ${index}`,
              slug: `mock-listing-${index}`,
              description: `This is a mock listing ${index} created as fallback data when the API is unavailable.`,
              price: 100 + (index * 50),
              currency: 'AZN',
              condition: index % 5 === 0 ? 'new' : index % 5 === 1 ? 'like-new' : index % 5 === 2 ? 'good' : index % 5 === 3 ? 'fair' : 'poor',
              location: 'Baku, Azerbaijan',
              status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'pending' : 'inactive',
              images: ['/placeholder-listing.jpg'],
              featuredImage: '/placeholder-listing.jpg',
              isPromoted: index % 5 === 0,
              promotionEndDate: index % 5 === 0 ? new Date(Date.now() + 86400000).toISOString() : undefined,
              views: index * 10,
              userId: `mock-user-${index % 3}`,
              categoryId: `mock-category-${index % 5}`,
              createdAt: new Date(Date.now() - index * 86400000).toISOString(),
              updatedAt: new Date(Date.now() - index * 43200000).toISOString(),
              category: {
                id: `mock-category-${index % 5}`,
                name: `Category ${index % 5}`,
                slug: `category-${index % 5}`,
                description: `Mock category ${index % 5}`,
                icon: undefined,
                image: undefined,
                parentId: null,
                order: index % 5,
                isActive: true,
                createdAt: new Date(Date.now() - 1000000).toISOString(),
                updatedAt: new Date(Date.now() - 500000).toISOString()
              },
              user: {
                id: `mock-user-${index % 3}`,
                email: `user${index % 3}@example.com`,
                firstName: `User`,
                lastName: `${index % 3}`,
                role: 'user',
                status: 'active',
                createdAt: new Date(Date.now() - 2000000).toISOString(),
                updatedAt: new Date(Date.now() - 1000000).toISOString()
              }
            });
            
            const mockData: ListingsResponse = {
              listings: Array(5).fill(null).map((_, index) => createMockListing(index)),
              total: 15,
              page: arg.page || 1,
              limit: arg.limit || 10
            };
            
            // Dispatch result manually to update the store with mock data
            dispatch(
              api.util.upsertQueryData(
                'getAdminListings',
                arg,
                mockData
              )
            );
          }
        }
      },
      providesTags: (result) => 
        result
          ? [
              ...result.listings.map(({ id }) => ({ type: 'Listing' as const, id })),
              { type: 'Listing', id: 'LIST' },
            ]
          : [{ type: 'Listing', id: 'LIST' }],
      // Add error handling to transform errors
      transformErrorResponse: (response: any) => {
        const transformedError = transformApiError(response);
        return { message: transformedError.message };
      }
    }),
    
    approveListing: builder.mutation<ListingActionResponse, string>({
      query: (id) => ({
        url: `/admin/listings/${id}/approve`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Listing', id },
        { type: 'Listing', id: 'LIST' }
      ],
    }),
    
    rejectListing: builder.mutation<ListingActionResponse, { id: string, reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/listings/${id}/reject`,
        method: 'PUT',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Listing', id },
        { type: 'Listing', id: 'LIST' }
      ],
    }),
    
    adminDeleteListing: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/admin/listings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Listing', id: 'LIST' }],
    }),
    
    createCategory: builder.mutation<Category, Partial<Category>>({
      query: (category) => ({
        url: '/admin/categories',
        method: 'POST',
        body: category,
      }),
      invalidatesTags: ['Category'],
    }),
    
    updateCategory: builder.mutation<Category, { id: string } & Partial<Category>>({
      query: ({ id, ...updates }) => ({
        url: `/admin/categories/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' }
      ],
    }),
    
    deleteCategory: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/admin/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
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
  useGetAdminDashboardDataQuery,
  useGetAdminUsersQuery,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  useGetAdminListingsQuery,
  useApproveListingMutation,
  useRejectListingMutation,
  useAdminDeleteListingMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useImportFromUrlMutation,
  useGetSupportedImportSourcesQuery,
  useFeatureListingMutation,
  useGetFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useCheckFavoriteQuery,
  useToggleFavoriteMutation,
  useGetFavoriteQuery,
} = api;

// Comment out the debug logging
// console.log('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:3000/api');

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

/**
 * Compresses an image file to a target size
 * @param {File} file - The image file to compress
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {Promise<Blob>} - Compressed image blob
 */
const compressImage = async (file: File, maxSizeMB: number = 1): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Create an image and canvas element
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    // Create a FileReader to read the file
    const reader = new FileReader();
    
    // Set up the FileReader onload callback
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error('File read failed'));
        return;
      }
      
      // Create an image from the data URL
      img.onload = () => {
        // Calculate dimensions to maintain aspect ratio
        let width = img.width;
        let height = img.height;
        
        // If image is very large, scale it down
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        
        if (width > MAX_WIDTH) {
          height = Math.round(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }
        
        if (height > MAX_HEIGHT) {
          width = Math.round(width * (MAX_HEIGHT / height));
          height = MAX_HEIGHT;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with high quality
        let quality = 0.9;
        let compressedBlob: Blob | null = null;
        
        // Function to get blob from canvas
        const getBlob = (q: number): Promise<Blob> => {
          return new Promise((resolve) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else resolve(new Blob([new Uint8Array(0)], { type: file.type }));
            }, file.type, q);
          });
        };
        
        // Try to compress the image to the target size
        const tryCompress = async () => {
          try {
            // Use a loop instead of recursion to prevent stack overflow
            while (true) {
              compressedBlob = await getBlob(quality);
              
              // If the image is still too large and quality is still good, reduce quality
              if (compressedBlob.size > maxSizeMB * 1024 * 1024 && quality > 0.2) {
                quality -= 0.1;
                continue;
              } else {
                // Return the final compressed blob
                resolve(compressedBlob);
                break;
              }
            }
          } catch (err) {
            reject(err);
          }
        };
        
        tryCompress();
      };
      
      // Set the image source to the data URL
      img.src = event.target.result as string;
    };
    
    // Handle read errors
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    // Read the file as a data URL
    reader.readAsDataURL(file);
  });
};

// Update the interface for image upload response
interface ImageUploadResponse {
  success: boolean;
  message?: string;
  imageUrls?: string[];
  data?: {
    listing: {
      id: string;
      images: string[];
      featuredImage?: string;
    }
  };
  status?: string;
}

/**
 * Upload listing images to the server
 * @param formData FormData containing images to upload
 * @param listingId ID of the listing to upload images for
 * @returns Promise with image URLs if successful
 */
export const uploadListingImages = async (
  listingId: string,
  images: FileList | File[] | string[] | null,
  appendToExisting: boolean = false
): Promise<ApiResponse<UploadListingImagesResponse>> => {
  console.log(`Starting image upload to listing ${listingId}`);
  console.log(`Images type:`, typeof images, Array.isArray(images) ? 'array' : 'not array');
  console.log(`Append to existing:`, appendToExisting);
  
  // If no images, return an error
  if (!images || (Array.isArray(images) && images.length === 0)) {
    console.error('No images provided to uploadListingImages');
    return {
      success: false,
      message: 'No images provided',
      data: null,
    };
  }
  
  try {
    // CASE 1: Handle direct FileList/File[] upload
    if (images instanceof FileList || (Array.isArray(images) && images[0] instanceof File)) {
      console.log(`Uploading ${images.length} files directly`);
      
      // First upload the files to get URLs
      const formData = new FormData();
      
      // Use a type-safe way to add files to FormData
      if (images instanceof FileList) {
        Array.from(images as FileList).forEach((file: File) => {
          console.log(`Adding file to FormData: ${file.name} (${file.size} bytes)`);
          formData.append('images', file);
        });
      } else {
        // It's a File[] array
        (images as File[]).forEach((file: File) => {
          console.log(`Adding file to FormData: ${file.name} (${file.size} bytes)`);
          formData.append('images', file);
        });
      }
      
      console.log('Sending files to /images endpoint');
      const uploadResponse = await axiosInstance.post<ApiResponse<UploadImagesResponse>>(
        '/images',
        formData,
        {
          headers: {
            // Let browser set this automatically for multipart/form-data
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      if (!uploadResponse.data.success) {
        console.error('Error uploading images to image server:', uploadResponse.data.message);
        return {
          success: false,
          message: uploadResponse.data.message || 'Error uploading images',
          data: null,
        };
      }
      
      // Extract image URLs from response
      const imageUrls = uploadResponse.data.data?.files.map(
        (file) => {
          // Get just the filename, without path
          if (file.filename) {
            return file.filename;
          } else if (file.url) {
            // Extract filename from URL if possible
            const urlParts = file.url.split('/');
            return urlParts[urlParts.length - 1];
          } else if (file.path) {
            // Extract filename from path if possible
            const pathParts = file.path.split('/');
            return pathParts[pathParts.length - 1];
          } else {
            // Fallback to full path/URL if we can't extract just the filename
            return file.url || file.path || `/images/${file.filename}`;
          }
        }
      ) || [];
      
      console.log(`Extracted ${imageUrls.length} image URLs:`, imageUrls);
      if (imageUrls.length === 0) {
        console.error('No image URLs returned from image server');
        return {
          success: false,
          message: 'No images returned from server',
          data: null,
        };
      }
      
      // Now attach these URLs to the listing using JSON approach (more reliable)
      console.log(`Sending ${imageUrls.length} image URLs to listing ${listingId}`);
      const listingResponse = await axiosInstance.post<ApiResponse<UploadListingImagesResponse>>(
        `/listings/${listingId}/images`,
        {
          images: imageUrls,
          appendToExisting,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Listing response:', listingResponse.data);
      return {
        success: listingResponse.data.success,
        message: listingResponse.data.message,
        data: listingResponse.data.data || null,
      };
    }
    // CASE 2: Handle string URLs directly
    else if (Array.isArray(images) && typeof images[0] === 'string') {
      console.log(`Sending ${images.length} URLs directly to listing ${listingId}`);
      
      // Send the URLs directly to the listing endpoint
      const response = await axiosInstance.post<ApiResponse<UploadListingImagesResponse>>(
        `/listings/${listingId}/images`,
        {
          images: images,
          appendToExisting,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Listing response with direct URLs:', response.data);
      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data || null,
      };
    }
    // CASE 3: Handle unexpected input
    else {
      console.error('Unsupported images format:', images);
      return {
        success: false,
        message: 'Unsupported images format',
        data: null,
      };
    }
  } catch (error) {
    console.error('Error in uploadListingImages:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    };
  }
};

// Helper function to convert image URLs
const convertImageUrls = (data: any) => {
  if (!data) return data;
  
  // Get the image server URL from environment variables
  const imageServerUrl = import.meta.env.VITE_IMAGE_SERVER_URL || 'http://localhost:3001/api/images';
  
  // Process a single image URL
  const processImage = (url: string) => {
    if (!url) return url;
    
    // If already an absolute URL but pointing to the backend server
    if (url.startsWith('http://localhost:3000/tmp/')) {
      const filename = url.substring('http://localhost:3000/tmp/'.length);
      return `${imageServerUrl}/${filename}`;
    }
    
    // If it's a relative /tmp/ path
    if (url.startsWith('/tmp/')) {
      const filename = url.substring(5);
      return `${imageServerUrl}/${filename}`;
    }
    
    return url;
  };
  
  // Deep clone the data to avoid mutating the original
  const result = JSON.parse(JSON.stringify(data));
  
  // Process featured image
  if (result.featuredImage) {
    result.featuredImage = processImage(result.featuredImage);
  }
  
  // Process images array
  if (Array.isArray(result.images)) {
    result.images = result.images.map(processImage);
  }
  
  // Process user profileImage if present
  if (result.user && result.user.profileImage) {
    result.user.profileImage = processImage(result.user.profileImage);
  }
  
  return result;
};

// You could also add specific API methods here as named exports 