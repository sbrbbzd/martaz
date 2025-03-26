import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiPlus, FiEye, FiEdit, FiTrash2, FiAlertCircle, FiFilter, FiMapPin } from 'react-icons/fi';

import { useGetMyListingsQuery, useDeleteListingMutation } from '../../../services/api';
import { getImageUrl, markImageAsFailed, isFailedImage } from '../../../utils/helpers';
import { toast } from 'react-toastify';

// Placeholder image
const PLACEHOLDER_IMAGE = getImageUrl('placeholder.jpg');

// Status options for filter (will be translated at runtime)
const STATUS_OPTIONS = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'active', labelKey: 'listings.status.active' },
  { value: 'pending', labelKey: 'listings.status.pending' },
  { value: 'inactive', labelKey: 'listings.status.inactive' },
  { value: 'rejected', labelKey: 'listings.status.rejected' },
];

const MyListingsTab: React.FC = () => {
  const { t } = useTranslation();
  
  // Query params state
  const [listingsParams, setListingsParams] = useState({
    page: 1,
    limit: 12,
    status: 'all',
  });
  
  // Get listings data
  const { 
    data: listingsData, 
    isLoading, 
    isFetching: listingsFetching,
    refetch: refetchListings,
    error: listingsError 
  } = useGetMyListingsQuery(listingsParams);
  
  // Delete mutation
  const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();
  
  // Handle status filter change
  const handleStatusChange = (status: string) => {
    setListingsParams(prev => ({
      ...prev,
      status,
      page: 1, // Reset to first page when filter changes
    }));
  };
  
  // Load more results
  const handleLoadMore = () => {
    setListingsParams(prev => ({
      ...prev,
      page: prev.page + 1,
    }));
  };
  
  // Handle delete
  const handleDeleteListing = async (id: string) => {
    if (window.confirm(t('listings.confirmDelete'))) {
      try {
        await deleteListing(id).unwrap();
        toast.success(t('listings.deleteSuccess'));
        refetchListings();
      } catch (error) {
        console.error('Failed to delete listing:', error);
        toast.error(t('listings.deleteError'));
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="my-listings-tab">
        <div className="my-listings-tab__header">
          <h2>{t('profile.myListings.title')}</h2>
        </div>
        <div className="my-listings-tab__loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (listingsError) {
    return (
      <div className="my-listings-tab">
        <div className="my-listings-tab__header">
          <h2>{t('profile.myListings.title')}</h2>
        </div>
        <div className="my-listings-tab__error">
          <FiAlertCircle className="error-icon" />
          <h3>{t('common.error')}</h3>
          <p>{t('listings.loadError')}</p>
          <button onClick={() => refetchListings()}>
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  const listings = listingsData?.data?.listings || [];
  
  // Empty state
  if (!listings.length) {
    return (
      <div className="my-listings-tab">
        <div className="my-listings-tab__header">
          <h2>{t('profile.myListings.title')}</h2>
          
          <Link to="/create-listing" className="btn btn--primary btn--large">
            <FiPlus size={18} />
            <span>{t('profile.createListing')}</span>
          </Link>
        </div>
        <div className="my-listings-tab__empty">
          <h3>{t('profile.myListings.emptyTitle')}</h3>
          <p>{t('profile.myListings.emptyDescription')}</p>
          <Link to="/create-listing" className="btn btn--primary btn--large">
            <FiPlus size={18} />
            <span>{t('profile.myListings.browseCta')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="my-listings-tab">
      <div className="my-listings-tab__header">
        <h2>{t('profile.myListings.title')}</h2>
        
        <Link to="/create-listing" className="btn btn--primary btn--large">
          <FiPlus size={18} />
          <span>{t('profile.createListing')}</span>
        </Link>
      </div>
      
      <div className="my-listings-tab__filters">
        <FiFilter className="filter-icon" />
        <div className="status-filter">
          {STATUS_OPTIONS.map(option => (
            <button
              key={option.value}
              className={`status-filter__btn ${listingsParams.status === option.value ? 'status-filter__btn--active' : ''}`}
              onClick={() => handleStatusChange(option.value)}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="my-listings-tab__grid">
        {listings.map((listing) => {
          // Use the helper functions to get image URLs
          let imageUrl;
          
          if (listing.featuredImage) {
            imageUrl = getImageUrl(listing.featuredImage);
          } else if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
            // Find the first non-failed image
            const validImage = listing.images.find(img => !isFailedImage(img));
            imageUrl = validImage ? getImageUrl(validImage) : PLACEHOLDER_IMAGE;
          } else {
            imageUrl = PLACEHOLDER_IMAGE;
          }
          
          return (
            <div key={listing.id} className="my-listings-tab__item">
              <div className="item-image">
                <img 
                  src={imageUrl}
                  alt={listing.title}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.log('Image failed to load:', imageUrl);
                    
                    // Mark as failed image
                    if (listing.featuredImage) {
                      markImageAsFailed(listing.featuredImage);
                    }
                    
                    // Try to use first image from array if featured image failed
                    if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
                      const nextImage = listing.images.find(img => !isFailedImage(img));
                      if (nextImage) {
                        target.src = getImageUrl(nextImage);
                        return;
                      }
                    }
                    
                    // If all fail, use placeholder
                    target.src = PLACEHOLDER_IMAGE;
                  }}
                  loading="lazy"
                />
              </div>
              <div className={`status-badge status-badge--${listing.status || 'active'}`}>
                {t(`listings.status.${listing.status || 'active'}`)}
              </div>
              {listing.isPromoted && (
                <span className="item-badge">{t('listing.promoted')}</span>
              )}
              <div className="actions-container">
                <Link to={`/edit-listing/${listing.id}`} className="edit-btn" title={t('profile.edit')}>
                  <FiEdit />
                </Link>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteListing(listing.id)}
                  disabled={isDeleting}
                  title={t('profile.delete')}
                >
                  <FiTrash2 />
                </button>
              </div>
              <div className="item-content">
                <h3 className="item-title">{listing.title}</h3>
                {listing.location && (
                  <div className="item-location">
                    <FiMapPin /> {listing.location}
                  </div>
                )}
                <div className="item-price">
                  <div>
                    {listing.price} <span className="currency">{listing.currency || '₼'}</span>
                  </div>
                  <Link to={`/listings/${listing.slug || listing.id}`} className="view-details">
                    {t('common.viewDetails')}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(listingsData?.data?.totalPages && listingsData.data.totalPages > listingsParams.page) && (
        <div className="my-listings-tab__load-more">
          <button
            className="btn btn--outline btn--large"
            onClick={handleLoadMore}
            disabled={listingsFetching}
          >
            {listingsFetching ? t('common.loading') : t('common.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
};

export default MyListingsTab; 