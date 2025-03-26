import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { 
  FiStar, 
  FiTrash2, 
  FiEdit, 
  FiEye, 
  FiAlertCircle, 
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList 
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminLayout from '../../../components/Admin/AdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { 
  useGetListingsQuery, 
  useUpdateListingMutation,
  Listing
} from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/date';
import { getImageUrl } from '../../../utils/helpers';
import './styles.scss';

interface ListingFilters {
  search?: string;
  sort?: string;
  category?: string;
}

const FeaturedListingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ListingFilters>({});
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Fetch featured/promoted listings with getListingsQuery which has proper isPromoted filter support
  const { 
    data: listingsData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useGetListingsQuery({ 
    page, 
    limit: 10,
    promoted: true, // Use promoted parameter which is properly supported
    status: 'active',
    ...filters
  });
  
  const [updateListing, { isLoading: isUpdating }] = useUpdateListingMutation();
  
  // Log API response for debugging
  useEffect(() => {
    if (listingsData?.data?.listings) {
      console.log('Featured listings data:', listingsData);
      if (listingsData.data.listings.length > 0) {
        console.log('First featured listing:', listingsData.data.listings[0]);
      }
    }
  }, [listingsData]);
  
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
  
  // Handle removing featured status
  const handleRemoveFeatured = async (id: string) => {
    if (window.confirm(t('admin.listings.removeFeaturedConfirmation', 'Are you sure you want to remove this listing from featured status? This will end its promotion.'))) {
      try {
        await updateListing({ 
          id, 
          listing: { isPromoted: false } 
        }).unwrap();
        
        toast.success(t('admin.listings.removeFeaturedSuccess', 'Listing removed from featured status successfully'));
        refetch();
      } catch (err) {
        console.error('Failed to update promotion status:', err);
        toast.error(t('admin.listings.removeFeaturedFailed', 'Failed to remove featured status'));
      }
    }
  };
  
  // Calculate time remaining for featured status
  const getTimeRemaining = (endDate?: string) => {
    if (!endDate) return null;
    
    const now = new Date();
    const promotionEnd = new Date(endDate);
    
    // If date is in the past, return "Expired"
    if (promotionEnd < now) {
      return t('admin.listings.promotionExpired', 'Expired');
    }
    
    const diffMs = promotionEnd.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return t('admin.listings.promotionDaysLeft', { days: diffDays, hours: diffHours });
    } else {
      return t('admin.listings.promotionHoursLeft', { hours: diffHours });
    }
  };
  
  // Transform data to match the expected format
  const transformedListings = listingsData?.data?.listings || [];
  const total = listingsData?.data?.total || 0;
  
  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <LoadingSpinner />
          <p>{t('admin.listings.loading', 'Loading featured listings...')}</p>
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
          <h2>{t('admin.listings.error', 'Error loading featured listings')}</h2>
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
      <Helmet>
        <title>{t('admin.featured_listings', 'Featured Listings')} | Admin</title>
      </Helmet>
      
      <div className="admin-listings">
        <div className="page-header">
          <div className="header-left">
            <h1>
              <FiStar className="header-icon" />
              {t('admin.featured_listings', 'Featured Listings')}
            </h1>
            <p className="listings-count">
              {total || 0} {t('admin.listings.featuredCount', 'featured listings found')}
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
        
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('admin.listings.searchFeatured', 'Search featured listings...')}
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
                <option value="promotion-end">{t('admin.listings.sortPromotionEnd', 'Promotion End Date')}</option>
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
            {transformedListings.length === 0 ? (
              <div className="empty-state">
                <FiStar size={32} />
                <p>{t('admin.listings.noFeaturedListings', 'No featured listings found.')}</p>
              </div>
            ) : (
              <table className="listings-table">
                <thead>
                  <tr>
                    <th>{t('admin.listings.title', 'Title')}</th>
                    <th>{t('admin.listings.price', 'Price')}</th>
                    <th>{t('admin.listings.category', 'Category')}</th>
                    <th>{t('admin.listings.seller', 'Seller')}</th>
                    <th>{t('admin.listings.status', 'Status')}</th>
                    <th>{t('admin.listings.promotionEnd', 'Promotion End')}</th>
                    <th>{t('admin.listings.timeRemaining', 'Time Remaining')}</th>
                    <th>{t('admin.listings.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transformedListings.map((listing: any) => (
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
                        <div className="status-badges-container">
                          <span className={`listing-status-badge listing-status-badge-${listing.status.toLowerCase()}`}>
                            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1).toLowerCase()}
                          </span>
                          <span className="featured-badge">
                            <FiStar /> {t('admin.listings.featured', 'Featured')}
                          </span>
                        </div>
                      </td>
                      <td>{listing.promotionEndDate ? formatDate(new Date(listing.promotionEndDate)) : '-'}</td>
                      <td>
                        <span className={`time-remaining ${!listing.promotionEndDate || new Date(listing.promotionEndDate) < new Date() ? 'expired' : ''}`}>
                          {listing.promotionEndDate 
                            ? getTimeRemaining(listing.promotionEndDate)
                            : t('admin.listings.noEndDate', 'No end date')}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <Link to={`/listings/${listing.id}`} target="_blank" className="action-button view" title={t('admin.view', 'View')}>
                            <FiEye />
                          </Link>
                          
                          <Link to={`/admin/listings/edit/${listing.id}`} className="action-button edit" title={t('admin.edit', 'Edit')}>
                            <FiEdit />
                          </Link>
                          
                          <button
                            className="action-button remove-featured"
                            onClick={() => handleRemoveFeatured(listing.id)}
                            disabled={isUpdating}
                            title={t('admin.removeFeatured', 'Remove Featured Status')}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="listings-grid">
            {transformedListings.length === 0 ? (
              <div className="empty-state">
                <FiStar size={32} />
                <p>{t('admin.listings.noFeaturedListings', 'No featured listings found.')}</p>
              </div>
            ) : (
              transformedListings.map((listing: any) => (
                <div key={listing.id} className="listing-card">
                  <div className="listing-card-header">
                    <div className="listing-thumbnail">
                      <img src={getImageUrl(listing.featuredImage)} alt={listing.title} />
                      <span className="featured-badge-overlay">
                        <FiStar /> {t('admin.listings.featured', 'Featured')}
                      </span>
                    </div>
                    <span className={`listing-status-badge listing-status-badge-${listing.status.toLowerCase()}`}>
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1).toLowerCase()}
                    </span>
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
                    <div className="promotion-info">
                      <div className="promotion-end">
                        <strong>{t('admin.listings.promotionEnd', 'Promotion End')}:</strong> 
                        {listing.promotionEndDate ? formatDate(new Date(listing.promotionEndDate)) : t('admin.listings.noEndDate', 'No end date')}
                      </div>
                      <div className="time-remaining-wrapper">
                        <span className={`time-remaining ${!listing.promotionEndDate || new Date(listing.promotionEndDate) < new Date() ? 'expired' : ''}`}>
                          {listing.promotionEndDate 
                            ? getTimeRemaining(listing.promotionEndDate)
                            : t('admin.listings.noEndDate', 'No end date')}
                        </span>
                      </div>
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
                        className="action-button remove-featured"
                        onClick={() => handleRemoveFeatured(listing.id)}
                        disabled={isUpdating}
                        title={t('admin.removeFeatured', 'Remove Featured Status')}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {total > 10 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="pagination-button"
            >
              {t('admin.prev', 'Previous')}
            </button>
            <div className="pagination-info">
              {t('admin.page', 'Page')} {page} {t('admin.of', 'of')} {Math.ceil((total || 0) / 10)}
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= Math.ceil((total || 0) / 10)}
              className="pagination-button"
            >
              {t('admin.next', 'Next')}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FeaturedListingsPage; 