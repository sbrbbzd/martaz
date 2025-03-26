import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  FiEdit, 
  FiTrash2, 
  FiSearch, 
  FiFilter, 
  FiAlertCircle,
  FiCheck, 
  FiEye,
  FiX,
  FiCheckCircle,
  FiStar,
  FiFlag,
  FiGrid,
  FiList,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import AdminLayout from '../../../components/Admin/AdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { 
  useGetAdminListingsQuery, 
  useApproveListingMutation, 
  useAdminDeleteListingMutation,
  useUpdateListingMutation 
} from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/date';
import { getImageUrl } from '../../../utils/helpers';
import './styles.scss';

interface ListingFilters {
  status?: string;
  category?: string;
  search?: string;
  sort?: string;
}

// Custom StatusBadge component for admin listings
const ListingStatusBadge = ({ status }: { status: string }) => {
  // Get badge classes based on status
  const getBadgeClass = () => {
    const statusLower = status?.toLowerCase() || '';
    
    switch (statusLower) {
      case 'active':
        return 'listing-status-badge listing-status-badge-active';
      case 'pending':
        return 'listing-status-badge listing-status-badge-pending';
      case 'sold':
        return 'listing-status-badge listing-status-badge-sold';
      case 'expired':
        return 'listing-status-badge listing-status-badge-expired';
      case 'deleted':
        return 'listing-status-badge listing-status-badge-deleted';
      case 'inactive':
        return 'listing-status-badge listing-status-badge-inactive';
      default:
        return 'listing-status-badge listing-status-badge-default';
    }
  };
  
  // Format the status text
  const getFormattedStatus = () => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };
  
  return (
    <span className={getBadgeClass()}>
      {getFormattedStatus()}
    </span>
  );
};

