import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { useGetAdminListingsQuery } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { FiClock, FiAlertCircle } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../../utils/date';
import { Link } from 'react-router-dom';
import './styles.scss';

const PendingListingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = React.useState(1);
  
  // Pre-apply the pending filter
  const { 
    data: listingsData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useGetAdminListingsQuery({ 
    page, 
    limit: 10, 
    status: 'pending' 
  });
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <LoadingSpinner />
          <p>{t('admin.listings.loading', 'Loading pending listings...')}</p>
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
          <h2>{t('admin.listings.error', 'Error loading pending listings')}</h2>
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
        <title>{t('admin.pending_listings', 'Pending Listings')} | Admin</title>
      </Helmet>
      <div className="admin-listings">
        <div className="page-header">
          <h1>
            <FiClock className="header-icon" />
            {t('admin.pending_listings', 'Pending Listings')}
          </h1>
          <p className="page-description">
            {t('admin.pendingListingsDescription', 'Review and manage listings that require approval before publishing.')}
          </p>
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
                    <Link to={`/listings/${listing.slug}`} target="_blank">
                      {listing.title}
                    </Link>
                  </td>
                  <td>{formatCurrency(listing.price, listing.currency)}</td>
                  <td>{listing.category?.name || '-'}</td>
                  <td>
                    <Link to={`/admin/users/${listing.user?.id}`} className="seller-link">
                      {listing.user?.firstName} {listing.user?.lastName}
                    </Link>
                  </td>
                  <td>{formatDate(listing.createdAt)}</td>
                  <td className="actions-cell">
                    <button 
                      className="action-button view"
                      onClick={() => window.open(`/listings/${listing.slug}`, '_blank')}
                      title={t('admin.listings.view', 'View Listing')}
                    >
                      <FiClock />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {listingsData?.listings?.length === 0 && (
            <div className="empty-state">
              <p>{t('admin.listings.noPendingListings', 'No pending listings found.')}</p>
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

export default PendingListingsPage; 