import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiActivity, FiBarChart2, FiCalendar, FiCheck, FiDollarSign, 
  FiEdit, FiEye, FiFilter, FiGrid, FiList, FiPackage, FiPieChart,
  FiPlus, FiRefreshCw, FiSearch, FiShoppingBag, FiTrendingUp, 
  FiUsers, FiX, FiClipboard, FiGlobe, FiMessageSquare, 
  FiAlertCircle, FiCheckCircle, FiClock, FiInfo, FiArrowUp, FiMap,
  FiFlag
} from 'react-icons/fi';
import { RootState } from '../../../store';
import { selectAuthUser } from '../../../store/slices/authSlice';
import { 
  useGetAdminDashboardDataQuery, 
  useGetAdminListingsQuery, 
  useApproveListingMutation,
  useGetAdminUsersQuery,
  Listing,
  AdminDashboardData,
  User as ApiUser,
  AdminDashboardListing
} from '../../../services/api';
import { formatDate, timeSince } from '../../../utils/date';
import { getImageUrl } from '../../../utils/helpers';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AdminLayout from '../../../components/Admin/AdminLayout';
import './style.scss';
import { toast } from 'react-hot-toast';

// Import chart components and utilities
import ChartUtils, { Line, Doughnut, lineChartOptions, doughnutChartOptions } from '../../../utils/chartUtils';

// Define User interface
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  username?: string;
  profileImage?: string;
  status?: string;
  createdAt?: string;
}

// Interface for admin dashboard data with additional fields for the component
interface ExtendedDashboardData extends AdminDashboardData {
  totalSales?: {
    count: number;
    growth: number;
  };
  userActivityByMonth?: number[];
  listingsByMonth?: number[];
  topCategories?: Array<{ name: string; count: number }>;
}

// Custom UnauthorizedView component
const UnauthorizedView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  return (
    <div className="admin-unauthorized">
      <h1>{t('admin.unauthorized.title')}</h1>
      <p>{t('admin.unauthorized.message')}</p>
      <button onClick={() => navigate('/')}>{t('common.backToHome')}</button>
    </div>
  );
};

// Utility functions
const isUserAdmin = (user: User | null): boolean => {
  return user?.role === 'admin' || user?.role === 'superadmin';
};

