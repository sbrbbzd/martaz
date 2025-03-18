import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkAction, AnyAction } from '@reduxjs/toolkit';
import { 
  FiActivity, FiCalendar, FiCheck, FiDollarSign, FiEdit, 
  FiEye, FiFilter, FiGrid, FiList, FiPackage, FiPlus, 
  FiSearch, FiSettings, FiShoppingBag, FiTrello, FiTrendingUp, 
  FiUsers, FiX, FiClipboard, FiGlobe, FiMessageSquare, FiAlertCircle, FiCheckCircle, FiClock
} from 'react-icons/fi';
import { RootState, AppDispatch } from '../../../store';
import { selectAuthUser } from '../../../store/slices/authSlice';
import { 
  setDashboardData, 
  setLoading, 
  setError, 
  selectDashboardData, 
  selectAdminLoading, 
  ListingItem, 
  ActivityItem, 
  DashboardData 
} from '../../../store/slices/adminSlice';
import { 
  useGetAdminDashboardDataQuery, 
  useApproveListingMutation, 
  useRejectListingMutation 
} from '../../../services/api';
import { formatDate, timeSince } from '../../../utils/date';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AdminLayout from '../../../components/Admin/AdminLayout';
import './style.scss';

// Define User interface
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  username?: string;
  profileImage?: string;
}

// Define AppThunk type for async actions
type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

// Create custom hooks for typed dispatch
const useAppDispatch = () => useDispatch<AppDispatch>();

// Utility functions
const isUserAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

// Custom UnauthorizedView component
const UnauthorizedView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  return (
    <div className="admin-unauthorized">
      <h1>{t('admin.unauthorized.title', 'Unauthorized Access')}</h1>
      <p>{t('admin.unauthorized.message', 'You do not have permission to access the admin dashboard.')}</p>
      <button onClick={() => navigate('/')}>{t('common.backToHome', 'Back to Home')}</button>
    </div>
  );
};

// Define action creators directly in this file until proper modules are created
const fetchDashboardData = (): AppThunk => {
  return async (dispatch) => {
    try {
      dispatch(setLoading(true));
      
      // Mock dashboard data for now
      const mockDashboardData: DashboardData = {
        totalUsers: { count: 1257 },
        totalListings: { count: 4876 },
        pendingListings: [
          { id: 'p1', title: 'Honda Civic 2018, low mileage', user: 'Murad Hasanov', category: 'Vehicles', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
          { id: 'p2', title: 'Modern 2 bedroom apartment', user: 'Leyla Ahmadova', category: 'Real Estate', createdAt: new Date(Date.now() - 5 * 3600000).toISOString() }
        ],
        activeCategories: {
          count: 32,
          list: ['Vehicles', 'Real Estate', 'Electronics', 'Jobs', 'Home & Garden', 'Fashion', 'Services']
        },
        userGrowth: 12.5,
        listingGrowth: 8.3,
        recentActivity: [
          { id: '1', type: 'user-registered', user: 'Ali Mammadov', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
          { id: '2', type: 'listing-created', user: 'Elvin Aliyev', title: 'MacBook Pro 16" 2021', timestamp: new Date(Date.now() - 47 * 60000).toISOString() }
        ]
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch(setDashboardData(mockDashboardData));
    } catch (error: any) {
      dispatch(setError(error.message || 'Failed to fetch dashboard data'));
    } finally {
      dispatch(setLoading(false));
    }
  };
};

const approveListing = (id: string): AppThunk => {
  return async (dispatch) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // Refetch data
      dispatch(fetchDashboardData());
    } catch (error: any) {
      dispatch(setError(error.message || 'Failed to approve listing'));
    }
  };
};

const rejectListing = (id: string): AppThunk => {
  return async (dispatch) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // Refetch data
      dispatch(fetchDashboardData());
    } catch (error: any) {
      dispatch(setError(error.message || 'Failed to reject listing'));
    }
  };
};

