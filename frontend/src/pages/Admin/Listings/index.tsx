import React, { useState } from 'react';
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
  FiFlag
} from 'react-icons/fi';
import AdminLayout from '../../../components/Admin/AdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { 
  useGetAdminListingsQuery, 
  useApproveListingMutation, 
  useRejectListingMutation,
  useAdminDeleteListingMutation,
  useUpdateListingMutation 
} from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/date';
import './styles.scss';

interface ListingFilters {
  status?: string;
  category?: string;
  search?: string;
  sort?: string;
}

const ListingManagement: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ListingFilters>({});
  const [searchText, setSearchText] = useState('');
  
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
  
  // Mutations for listing actions
  const [approveListing, { isLoading: isApproving }] = useApproveListingMutation();
  const [rejectListing, { isLoading: isRejecting }] = useRejectListingMutation();
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
      // Could add notification here
    } catch (err) {
      console.error('Failed to approve listing:', err);
      // Could add error notification here
    }
  };
  
  // Handle listing rejection with reason
  const handleRejectListing = async (id: string) => {
    const reason = prompt(t('admin.listings.rejectReason', 'Enter a reason for rejection (optional):'));
    
    try {
      await rejectListing({ id, reason: reason || undefined }).unwrap();
      // Could add notification here
    } catch (err) {
      console.error('Failed to reject listing:', err);
      // Could add error notification here
    }
  };
  
  // Handle listing deletion with confirmation
  const handleDeleteListing = async (id: string) => {
    if (window.confirm(t('admin.listings.deleteConfirmation', 'Are you sure you want to delete this listing? This action cannot be undone.'))) {
      try {
        await deleteListing(id).unwrap();
        // Could add notification here
      } catch (err) {
        console.error('Failed to delete listing:', err);
        // Could add error notification here
      }
    }
  };
  
  // Handle toggling featured status
  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      await updateListing({ 
        id, 
        listing: { isFeatured: !isFeatured } 
      }).unwrap();
      // Could add notification here
    } catch (err) {
      console.error('Failed to update featured status:', err);
      // Could add error notification here
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
          <div className="filter-tabs">
            <button 
              className={!filters.status ? 'active' : ''}
              onClick={() => setFilters(prev => ({ ...prev, status: undefined }))}
            >
              {t('admin.all', 'All Listings')}
            </button>
            <button 
              className={filters.status === 'reported' ? 'active' : ''}
              onClick={() => setFilters(prev => ({ ...prev, status: 'reported' }))}
            >
              {t('admin.reported_listings', 'Reported Listings')}
            </button>
            <button 
              className={filters.status === 'featured' ? 'active' : ''}
              onClick={() => setFilters(prev => ({ ...prev, status: 'featured' }))}
            >
              {t('admin.featured_listings', 'Featured Listings')}
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="admin-listings">
        <div className="page-header">
          <h1>{t('admin.listings.title', 'Listing Management')}</h1>
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
              <label>{t('admin.listings.filterStatus', 'Status')}:</label>
              <select 
                onChange={(e) => handleFilterChange('status', e.target.value)}
                value={filters.status || ''}
              >
                <option value="">{t('admin.all', 'All')}</option>
                <option value="active">{t('admin.listings.statusActive', 'Active')}</option>
                <option value="pending">{t('admin.listings.statusPending', 'Pending')}</option>
                <option value="rejected">{t('admin.listings.statusRejected', 'Rejected')}</option>
                <option value="inactive">{t('admin.listings.statusInactive', 'Inactive')}</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>{t('admin.listings.filterSort', 'Sort By')}:</label>
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
        
        <div className="listings-table-container">
          <table className="listings-table">
            <thead>
              <tr>
                <th>{t('admin.listings.image', 'Image')}</th>
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
              {listingsData?.listings?.map((listing) => (
                <tr key={listing.id}>
                  <td className="image-cell">
                    <div className="listing-image">
                      <img 
                        src={listing.featuredImage || listing.images?.[0] || '/placeholder-image.jpg'} 
                        alt={listing.title} 
                      />
                    </div>
                  </td>
                  <td>
                    <div className="listing-title">
                      <Link to={`/listings/${listing.slug}`} target="_blank">
                        {listing.title}
                      </Link>
                      {listing.isFeatured && (
                        <span className="featured-badge">
                          <FiStar />
                          {t('admin.listings.featured', 'Featured')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{formatCurrency(listing.price, listing.currency)}</td>
                  <td>{listing.category?.name || '-'}</td>
                  <td>
                    <Link to={`/admin/users/${listing.user?.id}`} className="seller-link">
                      {listing.user?.firstName} {listing.user?.lastName}
                    </Link>
                  </td>
                  <td>
                    <span className={`status-badge ${listing.status}`}>
                      {listing.status}
                    </span>
                  </td>
                  <td>{formatDate(listing.createdAt)}</td>
                  <td className="actions-cell">
                    <button 
                      className="action-button view"
                      onClick={() => window.open(`/listings/${listing.slug}`, '_blank')}
                      title={t('admin.listings.view', 'View Listing')}
                    >
                      <FiEye />
                    </button>
                    
                    <button 
                      className="action-button star"
                      onClick={() => handleToggleFeatured(listing.id, !!listing.isFeatured)}
                      disabled={isUpdating}
                      title={listing.isFeatured ? t('admin.listings.unfeature', 'Remove Featured') : t('admin.listings.feature', 'Mark as Featured')}
                    >
                      <FiStar />
                    </button>
                    
                    {listing.status === 'pending' && (
                      <>
                        <button 
                          className="action-button approve"
                          onClick={() => handleApproveListing(listing.id)}
                          disabled={isApproving}
                          title={t('admin.listings.approve', 'Approve Listing')}
                        >
                          <FiCheckCircle />
                        </button>
                        
                        <button 
                          className="action-button reject"
                          onClick={() => handleRejectListing(listing.id)}
                          disabled={isRejecting}
                          title={t('admin.listings.reject', 'Reject Listing')}
                        >
                          <FiX />
                        </button>
                      </>
                    )}
                    
                    <button 
                      className="action-button edit"
                      onClick={() => window.open(`/admin/listings/${listing.id}/edit`, '_blank')}
                      title={t('admin.listings.edit', 'Edit Listing')}
                    >
                      <FiEdit />
                    </button>
                    
                    <button 
                      className="action-button delete"
                      onClick={() => handleDeleteListing(listing.id)}
                      disabled={isDeleting}
                      title={t('admin.listings.delete', 'Delete Listing')}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {listingsData?.listings?.length === 0 && (
            <div className="empty-state">
              <p>{t('admin.listings.noListings', 'No listings found matching your criteria.')}</p>
            </div>
          )}
        </div>

        <div className="pagination">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
          >
            {t('admin.prev', 'Previous')}
          </button>
          <span>
            {t('admin.page', 'Page')} {page} {t('admin.of', 'of')} {Math.ceil((listingsData?.total || 0) / 10)}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= Math.ceil((listingsData?.total || 0) / 10)}
          >
            {t('admin.next', 'Next')}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ListingManagement; 