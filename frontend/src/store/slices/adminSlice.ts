import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../types';

// Define the types for dashboard data
export interface ListingItem {
  id: string;
  title: string;
  user: string;
  category: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'user-registered' | 'user-updated' | 'listing-created' | 'listing-reported' | 'listing-sold';
  user: string;
  title?: string;
  reporter?: string;
  reason?: string;
  timestamp: string;
}

export interface DashboardData {
  totalUsers: {
    count: number;
  };
  totalListings: {
    count: number;
  };
  pendingListings: ListingItem[];
  activeCategories: {
    count: number;
    list: string[];
  };
  userGrowth: number;
  listingGrowth: number;
  recentActivity: ActivityItem[];
}

// Define the initial state
interface AdminState {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  dashboardData: null,
  loading: false,
  error: null
};

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setDashboardData: (state, action: PayloadAction<DashboardData>) => {
      state.dashboardData = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearDashboardData: (state) => {
      state.dashboardData = null;
    }
  }
});

// Export actions
export const { 
  setDashboardData, 
  setLoading, 
  setError, 
  clearDashboardData 
} = adminSlice.actions;

// Export selectors
export const selectDashboardData = (state: RootState) => state.admin.dashboardData;
export const selectAdminLoading = (state: RootState) => state.admin.loading;
export const selectAdminError = (state: RootState) => state.admin.error;

// Export reducer
export default adminSlice.reducer; 