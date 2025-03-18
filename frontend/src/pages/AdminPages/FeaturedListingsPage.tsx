import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { FaCrown, FaTrash, FaPencilAlt, FaEye } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { formatDate, formatPrice } from '../../utils/helpers';
import { useGetListingsQuery, Listing } from '../../services/api';
import AdminLayout from '../../components/Admin/AdminLayout';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import './styles.scss';

const FeaturedListingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Filter for featured listings
  const query = {
    page,
    limit,
    isFeatured: true
  };
  
  // Fetch featured listings
  const { 
    data: listingsData, 
    isLoading, 
    error, 
    refetch 
  } = useGetListingsQuery(query);
  
  const listings = listingsData?.data?.listings || [];
  const total = listingsData?.data?.pagination?.total || 0;
  const totalPages = listingsData?.data?.pagination?.totalPages || 1;
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Get time remaining for featured status
  const getTimeRemaining = (featuredUntil: string) => {
    const now = new Date();
    const end = new Date(featuredUntil);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return t('admin.featuredExpired');
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return t('admin.featuredDaysRemaining', { days, hours });
    } else {
      return t('admin.featuredHoursRemaining', { hours });
    }
  };
  
  return (
    <AdminLayout>
      <Helmet>
        <title>{t('admin.featuredListings')} | Admin</title>
      </Helmet>
      
      <div className="admin-page">
        <div className="admin-page__header">
          <h1>
            <FaCrown className="admin-page__header-icon" />
            {t('admin.featuredListings')}
          </h1>
          
          <div className="admin-page__header-actions">
            <button 
              className="admin-page__refresh-button"
              onClick={() => refetch()}
              aria-label={t('common.refresh')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              {t('common.refresh')}
            </button>
          </div>
        </div>
        
        <div className="admin-page__content">
          {isLoading ? (
            <div className="admin-page__loading">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <ErrorMessage message={t('admin.errorLoadingFeatured')} />
          ) : listings.length === 0 ? (
            <div className="admin-page__empty">
              <h2>{t('admin.noFeaturedListings')}</h2>
              <p>{t('admin.noFeaturedListingsDescription')}</p>
            </div>
          ) : (
            <>
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('admin.title')}</th>
                      <th>{t('admin.category')}</th>
                      <th>{t('admin.price')}</th>
                      <th>{t('admin.seller')}</th>
                      <th>{t('admin.featuredUntil')}</th>
                      <th>{t('admin.timeRemaining')}</th>
                      <th>{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing: Listing) => (
                      <tr key={listing.id}>
                        <td>
                          <div className="admin-table__title-cell">
                            {listing.featuredImage && (
                              <img 
                                src={listing.featuredImage}
                                alt={listing.title}
                                className="admin-table__thumbnail"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/placeholder.png';
                                }}
                              />
                            )}
                            <span>{listing.title}</span>
                          </div>
                        </td>
                        <td>{listing.category?.name || '-'}</td>
                        <td>{formatPrice(listing.price)}</td>
                        <td>
                          {listing.user ? `${listing.user.firstName} ${listing.user.lastName}` : '-'}
                        </td>
                        <td>{listing.featuredUntil ? formatDate(listing.featuredUntil) : '-'}</td>
                        <td>
                          {listing.featuredUntil ? (
                            <span className="admin-table__featured-time">
                              {getTimeRemaining(listing.featuredUntil)}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <div className="admin-table__actions">
                            <Link 
                              to={`/listings/${listing.id}`}
                              className="admin-table__action-button"
                              aria-label={t('common.view')}
                            >
                              <FaEye />
                            </Link>
                            <Link 
                              to={`/admin/listings/edit/${listing.id}`}
                              className="admin-table__action-button"
                              aria-label={t('common.edit')}
                            >
                              <FaPencilAlt />
                            </Link>
                            <button
                              className="admin-table__action-button admin-table__action-button--danger"
                              onClick={() => {
                                if (window.confirm(t('admin.confirmRemoveFeatured'))) {
                                  // Code to remove featured status
                                  console.log('Remove featured status for', listing.id);
                                }
                              }}
                              aria-label={t('admin.removeFeatured')}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {totalPages > 1 && (
                <div className="admin-page__pagination">
                  <Pagination 
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default FeaturedListingsPage; 