import { Dispatch, ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { 
  setLoading, 
  setDashboardData, 
  setError, 
  DashboardData
} from '../slices/adminSlice';
import { AppDispatch } from '../index';

// Mock data for demonstration
const mockDashboardData: DashboardData = {
  totalUsers: {
    count: 1257
  },
  totalListings: {
    count: 4876
  },
  pendingListings: [
    { id: 'p1', title: 'Honda Civic 2018, low mileage', user: 'Murad Hasanov', category: 'Vehicles', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'p2', title: 'Modern 2 bedroom apartment in city center', user: 'Leyla Ahmadova', category: 'Real Estate', createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
    { id: 'p3', title: 'Office administrator needed', user: 'Fuad Mammadov', category: 'Jobs', createdAt: new Date(Date.now() - 23 * 3600000).toISOString() },
    { id: 'p4', title: 'PlayStation 5 with extra controller', user: 'Emil Ismayilov', category: 'Electronics', createdAt: new Date(Date.now() - 25 * 3600000).toISOString() },
    { id: 'p5', title: 'Antique Persian carpet', user: 'Aydan Karimova', category: 'Home & Garden', createdAt: new Date(Date.now() - 28 * 3600000).toISOString() }
  ],
  activeCategories: {
    count: 32,
    list: ['Vehicles', 'Real Estate', 'Electronics', 'Jobs', 'Home & Garden', 'Fashion', 'Services']
  },
  userGrowth: 12.5,
  listingGrowth: 8.3,
  recentActivity: [
    { id: '1', type: 'user-registered', user: 'Ali Mammadov', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: '2', type: 'listing-created', user: 'Elvin Aliyev', title: 'MacBook Pro 16" 2021', timestamp: new Date(Date.now() - 47 * 60000).toISOString() },
    { id: '3', type: 'listing-reported', user: 'Samira Huseynova', title: 'iPhone 12 Pro', reason: 'spam', reporter: 'Samira Huseynova', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: '4', type: 'user-updated', user: 'Rashad Guliyev', timestamp: new Date(Date.now() - 3 * 3600000).toISOString() },
    { id: '5', type: 'listing-sold', user: 'Kamran Ibrahimov', title: 'Samsung Galaxy S21', timestamp: new Date(Date.now() - 5 * 3600000).toISOString() }
  ]
};

// Action to fetch dashboard data
export const fetchDashboardData = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      // In a real implementation, this would be an API call
      // const response = await api.get('/api/admin/dashboard');
      // const data = response.data;

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data for now
      dispatch(setDashboardData(mockDashboardData));
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data'));
    }
  };
};

// Action to approve a listing
export const approveListing = (id: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      // In a real implementation, this would be an API call
      // await api.put(`/api/admin/listings/${id}/approve`);
      
      // Refetch dashboard data after approval
      dispatch(fetchDashboardData());
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to approve listing'));
    }
  };
};

// Action to reject a listing
export const rejectListing = (id: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      // In a real implementation, this would be an API call
      // await api.put(`/api/admin/listings/${id}/reject`);
      
      // Refetch dashboard data after rejection
      dispatch(fetchDashboardData());
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to reject listing'));
    }
  };
}; 