const ListingManagement: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ListingFilters>({});
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Fetch listings with RTK Query
  const { 
    data: listingsData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useGetAdminListingsQuery({ 
    page, 
    limit: 10, 
    ...filters 
  });
  
  // Log API response for debugging
  useEffect(() => {
    if (listingsData && listingsData.listings) {
      console.log('Listings data:', listingsData);
      if (listingsData.listings.length > 0) {
        console.log('First listing:', listingsData.listings[0]);
        console.log('Status field:', listingsData.listings[0].status);
        console.log('Status type:', typeof listingsData.listings[0].status);
      }
    }
  }, [listingsData]);
  
  // Mutations for listing actions
  const [approveListing, { isLoading: isApproving }] = useApproveListingMutation();
  const [deleteListing, { isLoading: isDeleting }] = useAdminDeleteListingMutation();
  const [updateListing, { isLoading: isUpdating }] = useUpdateListingMutation();
  
  // Handle search
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchText }));
    setPage(1);
  };
  
  // Handle filter change
  const handleFilterChange = (filter: string, value: string) => {
    setFilters(prev => ({ ...prev, [filter]: value }));
    setPage(1);
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Handle listing approval
  const handleApproveListing = async (id: string) => {
    try {
      await approveListing(id).unwrap();
      toast.success(t('admin.listings.approveSuccess', 'Listing approved successfully'));
    } catch (err) {
      console.error('Failed to approve listing:', err);
      toast.error(t('admin.listings.approveFailed', 'Failed to approve listing'));
    }
  };
  
  // Handle listing deletion with confirmation
  const handleDeleteListing = async (id: string) => {
    if (window.confirm(t('admin.listings.deleteConfirmation', 'Are you sure you want to delete this listing? This action cannot be undone.'))) {
      try {
        await deleteListing(id).unwrap();
        toast.success(t('admin.listings.deleteSuccess', 'Listing deleted successfully'));
      } catch (err) {
        console.error('Failed to delete listing:', err);
        toast.error(t('admin.listings.deleteFailed', 'Failed to delete listing'));
      }
    }
  };
  
  // Handle toggling featured status
  const handleToggleFeatured = async (id: string, isPromoted: boolean) => {
    try {
      await updateListing({ 
        id, 
        listing: { isPromoted: !isPromoted } 
      }).unwrap();
      
      if (isPromoted) {
        toast.success(t('admin.listings.unpromoteSuccess', 'Listing promotion removed successfully'));
      } else {
        toast.success(t('admin.listings.promoteSuccess', 'Listing promoted successfully'));
      }
    } catch (err) {
      console.error('Failed to update promotion status:', err);
      toast.error(t('admin.listings.togglePromoteFailed', 'Failed to update promotion status'));
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <LoadingSpinner />
          <p>{t('admin.listings.loading', 'Loading listings...')}</p>
        </div>
      </AdminLayout>
    );
  }
  
  // Show error state
  if (isError || !listingsData) {
    return (
      <AdminLayout>
        <div className="admin-error">
          <FiAlertCircle size={48} />
          <h2>{t('admin.listings.error', 'Error loading listings')}</h2>
          <p>
            {error && typeof error === 'object' && 'message' in error
              ? error.message 
              : t('admin.listings.serverError', 'The server encountered an error. This could be due to maintenance or high traffic.')}
          </p>
          <button onClick={() => refetch()} className="retry-button">
            {t('admin.listings.retry', 'Retry')}
          </button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="admin-listings">
        <div className="page-header">
          <div className="header-left">
            <h1>
              <FiFlag className="header-icon" />
              {t('admin.listings.title', 'Listing Management')}
            </h1>
            <p className="listings-count">
              {listingsData?.total || 0} {t('admin.listings.count', 'listings found')}
            </p>
          </div>
          
          <div className="header-actions">
            <button className="refresh-button" onClick={() => refetch()}>
              <FiRefreshCw />
              {t('admin.refresh', 'Refresh')}
            </button>
            <div className="view-toggle">
              <button 
                className={viewMode === 'table' ? 'active' : ''} 
                onClick={() => setViewMode('table')} 
                title={t('admin.listView', 'List View')}
              >
                <FiList />
              </button>
              <button 
                className={viewMode === 'grid' ? 'active' : ''} 
                onClick={() => setViewMode('grid')} 
                title={t('admin.gridView', 'Grid View')}
              >
                <FiGrid />
              </button>
            </div>
          </div>
        </div>
        
        <div className="status-tabs">
          <button 
            className={!filters.status ? 'active' : ''}
            onClick={() => handleFilterChange('status', '')}
          >
            {t('admin.all', 'All Listings')}
          </button>
          <button 
            className={filters.status === 'active' ? 'active' : ''}
            onClick={() => handleFilterChange('status', 'active')}
          >
            {t('admin.listings.statusActive', 'Active')}
          </button>
          <button 
            className={filters.status === 'pending' ? 'active' : ''}
            onClick={() => handleFilterChange('status', 'pending')}
          >
            {t('admin.listings.statusPending', 'Pending')}
          </button>
          <button 
            className={filters.status === 'sold' ? 'active' : ''}
            onClick={() => handleFilterChange('status', 'sold')}
          >
            {t('admin.listings.statusSold', 'Sold')}
          </button>
          <button 
            className={filters.status === 'expired' ? 'active' : ''}
            onClick={() => handleFilterChange('status', 'expired')}
          >
            {t('admin.listings.statusExpired', 'Expired')}
          </button>
          <button 
            className={filters.status === 'deleted' ? 'active' : ''}
            onClick={() => handleFilterChange('status', 'deleted')}
          >
            {t('admin.listings.statusDeleted', 'Deleted')}
          </button>
        </div>
        
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('admin.listings.search', 'Search listings...')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>
              <FiSearch />
            </button>
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>
                <FiFilter className="filter-icon" />
                {t('admin.listings.filterSort', 'Sort By')}:
              </label>
              <select 
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                value={filters.sort || ''}
              >
                <option value="newest">{t('admin.listings.sortNewest', 'Newest')}</option>
                <option value="oldest">{t('admin.listings.sortOldest', 'Oldest')}</option>
                <option value="price-high">{t('admin.listings.sortPriceHigh', 'Price (High to Low)')}</option>
                <option value="price-low">{t('admin.listings.sortPriceLow', 'Price (Low to High)')}</option>
              </select>
            </div>
            
            <button className="reset-filters" onClick={() => {
              setFilters({});
              setSearchText('');
            }}>
              {t('admin.resetFilters', 'Reset Filters')}
            </button>
          </div>
        </div>
        
        {viewMode === 'table' ? (
          <div className="listings-table-container">
            <table className="listings-table">
              <thead>
                <tr>
                  <th>{t('admin.listings.title', 'Title')}</th>
                  <th>{t('admin.listings.price', 'Price')}</th>
                  <th>{t('admin.listings.category', 'Category')}</th>
                  <th>{t('admin.listings.seller', 'Seller')}</th>
                  <th>{t('admin.listings.status', 'Status')}</th>
                  <th>{t('admin.listings.date', 'Date')}</th>
                  <th>{t('admin.listings.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {listingsData.listings.map((listing) => (
                  <tr key={listing.id}>
                    <td className="listing-title-cell">
                      <div className="listing-title-wrapper">
                        {listing.featuredImage && (
                          <div className="listing-thumbnail">
                            <img src={getImageUrl(listing.featuredImage)} alt={listing.title} />
                          </div>
                        )}
                        <div className="listing-info">
                          <Link to={`/listings/${listing.id}`} target="_blank" className="listing-title">
                            {listing.title}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="price-cell">{formatCurrency(listing.price)}</td>
                    <td>{listing.category?.name || '-'}</td>
                    <td>
                      {listing.user && (
                        <Link to={`/admin/users/${listing.user.id}`} className="user-link">
                          {listing.user.firstName} {listing.user.lastName}
                        </Link>
                      )}
                    </td>
                    <td>
                      <ListingStatusBadge status={listing.status} />
                    </td>
                    <td>{formatDate(new Date(listing.createdAt))}</td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <Link to={`/listings/${listing.id}`} target="_blank" className="action-button view" title={t('admin.view', 'View')}>
                          <FiEye />
                        </Link>
                        
                        <Link to={`/admin/listings/edit/${listing.id}`} className="action-button edit" title={t('admin.edit', 'Edit')}>
                          <FiEdit />
                        </Link>
                        
                        <button
                          className={`action-button ${listing.isPromoted ? 'featured' : 'feature'}`}
                          onClick={() => handleToggleFeatured(listing.id, !!listing.isPromoted)}
                          disabled={isUpdating}
                          title={listing.isPromoted ? t('admin.unfeature', 'Remove Featured') : t('admin.feature', 'Make Featured')}
                        >
                          <FiStar />
                        </button>
                        
                        {listing.status === 'pending' && (
                          <>
                            <button
                              className="action-button approve"
                              onClick={() => handleApproveListing(listing.id)}
                              disabled={isApproving}
                              title={t('admin.approve', 'Approve')}
                            >
                              <FiCheck />
                            </button>
                          </>
                        )}
                        
                        <button
                          className="action-button delete"
                          onClick={() => handleDeleteListing(listing.id)}
                          disabled={isDeleting}
                          title={t('admin.delete', 'Delete')}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {listingsData.listings.length === 0 && (
              <div className="empty-state">
                <FiAlertCircle size={32} />
                <p>{t('admin.listings.noResults', 'No listings found. Try adjusting your filters.')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="listings-grid">
            {listingsData.listings.map((listing) => (
              <div key={listing.id} className="listing-card">
                <div className="listing-card-header">
                  <div className="listing-thumbnail">
                    <img src={getImageUrl(listing.featuredImage)} alt={listing.title} />
                    {listing.isPromoted && (
                      <span className="featured-badge-overlay">
                        <FiStar /> {t('admin.listings.featured', 'Featured')}
                      </span>
                    )}
                  </div>
                  <ListingStatusBadge status={listing.status} />
                </div>
                
                <div className="listing-card-content">
                  <h3 className="listing-title">
                    <Link to={`/listings/${listing.id}`} target="_blank">
                      {listing.title}
                    </Link>
                  </h3>
                  <div className="listing-details">
                    <div className="listing-price">{formatCurrency(listing.price)}</div>
                    <div className="listing-category">{listing.category?.name || '-'}</div>
                  </div>
                  <div className="listing-meta">
                    <div className="listing-seller">
                      {listing.user && (
                        <Link to={`/admin/users/${listing.user.id}`}>
                          {listing.user.firstName} {listing.user.lastName}
                        </Link>
                      )}
                    </div>
                    <div className="listing-date">{formatDate(new Date(listing.createdAt))}</div>
                  </div>
                </div>
                
                <div className="listing-card-footer">
                  <div className="action-buttons">
                    <Link to={`/listings/${listing.id}`} target="_blank" className="action-button view" title={t('admin.view', 'View')}>
                      <FiEye />
                    </Link>
                    
                    <Link to={`/admin/listings/edit/${listing.id}`} className="action-button edit" title={t('admin.edit', 'Edit')}>
                      <FiEdit />
                    </Link>
                    
                    <button
                      className={`action-button ${listing.isPromoted ? 'featured' : 'feature'}`}
                      onClick={() => handleToggleFeatured(listing.id, !!listing.isPromoted)}
                      disabled={isUpdating}
                      title={listing.isPromoted ? t('admin.unfeature', 'Remove Featured') : t('admin.feature', 'Make Featured')}
                    >
                      <FiStar />
                    </button>
                    
                    {listing.status === 'pending' && (
                      <>
                        <button
                          className="action-button approve"
                          onClick={() => handleApproveListing(listing.id)}
                          disabled={isApproving}
                          title={t('admin.approve', 'Approve')}
                        >
                          <FiCheck />
                        </button>
                      </>
                    )}
                    
                    <button
                      className="action-button delete"
                      onClick={() => handleDeleteListing(listing.id)}
                      disabled={isDeleting}
                      title={t('admin.delete', 'Delete')}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {listingsData.listings.length === 0 && (
              <div className="empty-state">
                <FiAlertCircle size={32} />
                <p>{t('admin.listings.noResults', 'No listings found. Try adjusting your filters.')}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="pagination">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="pagination-button"
          >
            {t('admin.prev', 'Previous')}
          </button>
          <div className="pagination-info">
            {t('admin.page', 'Page')} {page} {t('admin.of', 'of')} {Math.ceil((listingsData.total || 0) / 10)}
          </div>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= Math.ceil((listingsData.total || 0) / 10)}
            className="pagination-button"
          >
            {t('admin.next', 'Next')}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ListingManagement; 