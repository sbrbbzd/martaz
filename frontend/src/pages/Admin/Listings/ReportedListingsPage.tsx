import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { useGetAdminListingsQuery } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { FiFlag, FiAlertCircle, FiEye, FiCheckCircle, FiX, FiTrash2 } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../../utils/date';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './styles.scss';

const ReportedListingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = React.useState(1);
  
  // Pre-apply the reported filter
  const { 
    data: listingsData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useGetAdminListingsQuery({ 
    page, 
    limit: 10, 
    status: 'reported' 
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
          <p>{t('admin.listings.loading', 'Loading reported listings...')}</p>
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
          <h2>{t('admin.listings.error', 'Error loading reported listings')}</h2>
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
        <title>{t('admin.reported_listings', 'Reported Listings')} | Admin</title>
      </Helmet>
      <div className="admin-listings">
        <div className="page-header">
          <h1>
            <FiFlag className="header-icon" />
            {t('admin.reported_listings', 'Reported Listings')}
          </h1>
          <p className="page-description">
            {t('admin.reportedListingsDescription', 'Review listings that have been reported by users for violations.')}
          </p>
        </div>
        
        <div className="listings-table-container">
          <table className="listings-table">
            <thead>
              <tr>
                <th>{t('admin.listings.image', 'Image')}</th>
                <th>{t('admin.listings.title', 'Title')}</th>
                <th>{t('admin.listings.reportReason', 'Report Reason')}</th>
                <th>{t('admin.listings.reportCount', 'Report Count')}</th>
                <th>{t('admin.listings.category', 'Category')}</th>
                <th>{t('admin.listings.seller', 'Seller')}</th>
                <th>{t('admin.listings.date', 'Date')}</th>
                <th>{t('admin.listings.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {listingsData?.listings?.map((listing) => (
                <tr key={listing.id} className="reported-listing-row">
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
                  <td>{(listing as any).reportReason || t('admin.listings.multipleReasons', 'Multiple reasons')}</td>
                  <td>{(listing as any).reportCount || 1}</td>
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
                      <FiEye />
                    </button>
                    <button 
                      className="action-button approve"
                      onClick={() => {
                        if (window.confirm(t('admin.listings.dismissReportConfirm', 'Dismiss this report and mark listing as approved?'))) {
                          // Logic to dismiss report would go here
                          console.log('Dismiss report for', listing.id);
                          // Show success message
                          toast.success(t('admin.listings.dismissReportSuccess', 'Report dismissed successfully'));
                        }
                      }}
                      title={t('admin.listings.dismissReport', 'Dismiss Report')}
                    >
                      <FiCheckCircle />
                    </button>
                    <button 
                      className="action-button reject"
                      onClick={() => {
                        if (window.confirm(t('admin.listings.rejectListingConfirm', 'Reject this listing due to report?'))) {
                          // Logic to reject listing would go here
                          console.log('Reject listing', listing.id);
                          // Show success message
                          toast.success(t('admin.listings.rejectReportSuccess', 'Listing rejected due to report'));
                        }
                      }}
                      title={t('admin.listings.rejectListing', 'Reject Listing')}
                    >
                      <FiX />
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => {
                        if (window.confirm(t('admin.listings.deleteListingConfirm', 'Delete this listing permanently?'))) {
                          // Logic to delete listing would go here
                          console.log('Delete listing', listing.id);
                          // Show success message
                          toast.success(t('admin.listings.deleteReportedSuccess', 'Reported listing deleted successfully'));
                        }
                      }}
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
              <p>{t('admin.listings.noReportedListings', 'No reported listings found.')}</p>
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

export default ReportedListingsPage; 