const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const user = useSelector(selectAuthUser);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  // Set language to Azerbaijani if needed
  useEffect(() => {
    // Check if the current language is not Azerbaijani
    if (i18n.language !== 'az') {
      i18n.changeLanguage('az');
    }
  }, [i18n]);
  
  // Use RTK Query hooks with skip option to prevent automatic refetching
  const { 
    data: dashboardData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useGetAdminDashboardDataQuery(undefined, {
    // Disable automatic refetching on component mount/update
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false
  });
  
  const [approveListing, { isLoading: isApproving }] = useApproveListingMutation();
  const [rejectListing, { isLoading: isRejecting }] = useRejectListingMutation();
  
  // Fetch data only once on component mount
  useEffect(() => {
    // Only fetch if we don't already have data
    if (!dashboardData) {
      refetch();
    }
  }, [dashboardData, refetch]);
  
  // Handle listing approval
  const handleApproveListing = async (id: string) => {
    try {
      await approveListing(id).unwrap();
      // Success notification could be added here
    } catch (error) {
      console.error('Failed to approve listing:', error);
      // Error notification could be added here
    }
  };
  
  // Handle listing rejection
  const handleRejectListing = async (id: string) => {
    try {
      await rejectListing({ id }).unwrap();
      // Success notification could be added here
    } catch (error) {
      console.error('Failed to reject listing:', error);
      // Error notification could be added here
    }
  };
  
  // Check if user is admin
  if (!isUserAdmin(user)) {
    return <UnauthorizedView />;
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="dashboard-loading">
          <LoadingSpinner />
          <p>{t('admin.dashboard.loading', 'Loading dashboard data...')}</p>
        </div>
      </AdminLayout>
    );
  }
  
  // Show error state
  if (isError || !dashboardData) {
    return (
      <AdminLayout>
        <div className="dashboard-error">
          <FiAlertCircle size={48} />
          <h2>{t('admin.dashboard.error', 'Error loading dashboard')}</h2>
          <p>{error?.toString() || t('admin.dashboard.tryAgain', 'Please try again later')}</p>
          <button onClick={() => refetch()} className="retry-button">
            {t('admin.dashboard.retry', 'Retry')}
          </button>
        </div>
      </AdminLayout>
    );
  }
  
  // Ensure all required data properties exist with defaults to prevent crashes
  const safeData = {
    totalUsers: dashboardData.totalUsers || { count: 0 },
    totalListings: dashboardData.totalListings || { count: 0 },
    pendingListings: dashboardData.pendingListings || [],
    activeCategories: dashboardData.activeCategories || { count: 0, list: [] },
    userGrowth: dashboardData.userGrowth || 0,
    listingGrowth: dashboardData.listingGrowth || 0,
    recentActivity: dashboardData.recentActivity || [],
    totalRevenue: dashboardData.totalRevenue || 0
  };
  
  // Format currency helper
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '₼0';
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('AZN', '₼ ');
  };
  
  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>{t('admin.dashboard.welcome', 'Welcome to Admin Dashboard')}</h1>
          <p>{t('admin.dashboard.overview', 'Here\'s an overview of your marketplace')}</p>
        </div>
        
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon users">
              <FiUsers />
            </div>
            <div className="stat-content">
              <h3>{t('admin.dashboard.totalUsers', 'Total Users')}</h3>
              <p className="stat-value">{safeData.totalUsers.count}</p>
              <p className="stat-change">
                +{safeData.userGrowth} {t('admin.dashboard.today', 'today')}
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon listings">
              <FiPackage />
            </div>
            <div className="stat-content">
              <h3>{t('admin.dashboard.totalListings', 'Total Listings')}</h3>
              <p className="stat-value">{safeData.totalListings.count}</p>
              <p className="stat-change">
                +{safeData.listingGrowth} {t('admin.dashboard.today', 'today')}
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon revenue">
              <FiDollarSign />
            </div>
            <div className="stat-content">
              <h3>{t('admin.dashboard.totalRevenue', 'Total Revenue')}</h3>
              <p className="stat-value">{formatCurrency(safeData.totalRevenue)}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon pending">
              <FiClock />
            </div>
            <div className="stat-content">
              <h3>{t('admin.dashboard.pendingListings', 'Pending Listings')}</h3>
              <p className="stat-value">{safeData.pendingListings.length}</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-grid">
          <div className="dashboard-card recent-users">
            <div className="card-header">
              <h2>
                <FiUsers />
                {t('admin.dashboard.recentUsers', 'Recent Users')}
              </h2>
              <button className="view-all-button">
                <FiEye />
                {t('admin.dashboard.viewAll', 'View All')}
              </button>
            </div>
            
            <div className="card-content">
              {safeData.recentActivity.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('admin.dashboard.name', 'Name')}</th>
                      <th>{t('admin.dashboard.email', 'Email')}</th>
                      <th>{t('admin.dashboard.role', 'Role')}</th>
                      <th>{t('admin.dashboard.joined', 'Joined')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeData.recentActivity.map((activity) => (
                      <tr key={activity.id}>
                        <td>{activity.user || 'Unknown'}</td>
                        <td>{activity.email || 'Unknown'}</td>
                        <td>
                          <span className={`role-badge ${activity.role}`}>
                            {activity.role}
                          </span>
                        </td>
                        <td>{activity.timestamp ? timeSince(new Date(activity.timestamp)) : t('common.unknown', 'Unknown')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>{t('admin.dashboard.noRecentUsers', 'No recent users to display')}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="dashboard-card pending-approvals">
            <div className="card-header">
              <h2>
                <FiClock />
                {t('admin.dashboard.pendingApprovals', 'Pending Approvals')}
              </h2>
              <button className="view-all-button">
                <FiEye />
                {t('admin.dashboard.viewAll', 'View All')}
              </button>
            </div>
            
            <div className="card-content">
              {safeData.pendingListings.length > 0 ? (
                <div className="pending-listings">
                  {safeData.pendingListings.map((listing) => (
                    <div className="pending-item" key={listing.id}>
                      <div className="pending-item-image">
                        <img 
                          src={listing.images?.[0] || '/placeholder-image.jpg'} 
                          alt={listing.title || 'Untitled'} 
                        />
                      </div>
                      <div className="pending-item-details">
                        <h3>{listing.title || 'Untitled'}</h3>
                        <p className="item-price">{formatCurrency(listing.price)}</p>
                        <p className="item-seller">
                          {t('admin.dashboard.by', 'by')} {listing.user || 'Unknown'}
                        </p>
                        <p className="item-date">{listing.createdAt ? timeSince(new Date(listing.createdAt)) : t('common.unknown', 'Unknown')}</p>
                      </div>
                      <div className="pending-item-actions">
                        <button 
                          className="approve-button"
                          onClick={() => handleApproveListing(listing.id)}
                        >
                          <FiCheckCircle />
                          {t('admin.dashboard.approve', 'Approve')}
                        </button>
                        <button 
                          className="reject-button"
                          onClick={() => handleRejectListing(listing.id)}
                        >
                          <FiAlertCircle />
                          {t('admin.dashboard.reject', 'Reject')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>{t('admin.dashboard.noPendingApprovals', 'No pending approvals')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard; 