import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { 
  useGetReportedListingsQuery, 
  useUpdateReportStatusMutation,
  useUpdateListingMutation
} from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { 
  FiFlag, 
  FiAlertCircle, 
  FiEye, 
  FiTrash2, 
  FiFilter, 
  FiRefreshCw,
  FiGrid,
  FiList,
  FiSearch,
  FiCheck
} from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../../utils/date';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../../utils/helpers';
import './styles.scss';

// Status badge component for reports
const ReportStatusBadge = ({ status }: { status: string }) => {
  // Get badge classes based on status
  const getBadgeClass = () => {
    switch (status) {
      case 'reviewed':
        return 'report-status-badge report-status-badge-reviewed';
      case 'pending':
      default:
        return 'report-status-badge report-status-badge-pending';
    }
  };
  
  // Format the status text
  const getFormattedStatus = () => {
    if (status === 'reviewed') return 'Viewed';
    return 'Not Viewed';
  };
  
  return (
    <span className={getBadgeClass()}>
      {getFormattedStatus()}
    </span>
  );
};

// Listing status badge component
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

const ReportedListingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('');
  const [listingStatusFilter, setListingStatusFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Use the reported listings query instead of the admin listings query
  const { 
    data: reportData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useGetReportedListingsQuery({ 
    page, 
    limit: 10,
    status: reportStatusFilter || undefined
  });
  
  // Add the update report status mutation
  const [updateStatus, { isLoading: isUpdating }] = useUpdateReportStatusMutation();
  
  // Add the update listing mutation instead of delete
  const [updateListing, { isLoading: isUpdatingListing }] = useUpdateListingMutation();
  
  // Reset filters
  const resetFilters = () => {
    setReportStatusFilter('');
    setListingStatusFilter('');
    setSearchText('');
    setPage(1);
  };
  
  // Filter reports by listing status if filter is applied
  const filteredReports = reportData?.reports?.filter(report => 
    (!listingStatusFilter || report.listing.status === listingStatusFilter) &&
    (!searchText || 
      report.listing.title.toLowerCase().includes(searchText.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchText.toLowerCase()) ||
      (report.additionalInfo && report.additionalInfo.toLowerCase().includes(searchText.toLowerCase())) ||
      `${report.reporter.firstName} ${report.reporter.lastName}`.toLowerCase().includes(searchText.toLowerCase())
    )
  ) || [];
  
  // Handle search
  const handleSearch = () => {
    setPage(1);
  };
  
  // Handle status updates
  const handleUpdateStatus = async (id: string, status: 'reviewed') => {
    try {
      await updateStatus({ id, status }).unwrap();
      refetch();
      toast.success(t('admin.reports.statusUpdateSuccess', 'Report status updated successfully'));
    } catch (err) {
      console.error('Failed to update report status:', err);
      toast.error(t('admin.reports.statusUpdateError', 'Failed to update report status'));
    }
  };
  
  // Handle marking listing as deleted and resolve report
  const handleMarkListingDeletedAndResolveReport = async (reportId: string, listing: any) => {
    try {
      // First update the listing status to deleted
      await updateListing({
        id: listing.id,
        listing: {
          ...listing,
          status: 'deleted'
        }
      }).unwrap();
      
      // Find all reports for this listing in the current filtered list and mark them as viewed
      const reportsForThisListing = filteredReports.filter(
        report => report.listing.id === listing.id && report.status !== 'reviewed'
      );
      
      // Update status for all matched reports to viewed
      if (reportsForThisListing.length > 0) {
        const updatePromises = reportsForThisListing.map(report => 
          updateStatus({ id: report.id, status: 'reviewed' }).unwrap()
        );
        
        await Promise.all(updatePromises);
      }
      
      // Refresh data
      refetch();
      
      toast.success(t('admin.reports.listingMarkedDeleted', 'Listing marked as deleted and all reports for this listing marked as viewed'));
    } catch (err) {
      console.error('Failed to mark listing as deleted or update report status:', err);
      toast.error(t('admin.reports.actionError', 'Failed to complete the requested action'));
    }
  };
  
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
  if (isError || !reportData) {
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
          <div className="header-left">
            <h1>
              <FiFlag className="header-icon" />
              {t('admin.reported_listings', 'Reported Listings')}
            </h1>
            <p className="listings-count">
              {filteredReports.length} {t('admin.reports.count', 'reports found')}
            </p>
          </div>
          <div className="header-actions">
            <button className="refresh-button" onClick={() => refetch()}>
              <FiRefreshCw />
              {t('common.refresh', 'Refresh')}
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
            className={!reportStatusFilter ? 'active' : ''}
            onClick={() => setReportStatusFilter('')}
          >
            {t('admin.all', 'All Reports')}
          </button>
          <button 
            className={reportStatusFilter === 'pending' ? 'active' : ''}
            onClick={() => setReportStatusFilter('pending')}
          >
            {t('admin.reportedListings.status.notViewed', 'Not Viewed')}
          </button>
          <button 
            className={reportStatusFilter === 'reviewed' ? 'active' : ''}
            onClick={() => setReportStatusFilter('reviewed')}
          >
            {t('admin.reportedListings.status.viewed', 'Viewed')}
          </button>
        </div>
        
        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('admin.listings.search', 'Search in reports...')}
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
              <label htmlFor="listing-status-filter">
                <FiFilter />
                {t('admin.listings.listingStatusFilter', 'Listing Status')}:
              </label>
              <select
                id="listing-status-filter"
                value={listingStatusFilter}
                onChange={(e) => {
                  setListingStatusFilter(e.target.value);
                  setPage(1); // Reset to first page on filter change
                }}
              >
                <option value="">{t('common.all', 'All')}</option>
                <option value="active">{t('admin.listings.listingStatus.active', 'Active')}</option>
                <option value="pending">{t('admin.listings.listingStatus.pending', 'Pending')}</option>
                <option value="deleted">{t('admin.listings.listingStatus.deleted', 'Deleted')}</option>
              </select>
            </div>
            
            <button className="reset-filters" onClick={resetFilters}>
              {t('common.resetFilters', 'Reset Filters')}
            </button>
          </div>
        </div>
        
        {viewMode === 'table' ? (
          <div className="listings-table-container">
            <table className="listings-table">
              <thead>
                <tr>
                  <th>{t('admin.listings.title', 'Title')}</th>
                  <th>{t('admin.listings.reportReason', 'Report Reason')}</th>
                  <th>{t('admin.listings.reporter', 'Reported By')}</th>
                  <th>{t('admin.listings.status', 'Status')}</th>
                  <th>{t('admin.listings.date', 'Date')}</th>
                  <th>{t('admin.listings.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="reported-listing-row">
                    <td className="listing-title-cell">
                      <div className="listing-title-wrapper">
                        {report.listing.featuredImage && (
                          <div className="listing-thumbnail">
                            <img src={getImageUrl(report.listing.featuredImage)} alt={report.listing.title} />
                          </div>
                        )}
                        <div className="listing-info">
                          <Link to={`/listings/${report.listing.slug || report.listing.id}`} target="_blank" className="listing-title">
                            {report.listing.title}
                          </Link>
                          <div className="listing-price">
                            {formatCurrency(report.listing.price)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="reason-cell">
                      <div className="reason-text">
                        <span className="reason-main">{report.reason}</span>
                        {report.additionalInfo && (
                          <div className="additional-info">
                            <strong>{t('admin.listings.additionalInfo', 'Additional Info')}:</strong>
                            <p>{report.additionalInfo}</p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <Link to={`/admin/users/${report.reporter.id}`} className="reporter-link">
                        {report.reporter.firstName} {report.reporter.lastName}
                      </Link>
                    </td>
                    <td className="status-cell">
                      <div className="status-badges-container">
                        <ReportStatusBadge status={report.status} />
                        {report.listing.status === 'deleted' && (
                          <ListingStatusBadge status={report.listing.status} />
                        )}
                      </div>
                    </td>
                    <td>{formatDate(report.createdAt)}</td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button 
                          className="action-button view"
                          onClick={() => window.open(`/listings/${report.listing.slug || report.listing.id}`, '_blank')}
                          title={t('admin.listings.view', 'View Listing')}
                        >
                          <FiEye />
                        </button>
                        <button 
                          className="action-button review"
                          onClick={() => {
                            if (window.confirm(t('admin.listings.markAsViewedConfirm', 'Mark this report as viewed?'))) {
                              handleUpdateStatus(report.id, 'reviewed');
                            }
                          }}
                          title={t('admin.listings.markAsViewed', 'Mark as Viewed')}
                          disabled={isUpdating || report.status === 'reviewed' || report.listing.status === 'deleted'}
                        >
                          <FiCheck />
                        </button>
                        <button 
                          className="action-button delete"
                          onClick={() => {
                            if (window.confirm(t('admin.listings.markAsDeletedConfirm', 'Mark this listing as deleted? This will mark all reports for this listing as viewed.'))) {
                              handleMarkListingDeletedAndResolveReport(report.id, report.listing);
                            }
                          }}
                          title={t('admin.listings.markAsDeleted', 'Mark Listing as Deleted')}
                          disabled={isUpdating || isUpdatingListing || report.listing.status === 'deleted'}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredReports.length === 0 && (
              <div className="empty-state">
                <FiAlertCircle size={32} />
                <p>{t('admin.listings.noReportedListings', 'No reported listings found. Try adjusting your filters.')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="listings-grid">
            {filteredReports.map((report) => (
              <div key={report.id} className="listing-card">
                <div className="listing-card-header">
                  <div className="listing-thumbnail">
                    <img src={getImageUrl(report.listing.featuredImage)} alt={report.listing.title} />
                  </div>
                  <div className="status-badges">
                    <ReportStatusBadge status={report.status} />
                    {report.listing.status === 'deleted' && (
                      <ListingStatusBadge status={report.listing.status} />
                    )}
                  </div>
                </div>
                
                <div className="listing-card-content">
                  <h3 className="listing-title">
                    <Link to={`/listings/${report.listing.slug || report.listing.id}`} target="_blank">
                      {report.listing.title}
                    </Link>
                  </h3>
                  <div className="listing-details">
                    <div className="listing-price">{formatCurrency(report.listing.price)}</div>
                    <div className="report-date">{formatDate(report.createdAt)}</div>
                  </div>
                  <div className="report-reason">
                    <strong>{t('admin.listings.reportReason', 'Reason')}:</strong> {report.reason}
                  </div>
                  {report.additionalInfo && (
                    <div className="additional-info-grid">
                      <p>{report.additionalInfo}</p>
                    </div>
                  )}
                  <div className="listing-meta">
                    <div className="listing-reporter">
                      <strong>{t('admin.listings.reporter', 'Reported By')}:</strong>
                      <Link to={`/admin/users/${report.reporter.id}`}>
                        {report.reporter.firstName} {report.reporter.lastName}
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="listing-card-footer">
                  <div className="action-buttons">
                    <button 
                      className="action-button view"
                      onClick={() => window.open(`/listings/${report.listing.slug || report.listing.id}`, '_blank')}
                      title={t('admin.listings.view', 'View Listing')}
                    >
                      <FiEye />
                    </button>
                    <button 
                      className="action-button review"
                      onClick={() => {
                        if (window.confirm(t('admin.listings.markAsViewedConfirm', 'Mark this report as viewed?'))) {
                          handleUpdateStatus(report.id, 'reviewed');
                        }
                      }}
                      title={t('admin.listings.markAsViewed', 'Mark as Viewed')}
                      disabled={isUpdating || report.status === 'reviewed' || report.listing.status === 'deleted'}
                    >
                      <FiCheck />
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => {
                        if (window.confirm(t('admin.listings.markAsDeletedConfirm', 'Mark this listing as deleted? This will mark all reports for this listing as viewed.'))) {
                          handleMarkListingDeletedAndResolveReport(report.id, report.listing);
                        }
                      }}
                      title={t('admin.listings.markAsDeleted', 'Mark Listing as Deleted')}
                      disabled={isUpdating || isUpdatingListing || report.listing.status === 'deleted'}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredReports.length === 0 && (
              <div className="empty-state">
                <FiAlertCircle size={32} />
                <p>{t('admin.listings.noReportedListings', 'No reported listings found. Try adjusting your filters.')}</p>
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
            {t('admin.page', 'Page')} {page} {t('admin.of', 'of')} {Math.ceil((reportData.total || 0) / 10)}
          </div>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= Math.ceil((reportData.total || 0) / 10)}
            className="pagination-button"
          >
            {t('admin.next', 'Next')}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReportedListingsPage; 