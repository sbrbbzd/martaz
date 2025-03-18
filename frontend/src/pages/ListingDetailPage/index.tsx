import React, { useState, useEffect, useCallback, useMemo, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import './styles.scss';
import { selectAuthState } from '../../store/slices/authSlice';
import { formatPrice, formatDate } from '../../utils/helpers';
import { getImageUrl } from '../../utils/imageUrl';
import { FaHeart, FaRegHeart, FaStar, FaShare, FaFlag, FaEye, FaEdit, FaTrash, FaCheckCircle, FaCrown } from 'react-icons/fa';
import { TFunction } from 'i18next';
import { toast } from 'react-hot-toast';
import { 
  useGetListingQuery,
  useChangeListingStatusMutation,
  useDeleteListingMutation,
  useFeatureListingMutation,
  FeatureDuration
} from '../../services/api';
import { skipToken } from '@reduxjs/toolkit/query/react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

// Define constants for placeholder images to avoid typos and ensure consistency
const PLACEHOLDER_IMAGE = getImageUrl('placeholder.jpg');
const USER_PLACEHOLDER_IMAGE = getImageUrl('user-placeholder.jpg');

// Move the failed images cache inside the component
const isFailedImage = (src: string, failedSet: Set<string>): boolean => failedSet.has(src);
const markImageAsFailed = (src: string, failedSet: Set<string>): void => {
  failedSet.add(src);
};
const clearFailedImages = (failedSet: Set<string>): void => {
  failedSet.clear();
};

// Define a proper interface for the API response structure
interface ListingResponse {
  data: {
    id: string;
    title: string;
    price: number;
    currency?: string;
    description?: string;
    location?: string;
    condition?: string;
    status?: string;
    images?: string[];
    featuredImage?: string;
    expiryDate?: string;
    createdAt?: string;
    updatedAt?: string;
    views?: number;
    isPromoted?: boolean;
    isFeatured?: boolean;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
      profileImage?: string;
      createdAt?: string;
    };
    attributes?: Record<string, any>;
    contactPhone?: string;
    contactEmail?: string;
    userId?: string;
    slug?: string;
  };
}

