import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkAction, AnyAction } from '@reduxjs/toolkit';
import { 
  FiActivity, FiCalendar, FiCheck, FiDollarSign, FiEdit, 
  FiEye, FiFilter, FiGrid, FiList, FiPackage, FiPlus, 
  FiSearch, FiSettings, FiShoppingBag, FiTrello, FiTrendingUp, 
  FiUsers, FiX, FiClipboard, FiGlobe, FiMessageSquare
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
import { formatDate, timeSince } from '../../../utils/date';
import Loader from '../../../components/common/LoadingSpinner';
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
  return (
    <div className="unauthorized-view">
      <div className="container">
        <h2>{t('common.unauthorized')}</h2>
        <p>{t('common.noAccess')}</p>
      </div>
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useSelector(selectAuthUser) as User | null;
  const dashboardData = useSelector(selectDashboardData);
  const loading = useSelector(selectAdminLoading);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('week');
  const [filterCategory, setFilterCategory] = useState('all');
  
  useEffect(() => {
    if (currentUser && isUserAdmin(currentUser)) {
      dispatch(fetchDashboardData());
    }
  }, [dispatch, currentUser]);
  
  const handleApproveListing = (id: string) => {
    dispatch(approveListing(id));
  };
  
  const handleRejectListing = (id: string) => {
    dispatch(rejectListing(id));
  };
  
  if (!currentUser || !isUserAdmin(currentUser)) {
    return <UnauthorizedView />;
  }
  
  if (loading || !dashboardData) {
    return (
      <div className="admin-dashboard">
        <div className="loading-skeleton">
          <div className="pulse-loader"></div>
          <p>{t('admin.loading')}</p>
        </div>
      </div>
    );
  }
  
  const { 
    totalUsers, 
    totalListings, 
    pendingListings, 
    activeCategories,
    userGrowth, 
    listingGrowth,
    recentActivity
  } = dashboardData;
  
  const filteredPendingListings = pendingListings
    .filter((listing: ListingItem) => 
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  return (
    <div className="admin-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <h1>{t('admin.dashboard')}</h1>
          <div className="date-display">
            <FiCalendar />
            <span>{formatDate(new Date(), 'full')}</span>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={t('admin.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="notification">
            <FiActivity />
            {recentActivity.length > 0 && (
              <span className="notification-count">{recentActivity.length}</span>
            )}
          </div>
          
          <div className="user-profile">
            {currentUser?.profileImage ? (
              <img 
                src={currentUser.profileImage} 
                alt={currentUser.username || currentUser.email} 
                className="user-avatar"
              />
            ) : (
              <div className="user-initials">
                {(currentUser?.firstName?.[0] || currentUser?.email?.[0] || '').toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card primary">
          <div className="stat-info">
            <h3>{t('admin.total_users')}</h3>
            <div className="stat-value">{totalUsers.count}</div>
            {userGrowth > 0 ? (
              <div className="stat-change positive">
                <FiTrendingUp />
                <span>+{userGrowth}% {t('admin.past_month')}</span>
              </div>
            ) : (
              <div className="stat-change negative">
                <FiTrendingUp />
                <span>{userGrowth}% {t('admin.past_month')}</span>
              </div>
            )}
          </div>
          <div className="stat-icon">
            <FiUsers />
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-info">
            <h3>{t('admin.active_listings')}</h3>
            <div className="stat-value">{totalListings.count}</div>
            {listingGrowth > 0 ? (
              <div className="stat-change positive">
                <FiTrendingUp />
                <span>+{listingGrowth}% {t('admin.past_month')}</span>
              </div>
            ) : (
              <div className="stat-change negative">
                <FiTrendingUp />
                <span>{listingGrowth}% {t('admin.past_month')}</span>
              </div>
            )}
          </div>
          <div className="stat-icon">
            <FiPackage />
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-info">
            <h3>{t('admin.pending_approval')}</h3>
            <div className="stat-value">{pendingListings.length}</div>
            <div className="stat-change">
              <span>{t('admin.requires_attention')}</span>
            </div>
          </div>
          <div className="stat-icon">
            <FiList />
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-info">
            <h3>{t('admin.categories')}</h3>
            <div className="stat-value">{activeCategories.count}</div>
            <div className="stat-change">
              <span>{t('admin.active_categories')}</span>
            </div>
          </div>
          <div className="stat-icon">
            <FiGrid />
          </div>
        </div>
      </div>
      
      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Pending Listings */}
        <div className="pending-listings dashboard-card">
          <div className="card-header">
            <h2>{t('admin.pending_listings')}</h2>
            <div className="header-controls">
              <div className="filter-dropdown">
                <button className="filter-button">
                  <FiFilter />
                  <span>{t('admin.filter')}</span>
                </button>
                <div className="filter-options">
                  <button 
                    className={filterCategory === 'all' ? 'active' : ''}
                    onClick={() => setFilterCategory('all')}
                  >
                    {t('admin.all_categories')}
                  </button>
                  {activeCategories.list.map((category: string) => (
                    <button
                      key={category}
                      className={filterCategory === category ? 'active' : ''}
                      onClick={() => setFilterCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                className="view-all-button"
                onClick={() => navigate('/admin/listings/pending')}
              >
                {t('admin.view_all')}
              </button>
            </div>
          </div>
          <div className="card-content">
            {filteredPendingListings.length === 0 ? (
              <div className="empty-state">
                <FiPackage className="empty-icon" />
                <p>{t('admin.no_pending_listings')}</p>
              </div>
            ) : (
              <div className="listing-table">
                <div className="table-header">
                  <div>{t('admin.title')}</div>
                  <div>{t('admin.category')}</div>
                  <div>{t('admin.user')}</div>
                  <div>{t('admin.time')}</div>
                  <div>{t('admin.actions')}</div>
                </div>
                <div className="table-body">
                  {filteredPendingListings.slice(0, 5).map((listing: ListingItem) => (
                    <div className="table-row" key={listing.id}>
                      <div className="col-title">{listing.title}</div>
                      <div className="col-category">
                        <span className="category-tag">{listing.category}</span>
                      </div>
                      <div className="col-user">{listing.user}</div>
                      <div className="col-time">{timeSince(new Date(listing.createdAt))}</div>
                      <div className="col-actions">
                        <button 
                          className="action-button approve"
                          title={t('admin.approve')}
                          onClick={() => handleApproveListing(listing.id)}
                        >
                          <FiCheck />
                        </button>
                        <button 
                          className="action-button reject"
                          title={t('admin.reject')}
                          onClick={() => handleRejectListing(listing.id)}
                        >
                          <FiX />
                        </button>
                        <button 
                          className="action-button view"
                          title={t('admin.view')}
                          onClick={() => navigate(`/admin/listings/${listing.id}`)}
                        >
                          <FiEye />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="recent-activity dashboard-card">
          <div className="card-header">
            <h2>{t('admin.recent_activity')}</h2>
            <div className="header-controls">
              <div className="period-selector">
                <button 
                  className={`period ${filterPeriod === 'day' ? 'active' : ''}`}
                  onClick={() => setFilterPeriod('day')}
                >
                  {t('admin.today')}
                </button>
                <button 
                  className={`period ${filterPeriod === 'week' ? 'active' : ''}`}
                  onClick={() => setFilterPeriod('week')}
                >
                  {t('admin.week')}
                </button>
                <button 
                  className={`period ${filterPeriod === 'month' ? 'active' : ''}`}
                  onClick={() => setFilterPeriod('month')}
                >
                  {t('admin.month')}
                </button>
              </div>
            </div>
          </div>
          <div className="card-content">
            {recentActivity.length === 0 ? (
              <div className="empty-state">
                <FiActivity className="empty-icon" />
                <p>{t('admin.no_recent_activity')}</p>
              </div>
            ) : (
              <div className="activity-timeline">
                {recentActivity.slice(0, 5).map((activity: ActivityItem) => (
                  <div className="timeline-item" key={activity.id}>
                    <div className={`timeline-icon ${activity.type}`}>
                      {activity.type === 'user-registered' && <FiUsers />}
                      {activity.type === 'user-updated' && <FiEdit />}
                      {activity.type === 'listing-created' && <FiPlus />}
                      {activity.type === 'listing-reported' && <FiX />}
                      {activity.type === 'listing-sold' && <FiDollarSign />}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-time">
                        {timeSince(new Date(activity.timestamp))}
                      </div>
                      <div className="timeline-body">
                        <p>
                          {activity.type === 'user-registered' && (
                            <>
                              <strong>{activity.user}</strong> {t('admin.registered_new_account')}
                            </>
                          )}
                          {activity.type === 'user-updated' && (
                            <>
                              <strong>{activity.user}</strong> {t('admin.updated_profile')}
                            </>
                          )}
                          {activity.type === 'listing-created' && (
                            <>
                              <strong>{activity.user}</strong> {t('admin.created_listing')} <span className="highlight">{activity.title}</span>
                            </>
                          )}
                          {activity.type === 'listing-reported' && (
                            <>
                              <strong>{activity.reporter}</strong> {t('admin.reported_listing')} <span className="highlight">{activity.title}</span>
                              <span className="report-tag">{activity.reason}</span>
                            </>
                          )}
                          {activity.type === 'listing-sold' && (
                            <>
                              <strong>{activity.user}</strong> {t('admin.marked_listing_sold')} <span className="highlight">{activity.title}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Analytics Summary */}
        <div className="analytics-summary dashboard-card">
          <div className="card-header">
            <h2>{t('admin.analytics_overview')}</h2>
            <div className="header-controls">
              <div className="period-selector">
                <button 
                  className={`period ${filterPeriod === 'week' ? 'active' : ''}`}
                  onClick={() => setFilterPeriod('week')}
                >
                  {t('admin.weekly')}
                </button>
                <button 
                  className={`period ${filterPeriod === 'month' ? 'active' : ''}`}
                  onClick={() => setFilterPeriod('month')}
                >
                  {t('admin.monthly')}
                </button>
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="chart-placeholder">
              <FiTrendingUp className="chart-icon" />
              <p>{t('admin.chart_placeholder')}</p>
            </div>
            <div className="metrics-grid">
              <div className="metric">
                <h4>{t('admin.page_views')}</h4>
                <div className="metric-value">2,543</div>
                <div className="stat-change positive">
                  <FiTrendingUp />
                  <span>+12.5%</span>
                </div>
              </div>
              <div className="metric">
                <h4>{t('admin.avg_session')}</h4>
                <div className="metric-value">3:42</div>
                <div className="stat-change positive">
                  <FiTrendingUp />
                  <span>+2.1%</span>
                </div>
              </div>
              <div className="metric">
                <h4>{t('admin.bounce_rate')}</h4>
                <div className="metric-value">42.3%</div>
                <div className="stat-change negative">
                  <FiTrendingUp />
                  <span>-1.8%</span>
                </div>
              </div>
              <div className="metric">
                <h4>{t('admin.new_users')}</h4>
                <div className="metric-value">432</div>
                <div className="stat-change positive">
                  <FiTrendingUp />
                  <span>+22.4%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="quick-links dashboard-card">
          <div className="card-header">
            <h2>{t('admin.quick_links')}</h2>
          </div>
          <div className="card-content">
            <div className="quick-links-grid">
              <button 
                className="quick-link-card"
                onClick={() => navigate('/admin/listings/create')}
              >
                <FiPlus className="link-icon" />
                <span className="link-label">{t('admin.add_listing')}</span>
              </button>
              <button 
                className="quick-link-card"
                onClick={() => navigate('/admin/users')}
              >
                <FiUsers className="link-icon" />
                <span className="link-label">{t('admin.manage_users')}</span>
              </button>
              <button 
                className="quick-link-card"
                onClick={() => navigate('/admin/categories')}
              >
                <FiGrid className="link-icon" />
                <span className="link-label">{t('admin.categories')}</span>
              </button>
              <button 
                className="quick-link-card"
                onClick={() => navigate('/admin/settings')}
              >
                <FiSettings className="link-icon" />
                <span className="link-label">{t('admin.settings')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 