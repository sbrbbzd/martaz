import { store } from './index';

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Action types enum
export enum ActionTypes {
  // Auth action types
  SET_AUTH_LOADING = 'SET_AUTH_LOADING',
  SET_USER = 'SET_USER',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGOUT = 'LOGOUT',
  AUTH_ERROR = 'AUTH_ERROR',
  
  // Other action types can be added here as the app grows
}

// State types
export interface AuthState {
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  } | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface ListingState {
  filters: {
    search: string;
    category: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    location: string | null;
    condition: string | null;
    sortBy: string;
    order: 'ASC' | 'DESC';
  };
  page: number;
  limit: number;
}

export interface UiState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  loading: boolean;
  toast: {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
  phone?: string;
} 