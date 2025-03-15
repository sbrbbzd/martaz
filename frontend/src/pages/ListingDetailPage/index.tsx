import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useGetListingQuery, useChangeListingStatusMutation } from '../../services/api';
import { skipToken } from '@reduxjs/toolkit/query/react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import './styles.scss';
import { selectAuthState } from '../../store/slices/authSlice';

// Define a fallback component for debugging
const DebugFallback: React.FC<{error: any}> = ({error}) => (
  <div style={{padding: '20px', backgroundColor: '#ffeeee', border: '1px solid red', borderRadius: '5px', margin: '20px'}}>
    <h3>Something went wrong:</h3>
    <pre style={{overflow: 'auto', maxHeight: '300px'}}>{JSON.stringify(error || 'Unknown error', null, 2)}</pre>
    <p>
      <Link to="/listings" style={{color: 'blue', textDecoration: 'underline'}}>
        Back to listings
      </Link>
    </p>
  </div>
);

// Wrap the listing detail page in an error boundary
class ListingErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Listing detail error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <DebugFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

const ListingDetailPage: React.FC = () => {
  try {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [activeImage, setActiveImage] = useState(0);
    const [showContactInfo, setShowContactInfo] = useState(false);
    
    // Fix the selector by using type assertion
    const { isAuthenticated, user } = useSelector(selectAuthState);
    
    // Fetch listing data - only when id is available
    const { 
      data: listingResponse, 
      isLoading, 
      error, 
      refetch 
    } = useGetListingQuery(id ? id : skipToken);
    
    // Log the response for debugging - use only when needed
    useEffect(() => {
      if (error) {
        console.error("Error loading listing:", error);
      }
    }, [error]);
    
    // Mutation for changing listing status
    const [changeStatus, { isLoading: isChangingStatus }] = useChangeListingStatusMutation();
    
    // Handle status change with useCallback to prevent recreating on each render
    const handleStatusChange = useCallback(async (newStatus: string) => {
      if (!listingResponse?.data?.id) return;
      
      try {
        await changeStatus({
          id: listingResponse.data.id,
          status: newStatus
        }).unwrap();
        
        // Show success message or redirect
        if (newStatus === 'deleted') {
          navigate('/listings');
        }
      } catch (error) {
        console.error('Failed to change status:', error);
      }
    }, [listingResponse, changeStatus, navigate]);
    
    // Handle errors and loading
    if (isLoading) {
      return (
        <div className="listing-detail-page">
          <div className="listing-detail-page__container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingSpinner size="large" text={t('listing.loading')} />
          </div>
        </div>
      );
    }
    
    if (error || !listingResponse || !listingResponse.data) {
      return (
        <div className="listing-detail-page">
          <div className="listing-detail-page__container">
            <ErrorMessage 
              message={t('listing.notFound')}
              details={t('listing.notFoundDetails')}
              onRetry={() => refetch()}
            />
            <div className="listing-detail-page__back">
              <Link to="/listings">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"></path>
                </svg>
                {t('common.backToListings')}
              </Link>
            </div>
          </div>
        </div>
      );
    }
    
    // Safely access listing data with defaults for all potentially missing properties
    const listing = listingResponse.data || {};
    
    // Safe access to properties
    const isOwner = isAuthenticated && user?.id === listing?.userId;
    const isAdmin = isAuthenticated && user?.role === 'admin';
    const canEdit = isOwner || isAdmin;
    
    // Format price with thousand separators - updated to handle string values and prevent NaN
    const formatPrice = (value?: number | string): string => {
      if (value === undefined || value === null) {
        return '0';
      }
      try {
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(numericValue) ? '0' : numericValue.toLocaleString('az-AZ');
      } catch (e) {
        console.error('Error formatting price:', e);
        return '0';
      }
    };
    
    // Format date with error handling
    const formatDate = (dateString?: string): string => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('az-AZ', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (e) {
        console.error('Error formatting date:', e);
        return '';
      }
    };
    
    // Get all images - optimized to process only once with error handling
    const images = React.useMemo(() => {
      try {
        const imgArray = Array.isArray(listing.images) ? [...listing.images] : [];
        
        // Add featured image if it exists and isn't already included
        if (listing.featuredImage && !imgArray.includes(listing.featuredImage)) {
          imgArray.unshift(listing.featuredImage);
        }
        
        // If no images, add placeholder
        if (imgArray.length === 0) {
          imgArray.push('/images/placeholder.jpg');
        }
        
        return imgArray;
      } catch (e) {
        console.error('Error processing images:', e);
        return ['/images/placeholder.jpg'];
      }
    }, [listing.images, listing.featuredImage]);
    
    // Defensive access to attributes
    const attributes = listing.attributes || {};
    const attributeEntries = Object.entries(attributes);
    
    return (
      <div className="listing-detail-page">
        <Helmet>
          <title>{listing.title || 'Listing'} | Mart.az</title>
          <meta name="description" content={listing.description ? listing.description.substring(0, 160) : ''} />
        </Helmet>
        
        <div className="listing-detail-page__container">
          {/* Breadcrumbs */}
          <div className="listing-detail-page__breadcrumbs">
            <Link to="/">{t('common.home')}</Link>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <Link to="/listings">{t('common.listings')}</Link>
            {listing.category && (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                <Link to={`/categories/${listing.category.slug || ''}`}>{listing.category.name || ''}</Link>
              </>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span>{listing.title || ''}</span>
          </div>
          
          {/* Main Content */}
          <div className="listing-detail-page__content">
            {/* Image Gallery */}
            <div className="listing-detail-page__gallery">
              <div className="listing-detail-page__main-image">
                {images.length > 0 && (
                  <img 
                    src={images[activeImage]} 
                    alt={listing.title || 'Listing Image'} 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/placeholder.jpg';
                    }}
                  />
                )}
                {listing.isPromoted && (
                  <span className="listing-detail-page__badge listing-detail-page__badge--promoted">
                    {t('listing.promoted')}
                  </span>
                )}
                {listing.isFeatured && (
                  <span className="listing-detail-page__badge listing-detail-page__badge--featured">
                    {t('listing.featured')}
                  </span>
                )}
              </div>
              
              {images.length > 1 && (
                <div className="listing-detail-page__thumbnails">
                  {images.map((image, index) => (
                    <div 
                      key={index}
                      className={`listing-detail-page__thumbnail ${index === activeImage ? 'active' : ''}`}
                      onClick={() => setActiveImage(index)}
                    >
                      <img 
                        src={image} 
                        alt={`${listing.title || 'Listing'} - ${index + 1}`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder.jpg';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Listing Information */}
            <div className="listing-detail-page__info">
              <h1 className="listing-detail-page__title">{listing.title || ''}</h1>
              
              <div className="listing-detail-page__meta">
                <div className="listing-detail-page__price">
                  {formatPrice(listing.price)} {listing.currency || ''}
                </div>
                
                {listing.location && (
                  <div className="listing-detail-page__location">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {listing.location}
                  </div>
                )}
                
                {listing.createdAt && (
                  <div className="listing-detail-page__date">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                      <line x1="16" x2="16" y1="2" y2="6"></line>
                      <line x1="8" x2="8" y1="2" y2="6"></line>
                      <line x1="3" x2="21" y1="10" y2="10"></line>
                    </svg>
                    {t('listing.postedOn')}: {formatDate(listing.createdAt)}
                  </div>
                )}
                
                <div className="listing-detail-page__views">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  {listing.views || 0} {t('listing.views')}
                </div>
              </div>
              
              {listing.condition && (
                <div className="listing-detail-page__condition">
                  <strong>{t('listing.condition')}:</strong> {t(`condition.${listing.condition}`)}
                </div>
              )}
              
              {/* Description Section */}
              <div className="listing-detail-page__description">
                <h2>{t('listing.description')}</h2>
                <div className="listing-detail-page__description-content">
                  {listing.description ? 
                    listing.description.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    )) : 
                    <p>{t('listing.noDescription')}</p>
                  }
                </div>
              </div>
              
              {/* Attributes Section */}
              {attributeEntries.length > 0 && (
                <div className="listing-detail-page__attributes">
                  <h2>{t('listing.attributes')}</h2>
                  <ul>
                    {attributeEntries.map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Contact Section */}
              <div className="listing-detail-page__contact">
                <h2>{t('listing.contactSeller')}</h2>
                
                {!showContactInfo ? (
                  <button 
                    className="listing-detail-page__contact-button"
                    onClick={() => setShowContactInfo(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    {t('listing.showContactInfo')}
                  </button>
                ) : (
                  <div className="listing-detail-page__contact-info">
                    {listing.contactPhone && (
                      <div className="listing-detail-page__contact-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <a href={`tel:${listing.contactPhone}`}>{listing.contactPhone}</a>
                      </div>
                    )}
                    
                    {listing.contactEmail && (
                      <div className="listing-detail-page__contact-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </svg>
                        <a href={`mailto:${listing.contactEmail}`}>{listing.contactEmail}</a>
                      </div>
                    )}
                    
                    {!listing.contactPhone && !listing.contactEmail && (
                      <p>{t('listing.noContactInfo')}</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Seller Information */}
              {listing.user && (
                <div className="listing-detail-page__seller">
                  <h2>{t('listing.aboutSeller')}</h2>
                  <div className="listing-detail-page__seller-info">
                    <img 
                      src={listing.user.profileImage || '/images/user-placeholder.jpg'} 
                      alt={`${listing.user.firstName || ''} ${listing.user.lastName || ''}`}
                      className="listing-detail-page__seller-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/user-placeholder.jpg';
                      }}
                    />
                    <div>
                      <h3>{listing.user.firstName || ''} {listing.user.lastName || ''}</h3>
                      {listing.user.createdAt && (
                        <p>{t('listing.memberSince')} {formatDate(listing.user.createdAt)}</p>
                      )}
                      {listing.user.id && (
                        <Link to={`/users/${listing.user.id}`} className="listing-detail-page__seller-link">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          {t('listing.viewProfile')}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Admin Actions */}
              {canEdit && (
                <div className="listing-detail-page__actions">
                  <h2>{t('listing.actions')}</h2>
                  <div className="listing-detail-page__buttons">
                    {listing.id && (
                      <Link to={`/listings/${listing.id}/edit`} className="listing-detail-page__edit-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                        </svg>
                        {t('listing.edit')}
                      </Link>
                    )}
                    
                    {listing.status === 'active' && (
                      <button 
                        className="listing-detail-page__status-button"
                        onClick={() => handleStatusChange('sold')}
                        disabled={isChangingStatus}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        {t('listing.markAsSold')}
                      </button>
                    )}
                    
                    {listing.status === 'sold' && (
                      <button 
                        className="listing-detail-page__status-button"
                        onClick={() => handleStatusChange('active')}
                        disabled={isChangingStatus}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10"></polyline>
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        {t('listing.markAsActive')}
                      </button>
                    )}
                    
                    <button 
                      className="listing-detail-page__delete-button"
                      onClick={() => {
                        if (window.confirm(t('listing.confirmDelete'))) {
                          handleStatusChange('deleted');
                        }
                      }}
                      disabled={isChangingStatus}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                      {t('listing.delete')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Back Link */}
          <div className="listing-detail-page__back">
            <Link to="/listings">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
              </svg>
              {t('common.backToListings')}
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Rendering error in ListingDetailPage:", error);
    return (
      <div className="listing-detail-page">
        <div className="listing-detail-page__container">
          <DebugFallback error={error} />
        </div>
      </div>
    );
  }
};

// Export the component wrapped in error boundary
export default function SafeListingDetailPage() {
  return (
    <ListingErrorBoundary>
      <ListingDetailPage />
    </ListingErrorBoundary>
  );
} 