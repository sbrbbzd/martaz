// Define types for the ListingDetailPage

// Import Category and User types
import { Category, User } from '../../services/api';

// Define a proper interface for the API response structure
export interface ListingResponse {
  data: Listing;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  currency?: string;
  description?: string;
  location?: string;
  condition?: string;
  status?: string;
  images?: string[];
  featuredImage?: string;
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  isPromoted?: boolean;
  promotionEndDate?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    createdAt?: string;
  };
  attributes?: Record<string, any>;
  contactPhone?: string;
  contactEmail?: string;
  userId?: string;
  slug?: string;
}

export type FeatureDuration = 'day' | 'week' | 'month';

export interface ListingDetail {
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