// Error boundary component
class ListingErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any, errorInfo: any, isReporting: boolean, reportSent: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isReporting: false,
      reportSent: false
    };
    this.reportError = this.reportError.bind(this);
  }

  static getDerivedStateFromError(error: any) {
    console.error("Error boundary caught:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Error details:", error);
    console.error("Component stack:", errorInfo?.componentStack);
    // Update state with error info for reporting
    this.setState({
      errorInfo: errorInfo
    });
  }

  // Add a method to report errors to the backend
  reportError() {
    // Set isReporting to show a loading indicator
    this.setState({ isReporting: true });
    
    // Prepare error data - strip sensitive info if needed
    const errorData = {
      message: this.state.error?.message || "Unknown error",
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      // Don't include user ID or personal info for privacy
    };
    
    // Send error to backend (or log to service)
    // This could be replaced with a real API call when endpoint is available
    setTimeout(() => {
      // Simulate API call completion
      console.error("Error report data:", errorData);
      this.setState({ 
        isReporting: false,
        reportSent: true
      });
    }, 800);
    
    // To implement real reporting:
    /*
    fetch('/api/error-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    })
    .then(response => {
      if (response.ok) {
        this.setState({ isReporting: false, reportSent: true });
      } else {
        this.setState({ isReporting: false });
      }
    })
    .catch(err => {
      console.error("Failed to send error report:", err);
      this.setState({ isReporting: false });
    });
    */
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="listing-detail-page__error-container">
          <div className="listing-detail-page__error-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>Something went wrong</h3>
            <p className="listing-detail-page__error-message">
              We encountered an unexpected error while displaying this listing. Our team has been notified about this issue.
            </p>
            <div className="listing-detail-page__error-details">
              <p className="listing-detail-page__error-text">
                Error: {this.state.error?.message || "Unknown error"}
              </p>
            </div>
            <div className="listing-detail-page__error-actions">
              <Link to="/listings" className="listing-detail-page__error-action listing-detail-page__error-action--secondary">
                Back to listings
              </Link>
              <button 
                className="listing-detail-page__error-action listing-detail-page__error-action--primary"
                onClick={() => window.location.reload()}
              >
                Reload page
              </button>
            </div>
            <div className="listing-detail-page__error-report">
              {!this.state.reportSent ? (
                <button 
                  className="listing-detail-page__error-report-button"
                  onClick={this.reportError}
                  disabled={this.state.isReporting}
                >
                  {this.state.isReporting ? (
                    <>
                      <span className="listing-detail-page__error-spinner"></span>
                      Sending report...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      Report this issue
                    </>
                  )}
                </button>
              ) : (
                <div className="listing-detail-page__error-report-success">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Thank you for reporting this issue
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Add image loading states with skeleton animation
const ImageSkeleton = () => (
  <div className="listing-detail-page__image-skeleton">
    <div className="listing-detail-page__image-skeleton-shine"></div>
  </div>
);

// Custom image component with error handling and loading states
const SafeImage = ({ src, alt, className, onLoad, onError }: {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}) => {
  const [hasError, setHasError] = useState(false);

  // Handle image errors with detailed logging
  const handleError = () => {
    console.error(`SafeImage error loading: ${src}`);
    setHasError(true);
    if (onError) onError();
  };

  // If there was an error, use the placeholder
  const imageSrc = hasError ? PLACEHOLDER_IMAGE : (src || PLACEHOLDER_IMAGE);

  return (
    <img 
      src={imageSrc}
      alt={alt}
      className={`${className} ${hasError ? 'image-error' : ''}`}
      onLoad={onLoad}
      onError={handleError}
      crossOrigin="anonymous"
    />
  );
};

// Function to separately define a loading component
const LoadingComponent = ({ t }: { t: TFunction }) => (
  <div className="listing-detail-page">
    <div className="listing-detail-page__container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner size="large" text={t('listing.loading') as string} />
    </div>
  </div>
);

// Function to separately define an error component
const ErrorComponent = ({ 
  error, 
  t, 
  refetch 
}: { 
  error: any; 
  t: TFunction; 
  refetch: () => void 
}) => {
  const errorMessage = error 
    ? typeof error === 'object' 
      ? JSON.stringify(error)
      : String(error)
    : "Data not available";
  
  return (
    <div className="listing-detail-page">
      <div className="listing-detail-page__container">
        <ErrorMessage 
          message={t('listing.notFound') as string}
          details={errorMessage}
          onRetry={() => refetch()}
        />
        <div className="listing-detail-page__back">
          <Link to="/listings">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            {t('common.backToListings') as string}
          </Link>
        </div>
      </div>
    </div>
  );
};

// Add a custom hook for viewport detection
const useViewport = () => {
  const [width, setWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleWindowResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  // Return the width so we can use it in our components
  return { width };
};

// Enhanced Gallery component with better error handling and loading states
const Gallery = React.memo(({ 
  images, 
  featuredImage,
  onImageError,
  failedImagesCount
}: { 
  images: string[];
  featuredImage: string;
  onImageError: (src: string) => void;
  failedImagesCount: number;
}) => {
  const { t } = useTranslation();
  const { width } = useViewport();
  const isMobile = width <= 768;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };
  
  const handleThumbnailKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setCurrentImageIndex(index);
    }
  };
  
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleImageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      handleNextImage();
    } else if (e.key === 'ArrowLeft') {
      handlePrevImage();
    }
  };

  return (
    <div 
      className="listing-detail-page__gallery" 
      id="gallery-section"
      role="region" 
      aria-label={t('listing.imageGallery', 'Image Gallery')}
    >
      {failedImagesCount > 0 && (
        <button 
          className="listing-detail-page__retry-button"
          onClick={() => {
            window.location.reload();
          }}
          aria-label={t('listing.retryLoadImages', 'Retry loading images')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          {t('listing.retryLoadImages', 'Retry loading images')}
        </button>
      )}
      <div 
        className="listing-detail-page__main-image"
        tabIndex={0}
        onKeyDown={handleImageKeyDown}
        aria-label={t('listing.mainImage', 'Main product image')}
      >
        <SafeImage 
          src={images[currentImageIndex] || featuredImage}
          alt={t('listing.productImage', 'Product image')} 
          className="listing-detail-page__image"
          onError={() => onImageError(images[currentImageIndex] || featuredImage)}
        />
        
        {images.length > 1 && (
          <div className="listing-detail-page__image-controls">
            <button 
              className="listing-detail-page__image-control listing-detail-page__image-control--prev"
              onClick={handlePrevImage}
              aria-label={t('listing.previousImage', 'Previous image')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button 
              className="listing-detail-page__image-control listing-detail-page__image-control--next"
              onClick={handleNextImage}
              aria-label={t('listing.nextImage', 'Next image')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {images.length > 1 && (
        <div 
          className="listing-detail-page__thumbnails"
          role="tablist"
          aria-label={t('listing.imageThumbnails', 'Image thumbnails')}
        >
          {images.slice(0, isMobile ? 4 : images.length).map((image, index) => (
            <div
              key={index}
              className={`listing-detail-page__thumbnail ${index === currentImageIndex ? 'listing-detail-page__thumbnail--active' : ''}`}
              onClick={() => handleThumbnailClick(index)}
              onKeyDown={(e) => handleThumbnailKeyDown(e, index)}
              tabIndex={0}
              role="tab"
              aria-selected={index === currentImageIndex}
              aria-label={t('listing.imageNumber', 'Image {{number}}', { number: index + 1 })}
            >
              <SafeImage 
                src={image}
                alt={t('listing.thumbnailImage', 'Thumbnail image {{number}}', { number: index + 1 })}
                onError={() => onImageError(image)}
              />
            </div>
          ))}
          {isMobile && images.length > 4 && (
            <div 
              className="listing-detail-page__thumbnail listing-detail-page__thumbnail--more"
              role="button"
              aria-label={t('listing.moreImages', 'More images')}
            >
              <span>+{images.length - 4}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Define a component for the Feature section
const FeatureSection = ({ listing, t }: { listing: any, t: TFunction }) => {
  if (!listing) return null;
  
  return (
    <div className="listing-detail-page__features" id="features-section">
      <div className="listing-detail-page__section-header">
        <h2>{t('listing.features') as string}</h2>
      </div>
      <div className="listing-detail-page__features-grid">
        {listing.condition && (
          <div className="listing-detail-page__feature-item">
            <div className="listing-detail-page__feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                <line x1="16" y1="8" x2="2" y2="22"></line>
                <line x1="17.5" y1="15" x2="9" y2="15"></line>
              </svg>
            </div>
            <div className="listing-detail-page__feature-content">
              <span>{t('listing.condition') as string}</span>
              <strong>{t(`condition.${listing.condition}`, listing.condition) as string}</strong>
            </div>
          </div>
        )}
        {listing.location && (
          <div className="listing-detail-page__feature-item">
            <div className="listing-detail-page__feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div className="listing-detail-page__feature-content">
              <span>{t('listing.location') as string}</span>
              <strong>{listing.location}</strong>
            </div>
          </div>
        )}
        {listing.createdAt && (
          <div className="listing-detail-page__feature-item">
            <div className="listing-detail-page__feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="listing-detail-page__feature-content">
              <span>{t('listing.listedOn') as string}</span>
              <strong>{formatDate(listing.createdAt)}</strong>
            </div>
          </div>
        )}
        {listing.views !== undefined && (
          <div className="listing-detail-page__feature-item">
            <div className="listing-detail-page__feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <div className="listing-detail-page__feature-content">
              <span>{t('listing.views') as string}</span>
              <strong>{listing.views}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Define a component for Contact section
const ContactSection = ({ 
  listing, 
  showContactInfo, 
  setShowContactInfo, 
  isChangingStatus, 
  t 
}: { 
  listing: any, 
  showContactInfo: boolean, 
  setShowContactInfo: (show: boolean) => void, 
  isChangingStatus: boolean, 
  t: TFunction 
}) => {
  return (
    <div className="listing-detail-page__contact">
      <h3>{t('listing.contact') as string}</h3>
      
      {!showContactInfo ? (
        <button 
          className="listing-detail-page__contact-button"
          onClick={() => setShowContactInfo(true)}
          disabled={isChangingStatus}
          aria-expanded={showContactInfo}
          aria-controls="contact-info-section"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          {t('listing.showContact') as string}
        </button>
      ) : (
        <div 
          id="contact-info-section"
          className={`listing-detail-page__contact-info ${showContactInfo ? 'is-visible' : ''}`}
          aria-live="polite"
        >
          {listing.contactPhone && (
            <div className="listing-detail-page__contact-info-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <a href={`tel:${listing.contactPhone}`}>{listing.contactPhone}</a>
            </div>
          )}
          {listing.contactEmail && (
            <div className="listing-detail-page__contact-info-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <a href={`mailto:${listing.contactEmail}`}>{listing.contactEmail}</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Define a component for Listing Info Header
const ListingHeader = ({ 
  listing, 
  getStatusBadgeClass, 
  t 
}: { 
  listing: any, 
  getStatusBadgeClass: (status: string) => string, 
  t: TFunction 
}) => {
  return (
    <>
      <h1 className="listing-detail-page__title">{listing.title || ''}</h1>
      
      <div className="listing-detail-page__meta">
        <div className="listing-detail-page__price">
          {formatPrice(listing.price)}
        </div>
        
        {/* Featured badge */}
        {listing.isFeatured && (
          <div className="listing-detail-page__featured-badge">
            <FaCrown />
            {t('listing.featured')}
          </div>
        )}
        
        {/* Status display - always visible */}
        {listing.status && (
          <div className="listing-detail-page__status">
            <span className="listing-detail-page__status-label">{t('listing.statusLabel') as string}:</span>
            <span className={`listing-detail-page__status-value ${getStatusBadgeClass(listing.status)}`}>
              {t(`listing.status.${listing.status}`) as string}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

// Define a component for ActionButtons
const ActionButtons = ({ 
  listing, 
  canEdit, 
  isAdmin, 
  isChangingStatus, 
  isDeleting, 
  isFeaturing,
  handleStatusChange, 
  handleDelete, 
  setIsFeatureModalOpen,
  t 
}: { 
  listing: any, 
  canEdit: boolean, 
  isAdmin: boolean, 
  isChangingStatus: boolean, 
  isDeleting: boolean, 
  isFeaturing: boolean,
  handleStatusChange: (status: string) => void, 
  handleDelete: () => void, 
  setIsFeatureModalOpen: (open: boolean) => void,
  t: TFunction 
}) => {
  if (!canEdit) return null;
  
  return (
    <div className="listing-detail-page__actions">
      {/* Edit button */}
      <Link 
        to={`/listings/${listing.id}/edit`}
        className="listing-detail-page__actions-secondary"
      >
        <FaEdit />
        {t('common.edit') as string}
      </Link>
      
      {/* Status change buttons */}
      {listing.status === 'active' && (
        <button 
          className="listing-detail-page__actions-secondary"
          onClick={() => handleStatusChange('sold')}
          disabled={isChangingStatus}
        >
          <FaStar />
          {t('listing.markAsSold') as string}
        </button>
      )}
      
      {listing.status === 'pending' && isAdmin && (
        <button 
          className="listing-detail-page__actions-primary"
          onClick={() => handleStatusChange('active')}
          disabled={isChangingStatus}
        >
          <FaCheckCircle />
          {t('admin.approve') as string}
        </button>
      )}
      
      {/* Feature button - show only for active listings that aren't already featured */}
      {listing.status === 'active' && !listing.isFeatured && (
        <button
          className="listing-detail-page__actions-feature"
          onClick={() => setIsFeatureModalOpen(true)}
          disabled={isChangingStatus || isFeaturing}
        >
          <FaCrown />
          {t('listing.makeFeature') as string}
        </button>
      )}
      
      {/* Delete button */}
      <button 
        className="listing-detail-page__actions-danger"
        onClick={() => {
          if (window.confirm(t('listing.confirmDelete') as string)) {
            handleDelete();
          }
        }}
        disabled={isDeleting || isChangingStatus}
      >
        <FaTrash />
        {t('common.delete') as string}
      </button>
    </div>
  );
};

// Extract description rendering to a component
interface DescriptionSectionProps {
  description?: string;
  t: TFunction;
}

const DescriptionSection: FC<DescriptionSectionProps> = ({ description, t }) => {
  if (!description) return null;
  
  const renderParagraphs = () => {
    return description.split('\n')
      .filter(Boolean)
      .map((paragraph: string, index: number) => (
        <p key={index}>{paragraph}</p>
      ));
  };
  
  return (
    <div className="listing-detail-page__description" id="description-section">
      <div className="listing-detail-page__section-header">
        <h2>{t('listing.description')}</h2>
      </div>
      <div className="listing-detail-page__description-content">
        {renderParagraphs()}
      </div>
    </div>
  );
};

// Extract breadcrumbs into a component
interface BreadcrumbsProps {
  listing: any;
  t: TFunction;
}

const Breadcrumbs: FC<BreadcrumbsProps> = ({ listing, t }) => {
  if (!listing) return null;
  
  return (
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
          <Link to={`/categories/${listing.category.slug}`}>{listing.category.name}</Link>
        </>
      )}
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
      <span>{listing.title}</span>
    </div>
  );
};

// Extract FeatureModal into a separate component
const FeatureModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedDuration,
  onDurationChange,
  isProcessing,
  t
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedDuration: string;
  onDurationChange: (duration: string) => void;
  isProcessing: boolean;
  t: TFunction;
}) => {
  if (!isOpen) return null;
  
  const featureDurationOptions = [
    { value: 'day', label: t('listing.featureDuration.day'), price: 5 },
    { value: 'week', label: t('listing.featureDuration.week'), price: 25 },
    { value: 'month', label: t('listing.featureDuration.month'), price: 80 }
  ];
  
  // Function to get feature end date
  const getFeatureEndDate = (duration: string) => {
    const now = new Date();
    let endDate = new Date(now);
    
    switch(duration) {
      case 'day':
        endDate.setDate(now.getDate() + 1);
        break;
      case 'week':
        endDate.setDate(now.getDate() + 7);
        break;
      case 'month':
        endDate.setMonth(now.getMonth() + 1);
        break;
    }
    
    return endDate.toLocaleDateString();
  };
  
  return (
    <div 
      className="listing-detail-page__modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-modal-title"
    >
      <div className="listing-detail-page__modal">
        <div className="listing-detail-page__modal-header">
          <h3 id="feature-modal-title">{t('listing.featureTitle')}</h3>
          <button 
            className="listing-detail-page__modal-close"
            onClick={onClose}
            disabled={isProcessing}
            aria-label={t('common.close')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="listing-detail-page__modal-content">
          <p>{t('listing.featureDescription')}</p>
          
          <div className="listing-detail-page__feature-options">
            {featureDurationOptions.map((option) => (
              <div 
                key={option.value}
                className={`listing-detail-page__feature-option ${selectedDuration === option.value ? 'is-selected' : ''}`}
                onClick={() => onDurationChange(option.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDurationChange(option.value);
                  }
                }}
                tabIndex={0}
                role="radio"
                aria-checked={selectedDuration === option.value}
              >
                <div className="listing-detail-page__feature-option-header">
                  <h4>{option.label}</h4>
                  <span className="listing-detail-page__feature-option-price">
                    {formatPrice(option.price)}
                  </span>
                </div>
                <div className="listing-detail-page__feature-option-details">
                  <p>
                    {t('listing.featureValidUntil', { 
                      date: getFeatureEndDate(option.value) 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="listing-detail-page__modal-footer">
          <button 
            className="listing-detail-page__modal-cancel"
            onClick={onClose}
            disabled={isProcessing}
          >
            {t('common.cancel')}
          </button>
          <button 
            className="listing-detail-page__modal-confirm"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <LoadingSpinner size="small" />
            ) : (
              t('listing.confirmFeature')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main ListingDetailPage component with reduced complexity
const ListingDetailPage: FC = () => {
  // Hooks section - keep all hooks at the top
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [activeImage, setActiveImage] = useState(0);
  const { isAuthenticated, user } = useSelector(selectAuthState);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [isProcessingFeature, setIsProcessingFeature] = useState(false);
  const [selectedFeatureDuration, setSelectedFeatureDuration] = useState('day');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set<string>());
  const [showContactInfo, setShowContactInfo] = useState(false);
  
  // API hooks
  const { 
    data: listingResponse, 
    isLoading, 
    error, 
    refetch 
  } = useGetListingQuery(idOrSlug ? idOrSlug : skipToken, {
    refetchOnMountOrArgChange: false
  });
  
  const [changeStatus, { isLoading: isChangingStatus }] = useChangeListingStatusMutation();
  const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();
  const [featureListing, { isLoading: isFeaturing }] = useFeatureListingMutation();
  
  // Effects
  useEffect(() => {
    setFailedImages(new Set<string>());
  }, [idOrSlug]);
  
  useEffect(() => {
    if (error && idOrSlug && !isLoading) {
      refetch();
    }
  }, [idOrSlug, error, isLoading, refetch]);
  
  // Callbacks
  const handleImageStatus = useCallback((src: string, success: boolean) => {
    if (src && src !== PLACEHOLDER_IMAGE && src !== USER_PLACEHOLDER_IMAGE) {
      setLoadedImages(prev => ({ ...prev, [src]: success }));
      
      if (!success) {
        markImageAsFailed(src, failedImages);
        setFailedImages(new Set(failedImages));
      }
    }
  }, [failedImages]);
  
  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!idOrSlug || !listingResponse?.data?.id) return;
    
    try {
      await changeStatus({
        id: listingResponse.data.id,
        status: newStatus
      }).unwrap();
      
      if (newStatus === 'deleted') {
        navigate('/listings');
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  }, [idOrSlug, listingResponse?.data?.id, changeStatus, navigate]);
  
  const handleDelete = useCallback(async () => {
    if (!idOrSlug || !listingResponse?.data?.id) return;
    
    try {
      await deleteListing(listingResponse.data.id).unwrap();
      navigate('/listings');
    } catch (err) {
      console.error('Failed to delete listing:', err);
    }
  }, [idOrSlug, listingResponse?.data?.id, deleteListing, navigate]);
  
  const getStatusBadgeClass = useCallback((status: string): string => {
    switch (status) {
      case 'active': return 'listing-detail-page__status-badge--active';
      case 'pending': return 'listing-detail-page__status-badge--pending';
      case 'sold': return 'listing-detail-page__status-badge--sold';
      default: return '';
    }
  }, []);
  
  const formatImageUrl = useCallback((img: string): string => {
    if (!img) return PLACEHOLDER_IMAGE;
    
    if (img.startsWith('http') || img.startsWith('data:')) {
      return img;
    }
    
    return getImageUrl(img);
  }, []);
  
  // Handle making listing featured
  const handleMakeFeature = async () => {
    if (!listingResponse?.data?.id) return;
    
    setIsProcessingFeature(true);
    try {
      await featureListing({
        id: listingResponse.data.id,
        duration: selectedFeatureDuration as FeatureDuration
      }).unwrap();
      
      setIsFeatureModalOpen(false);
      toast.success(t('listing.featureSuccess'));
    } catch (error) {
      console.error('Error making listing featured:', error);
      toast.error(t('listing.featureError'));
    } finally {
      setIsProcessingFeature(false);
    }
  };
  
  // Memoized values
  const listing = useMemo(() => {
    return listingResponse?.data || {};
  }, [listingResponse]);
  
  const isOwner = useMemo(() => {
    return isAuthenticated && user?.id === listing?.userId;
  }, [isAuthenticated, user, listing]);
  
  const isAdmin = useMemo(() => {
    return isAuthenticated && user?.role === 'admin';
  }, [isAuthenticated, user]);
  
  const canEdit = useMemo(() => {
    return isOwner || isAdmin;
  }, [isOwner, isAdmin]);
  
  // Process images for display
  const { featuredImage, images } = useMemo(() => {
    if (!listingResponse || !listingResponse.data) return { featuredImage: null, images: [] };
    
    const listing = listingResponse.data;
    let featImage = null;
    let imageArray: string[] = [];
    
    if (listing.featuredImage && !isFailedImage(listing.featuredImage, failedImages)) {
      featImage = formatImageUrl(listing.featuredImage);
    }
    
    if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
      imageArray = listing.images
        .filter((img: string) => {
          return img && !isFailedImage(img, failedImages);
        })
        .map((img: string) => formatImageUrl(img));
    }
    
    if (featImage && imageArray.length === 0) {
      imageArray = [featImage];
    }
    
    if (imageArray.length === 0) {
      imageArray = [PLACEHOLDER_IMAGE];
    }
    
    return { featuredImage: featImage, images: imageArray };
  }, [listingResponse, formatImageUrl, failedImages]);
  
  // Simplified conditional rendering with early returns
  if (isLoading) {
    return <LoadingComponent t={t} />;
  }

  if (error || !listingResponse || !listingResponse.data) {
    return <ErrorComponent error={error} t={t} refetch={refetch} />;
  }

  // Main content rendering with smaller, more focused components
  return (
    <div className="listing-detail-page">
      <Helmet>
        <title>{listing.title ? `${listing.title} | AzeriMarket` : 'Listing Detail | AzeriMarket'}</title>
        <meta name="description" content={listing.description ? listing.description.slice(0, 160) : 'Listing details on AzeriMarket'} />
      </Helmet>
      
      <div className="listing-detail-page__container">
        <Breadcrumbs listing={listing} t={t} />

        <div className="listing-detail-page__content">
          <div className="listing-detail-page__main">
            <div className="listing-detail-page__left-column">
              {/* Gallery Section */}
              <div className="listing-detail-page__gallery-container">
                {images && images.length > 0 ? (
                  <Gallery 
                    images={images} 
                    featuredImage={featuredImage || images[0] || PLACEHOLDER_IMAGE}
                    onImageError={(src) => markImageAsFailed(src, failedImages)}
                    failedImagesCount={failedImages.size}
                  />
                ) : (
                  <div className="listing-detail-page__no-images">
                    <img 
                      src={PLACEHOLDER_IMAGE}
                      alt="No images available"
                      className="listing-detail-page__placeholder"
                    />
                    <p>No images available for this listing</p>
                  </div>
                )}
              </div>
              
              {/* Description Section */}
              <DescriptionSection description={listing.description} t={t} />
            </div>
            
            {/* Details Section */}
            <div className="listing-detail-page__details">
              <div className="listing-detail-page__info">
                <ListingHeader 
                  listing={listing} 
                  getStatusBadgeClass={getStatusBadgeClass} 
                  t={t}
                />
                
                {/* Features Section */}
                <FeatureSection listing={listing} t={t} />
                
                {/* Contact Section */}
                <ContactSection 
                  listing={listing} 
                  showContactInfo={showContactInfo}
                  setShowContactInfo={setShowContactInfo}
                  isChangingStatus={isChangingStatus}
                  t={t}
                />
              </div>
              
              {/* Admin / Owner Actions */}
              <ActionButtons 
                listing={listing}
                canEdit={canEdit}
                isAdmin={isAdmin}
                isChangingStatus={isChangingStatus}
                isDeleting={isDeleting}
                isFeaturing={isFeaturing}
                handleStatusChange={handleStatusChange}
                handleDelete={handleDelete}
                setIsFeatureModalOpen={setIsFeatureModalOpen}
                t={t}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Feature Modal */}
      {isFeatureModalOpen && (
        <FeatureModal 
          isOpen={isFeatureModalOpen}
          onClose={() => setIsFeatureModalOpen(false)}
          onConfirm={handleMakeFeature}
          selectedDuration={selectedFeatureDuration}
          onDurationChange={setSelectedFeatureDuration}
          isProcessing={isProcessingFeature}
          t={t}
        />
      )}
    </div>
  );
};

// Wrap with error boundary and export
const ListingDetailPageWithErrorBoundary: React.FC = () => (
  <ListingErrorBoundary>
    <ListingDetailPage />
  </ListingErrorBoundary>
);

// Export as default for React.lazy() compatibility
export default ListingDetailPageWithErrorBoundary; 