// KPI Card Component
const KpiCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  color: string;
  loading?: boolean;
}> = ({ title, value, icon, change, color, loading }) => {
  const { t } = useTranslation();
  
  return (
    <div className={`stat-card ${loading ? 'loading' : ''}`}>
      <div className={`stat-icon ${color}`}>
        {icon}
      </div>
      <div className="stat-content">
        <h3>{title}</h3>
        {loading ? (
          <div className="skeleton-loader"></div>
        ) : (
          <>
            <p className="stat-value">{value}</p>
            {change !== undefined && (
              <p className={`stat-change ${change >= 0 ? 'positive' : 'negative'}`}>
                {change >= 0 ? '+' : ''}{change}% {t('admin.dashboard.fromLastMonth')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Table Component
const TableComponent: React.FC<{
  columns: {id: string, label: string, render?: (item: any) => React.ReactNode}[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
}> = ({ columns, data, loading, emptyMessage }) => {
  const { t } = useTranslation();
  
  if (loading) {
    return (
      <div className="table-loading">
        <LoadingSpinner size="small" />
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <FiInfo size={24} />
        <p>{emptyMessage || t('common.noDataAvailable')}</p>
      </div>
    );
  }
  
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.id}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id || index}>
              {columns.map(column => (
                <td key={`${item.id || index}-${column.id}`}>
                  {column.render ? column.render(item) : item[column.id]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const user = useSelector(selectAuthUser);
  const navigate = useNavigate();
  
  // Dashboard data query
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    isError: isDashboardError, 
    error: dashboardError, 
    refetch: refetchDashboard 
  } = useGetAdminDashboardDataQuery(undefined, {
    pollingInterval: 300000, // Refresh every 5 minutes
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  
  // Recent users query (limit to 5)
  const {
    data: recentUsers,
    isLoading: isUsersLoading
  } = useGetAdminUsersQuery({
    page: 1,
    limit: 5
  }, {
    pollingInterval: 300000 // Refresh every 5 minutes
  });
  
  // Pending listings query
  const {
    data: listingsData,
    isLoading: isListingsLoading,
    refetch: refetchListings
  } = useGetAdminListingsQuery({
    status: 'pending',
    page: 1,
    limit: 5
  }, {
    pollingInterval: 60000 // Refresh every minute
  });
  
  // Mutations for listing approval
  const [approveListing, { isLoading: isApproving }] = useApproveListingMutation();
  
  // Handle listing approval
  const handleApproveListing = async (id: string) => {
    try {
      await approveListing(id).unwrap();
      toast.success(t('admin.dashboard.approveSuccess'));
      refetchListings();
      refetchDashboard();
    } catch (error) {
      console.error('Error approving listing:', error);
      toast.error(t('admin.dashboard.approveFailed'));
    }
  };
  
  // Prepare data for charts
  const [chartPeriod, setChartPeriod] = useState('30days');
  
  // Prepare user activity chart data
  const userActivityData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: t('admin.dashboard.newUsers'),
        data: [65, 78, 52, 95, 78, 120, 140],
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };
  
  // Prepare listings chart data
  const listingsChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: t('admin.dashboard.newListings'),
        data: [45, 60, 75, 70, 85, 90, 100],
        borderColor: '#16A34A',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };
  
  // Prepare category distribution chart data
  const categoryDistribution = {
    labels: ['Vehicles', 'Real Estate', 'Electronics', 'Jobs', 'Fashion'],
    datasets: [
      {
        data: [30, 25, 20, 15, 10],
        backgroundColor: [
          '#4F46E5',
          '#16A34A',
          '#EA580C',
          '#0891B2',
          '#7C3AED'
        ],
        borderWidth: 0
      }
    ]
  };
  
  // Format currency helper
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '₼0';
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('AZN', '₼');
  };
  
  // Define mock data for demo purposes when API data is missing
  const mockSalesData = { count: 0, growth: 0 };
  
  // Add debug logging for pending listings data - MOVED OUTSIDE CONDITIONAL RENDERING
  useEffect(() => {
    if (listingsData && listingsData.listings && listingsData.listings.length > 0) {
      console.log('Pending listings data:', listingsData.listings);
      // Log the first listing in detail to inspect its structure
      console.log('First pending listing structure:', JSON.stringify(listingsData.listings[0], null, 2));
    }
  }, [listingsData]);
  
  // Check if user is admin
  if (!isUserAdmin(user)) {
    return <UnauthorizedView />;
  }
  
  // Show loading state for entire dashboard
  if (isDashboardLoading && !dashboardData) {
    return (
      <AdminLayout>
        <div className="dashboard-loading">
          <LoadingSpinner />
          <p>{t('admin.dashboard.loading')}</p>
        </div>
      </AdminLayout>
    );
  }
  
  // Show error state for dashboard
  if (isDashboardError) {
    return (
      <AdminLayout>
        <div className="dashboard-error">
          <FiAlertCircle size={48} />
          <h2>{t('admin.dashboard.error')}</h2>
          <p>{dashboardError?.toString() || t('admin.dashboard.tryAgain')}</p>
          <button onClick={() => refetchDashboard()} className="retry-button">
            <FiRefreshCw />
            {t('admin.dashboard.retry')}
          </button>
        </div>
      </AdminLayout>
    );
  }
  
  // Ensure all required data properties exist with defaults to prevent crashes
  const safeData = {
    totalUsers: dashboardData?.totalUsers || { count: 0 },
    totalListings: dashboardData?.totalListings || { count: 0 },
    totalRevenue: dashboardData?.totalRevenue || 0,
    totalSales: mockSalesData,
    pendingListings: dashboardData?.pendingListings || []
  };
  
  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div className="header-left">
            <h1>{t('admin.dashboard.title')}</h1>
            <p>{t('admin.dashboard.overview')}</p>
          </div>
          <div className="header-actions">
            <button className="refresh-button" onClick={() => refetchDashboard()}>
              <FiRefreshCw />
              {t('admin.dashboard.refresh')}
            </button>
            <button className="add-button" onClick={() => navigate('/listings/create')}>
              <FiPlus />
              {t('admin.dashboard.addListing')}
            </button>
          </div>
        </div>
        
        {/* KPI Stats Cards */}
        <div className="stats-cards">
          <KpiCard
            title={t('admin.dashboard.totalUsers')}
            value={safeData.totalUsers.count.toLocaleString()}
            icon={<FiUsers />}
            change={dashboardData?.userGrowth || 0}
            color="users"
            loading={isDashboardLoading}
          />
          
          <KpiCard
            title={t('admin.dashboard.totalListings')}
            value={safeData.totalListings.count.toLocaleString()}
            icon={<FiPackage />}
            change={dashboardData?.listingGrowth || 0}
            color="listings"
            loading={isDashboardLoading}
          />
          
          <KpiCard
            title={t('admin.dashboard.totalRevenue')}
            value={formatCurrency(safeData.totalRevenue)}
            icon={<FiDollarSign />}
            change={5.2} // Example value, replace with real data
            color="revenue"
            loading={isDashboardLoading}
          />
          
          <KpiCard
            title={t('admin.dashboard.completedSales')}
            value={safeData.totalSales.count.toLocaleString()}
            icon={<FiShoppingBag />}
            change={safeData.totalSales.growth}
            color="sales"
            loading={isDashboardLoading}
          />
        </div>
        
        {/* Charts Row */}
        <div className="charts-row">
          <div className="chart-card">
            <div className="card-header">
              <h2>{t('admin.dashboard.userActivity')}</h2>
              <div className="chart-controls">
                <select 
                  value={chartPeriod} 
                  onChange={(e) => setChartPeriod(e.target.value)}
                  className="period-selector"
                >
                  <option value="7days">{t('admin.dashboard.last7Days')}</option>
                  <option value="30days">{t('admin.dashboard.last30Days')}</option>
                  <option value="90days">{t('admin.dashboard.last90Days')}</option>
                </select>
              </div>
            </div>
            <div className="card-content">
              <Line
                data={userActivityData}
                options={lineChartOptions}
              />
            </div>
          </div>
          
          <div className="chart-card">
            <div className="card-header">
              <h2>{t('admin.dashboard.listingTrends')}</h2>
              <div className="chart-controls">
                <select 
                  value={chartPeriod} 
                  onChange={(e) => setChartPeriod(e.target.value)}
                  className="period-selector"
                >
                  <option value="7days">{t('admin.dashboard.last7Days')}</option>
                  <option value="30days">{t('admin.dashboard.last30Days')}</option>
                  <option value="90days">{t('admin.dashboard.last90Days')}</option>
                </select>
              </div>
            </div>
            <div className="card-content">
              <Line
                data={listingsChartData}
                options={lineChartOptions}
              />
            </div>
          </div>
        </div>
        
        {/* Content Row */}
        <div className="dashboard-grid">
          <div className="dashboard-card recent-users">
            <div className="card-header">
              <h2>
                <FiUsers />
                {t('admin.dashboard.recentUsers')}
              </h2>
              <Link to="/admin/users" className="view-all-button">
                <FiEye />
                {t('admin.dashboard.viewAll')}
              </Link>
            </div>
            
            <div className="card-content">
              <TableComponent
                columns={[
                  {
                    id: 'name',
                    label: t('admin.dashboard.name'),
                    render: (user) => (
                      <div className="user-cell">
                        <div className="user-avatar">
                          {user.profileImage ? (
                            <img 
                              src={getImageUrl(user.profileImage)} 
                              alt={`${user.firstName} ${user.lastName}`} 
                              onError={(e) => {
                                // Fallback to placeholder on error
                                (e.target as HTMLImageElement).src = '/placeholder-avatar.jpg';
                              }}
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {(user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '')}
                            </div>
                          )}
                        </div>
                        <span>{`${user.firstName || ''} ${user.lastName || ''}`}</span>
                      </div>
                    )
                  },
                  { id: 'email', label: t('admin.dashboard.email') },
                  {
                    id: 'role',
                    label: t('admin.dashboard.role'),
                    render: (user) => (
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    )
                  },
                  {
                    id: 'createdAt',
                    label: t('admin.dashboard.joined'),
                    render: (user) => user.createdAt ? timeSince(new Date(user.createdAt)) : t('common.unknown')
                  },
                  {
                    id: 'actions',
                    label: t('admin.dashboard.actions'),
                    render: (user) => (
                      <div className="actions-cell">
                        <button 
                          className="icon-button view"
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          title={t('admin.dashboard.viewUser')}
                        >
                          <FiEye />
                        </button>
                        <button 
                          className="icon-button edit"
                          onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                          title={t('admin.dashboard.editUser')}
                        >
                          <FiEdit />
                        </button>
                      </div>
                    )
                  }
                ]}
                data={recentUsers?.users || []}
                loading={isUsersLoading}
                emptyMessage={t('admin.dashboard.noRecentUsers')}
              />
            </div>
          </div>
          
          <div className="dashboard-card category-distribution">
            <div className="card-header">
              <h2>
                <FiPieChart />
                {t('admin.dashboard.categoryDistribution')}
              </h2>
            </div>
            
            <div className="card-content">
              <div className="chart-container">
                <Doughnut
                  data={categoryDistribution}
                  options={doughnutChartOptions}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Pending Approvals Section */}
        <div className="dashboard-card pending-approvals">
          <div className="card-header">
            <h2>
              <FiClock />
              {t('admin.dashboard.pendingApprovals')}
            </h2>
            <Link to="/admin/listings?status=pending" className="view-all-button">
              <FiEye />
              {t('admin.dashboard.viewAll')}
            </Link>
          </div>
          
          <div className="card-content">
            {isListingsLoading ? (
              <div className="loading-container">
                <LoadingSpinner size="medium" />
              </div>
            ) : safeData.pendingListings.length > 0 ? (
              <div className="pending-listings">
                {safeData.pendingListings.map((listing) => {
                  // Convert price to number if it's a string
                  const price = typeof listing.price === 'string' 
                    ? parseFloat(listing.price) 
                    : (typeof listing.price === 'number' ? listing.price : 0);
                    
                  return (
                    <div className="pending-item" key={listing.id}>
                      <div className="pending-item-image">
                        <Link to={`/listings/${listing.id}`}>
                          <img 
                            src={Array.isArray(listing.images) && listing.images.length > 0 
                              ? getImageUrl(listing.images[0]) 
                              : '/placeholder-image.jpg'
                            } 
                            alt={typeof listing.title === 'string' ? listing.title : 'Untitled'} 
                            onError={(e) => {
                              console.log(`Failed to load image for listing ${listing.id}`);
                              (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                            }}
                          />
                          <span className="item-category">{typeof listing.category === 'string' ? listing.category : ''}</span>
                        </Link>
                      </div>
                      <div className="pending-item-details">
                        <Link to={`/listings/${listing.id}`} className="item-title-link">
                          <h3>{typeof listing.title === 'string' ? listing.title : 'Untitled'}</h3>
                        </Link>
                        <div className="item-meta">
                          <p className="item-price">
                            <strong>{t('admin.dashboard.price')}:</strong> {formatCurrency(price)}
                          </p>
                        </div>
                        <div className="item-user">
                          <p className="item-seller">
                            <strong>{t('admin.dashboard.seller')}:</strong> {
                              // Handle the user property which can be either a string or an object
                              typeof listing.user === 'object' && listing.user 
                                ? `${(listing.user as any).firstName || ''} ${(listing.user as any).lastName || ''}`.trim()
                                : typeof listing.user === 'string'
                                  ? listing.user
                                  : ''
                            }
                          </p>
                          <p className="item-date">
                            <FiCalendar size={14} />
                            <strong>{t('admin.dashboard.created')}:</strong> {listing.createdAt 
                              ? formatDate(new Date(listing.createdAt)) 
                              : t('common.unknown')
                            }
                          </p>
                          <p className="item-age">
                            <strong>{t('admin.dashboard.age')}:</strong> {listing.createdAt 
                              ? timeSince(new Date(listing.createdAt)) 
                              : t('common.unknown')
                            }
                          </p>
                        </div>
                      </div>
                      <div className="pending-item-actions">
                        <button 
                          className="approve-button"
                          onClick={() => handleApproveListing(listing.id)}
                          disabled={isApproving}
                        >
                          <FiCheckCircle />
                          <span>{t('admin.dashboard.approve')}</span>
                        </button>
                        <button 
                          className="view-button"
                          onClick={() => navigate(`/listings/${listing.id}`)}
                        >
                          <FiEye />
                          <span>{t('admin.dashboard.view')}</span>
                        </button>
                        <button 
                          className="report-button"
                          onClick={() => navigate(`/listings/${listing.id}/report`)}
                        >
                          <FiFlag />
                          <span>{t('admin.dashboard.report')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <FiCheckCircle size={48} />
                <p>{t('admin.dashboard.noPendingApprovals')}</p>
                <button 
                  className="refresh-button"
                  onClick={() => refetchListings()}
                >
                  <FiRefreshCw size={16} />
                  {t('admin.dashboard.refresh')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard; 