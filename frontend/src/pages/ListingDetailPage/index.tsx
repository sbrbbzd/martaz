import React, { useState, useEffect, useCallback, useMemo, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import './styles.scss';
import { selectAuthState } from '../../store/slices/authSlice';
import { getImageUrl } from '../../utils/imageUrl';
import { 
  useGetListingQuery,
  useChangeListingStatusMutation,
  useDeleteListingMutation,
  useFeatureListingMutation,
  useApproveListingMutation
} from '../../services/api';
import { skipToken } from '@reduxjs/toolkit/query/react';

// Import components
import {
  Gallery,
  FeatureSection,
  ContactSection,
  ListingHeader,
  ActionButtons,
  DescriptionSection,
  Breadcrumbs,
  FeatureModal,
  ErrorComponent,
  LoadingComponent
} from './components';

// Import types
import { Listing, FeatureDuration } from './types';

// Import error boundary
import ListingErrorBoundary from './ListingErrorBoundary';

// Define constants for placeholder images to avoid typos and ensure consistency
const PLACEHOLDER_IMAGE = getImageUrl('placeholder.jpg');
const USER_PLACEHOLDER_IMAGE = getImageUrl('user-placeholder.jpg');

// Helper function for failed images
const isFailedImage = (src: string, failedSet: Set<string>): boolean => failedSet.has(src);

const ListingDetailPage: FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(selectAuthState);
  
  // State for UI elements
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [selectedFeatureDuration, setSelectedFeatureDuration] = useState<FeatureDuration>('day');
  const [isProcessingFeature, setIsProcessingFeature] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  // RTK Query hooks
  const { 
    data: listingResponse, 
    error, 
    isLoading, 
    refetch 
  } = useGetListingQuery(idOrSlug ?? skipToken);
  
  const [
    changeStatus, 
    { isLoading: isChangingStatus }
  ] = useChangeListingStatusMutation();
  
  const [
    deleteListing, 
    { isLoading: isDeleting }
  ] = useDeleteListingMutation();
  
  const [
    featureListing, 
    { isLoading: isFeaturing }
  ] = useFeatureListingMutation();

  // Add approve listing mutation
  const [approveListing, { isLoading: isApproving }] = useApproveListingMutation();

  // Derived state
  const listing = listingResponse?.data as Listing;
  const isOwner = isAuthenticated && user?.id === listing?.userId;
  const isAdmin = isAuthenticated && user?.role === 'admin';
  const canEdit = isOwner || isAdmin;
  
  // Mark image as failed for fallback handling
  const markImageAsFailed = useCallback((src: string, failedSet: Set<string>) => {
    const newSet = new Set(failedSet);
    newSet.add(src);
    setFailedImages(newSet);
  }, []);
  
  useEffect(() => {
    // Reset state when listing changes
    setShowContactInfo(false);
    setFailedImages(new Set());
  }, [idOrSlug]);
  
  // Handle view counting
  useEffect(() => {
    if (listing && listing.id) {
      // Analytics or view tracking logic would go here
      console.log('Viewing listing:', listing.id);
    }
  }, [listing]);
  
  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!idOrSlug || !listingResponse?.data?.id) return;
    
    try {
      // If admin is approving a pending listing, use the dedicated approve endpoint
      if (isAdmin && listing.status === 'pending' && newStatus === 'active') {
        await approveListing(listingResponse.data.id).unwrap();
        // Refetch to get the updated listing
        refetch();
        // Show success message
        toast.success(t('admin.listings.approveSuccess', 'Listing approved successfully'));
        return;
      }
      
      // Otherwise use the regular status change endpoint
      const result = await changeStatus({
        id: listingResponse.data.id,
        status: newStatus
      }).unwrap();
      
      // Refetch to get the updated listing after status change
      refetch();
      
      // Show appropriate success message based on the new status
      if (newStatus === 'sold') {
        toast.success(t('listing.markAsSoldSuccess', 'Listing marked as sold successfully'));
      } else if (newStatus === 'active') {
        toast.success(t('listing.activateSuccess', 'Listing activated successfully'));
      } else if (newStatus === 'inactive') {
        toast.success(t('listing.deactivateSuccess', 'Listing deactivated successfully'));
      }
      
      if (newStatus === 'deleted') {
        toast.success(t('listing.deleteSuccess', 'Listing deleted successfully'));
        navigate('/listings');
      }
    } catch (err) {
      console.error('Failed to change status:', err);
      toast.error(t('listing.statusChangeFailed', 'Failed to change listing status'));
    }
  }, [idOrSlug, listingResponse?.data?.id, changeStatus, navigate, isAdmin, listing?.status, approveListing, refetch, t]);
  
  const handleDelete = useCallback(async () => {
    if (!idOrSlug || !listingResponse?.data?.id) return;
    
    try {
      await deleteListing(listingResponse.data.id).unwrap();
      toast.success(t('listing.deleteSuccess', 'Listing deleted successfully'));
      navigate('/listings');
    } catch (err) {
      console.error('Failed to delete listing:', err);
      toast.error(t('listing.deleteFailed', 'Failed to delete listing'));
    }
  }, [idOrSlug, listingResponse?.data?.id, deleteListing, navigate, t]);
  
  const getStatusBadgeClass = useCallback((status: string): string => {
    switch (status) {
      case 'active': return 'listing-detail-page__status-badge--active';
      case 'pending': return 'listing-detail-page__status-badge--pending';
      case 'sold': return 'listing-detail-page__status-badge--sold';
      default: return '';
    }
  }, []);
  
  const formatImageUrl = useCallback((img: string): string => {
    if (!img) {
      console.warn('Empty image path in ListingDetailPage, using placeholder');
      return PLACEHOLDER_IMAGE;
    }
    
    console.log('ListingDetailPage formatting image URL:', { original: img });
    
    // Handle direct database paths
    if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('blob:')) {
      console.log('ListingDetailPage using absolute URL directly:', img);
      return img;
    }
    
    // Direct handling for API image paths to avoid Vite port issues
    if (img.startsWith('/api/images/')) {
      const imageServerUrl = import.meta.env.VITE_IMAGE_SERVER_URL || 'http://localhost:3001/api/images';
      const filename = img.substring('/api/images/'.length);
      const result = `${imageServerUrl}/${filename}`;
      console.log('ListingDetailPage fixed API image path:', { original: img, result });
      return result;
    }
    
    // Handle filename-only paths (no slashes or protocol)
    if (!img.includes('/') && !img.startsWith('http')) {
      const imageServerUrl = import.meta.env.VITE_IMAGE_SERVER_URL || 'http://localhost:3001/api/images';
      console.log('ListingDetailPage processing filename-only path:', { original: img, result: `${imageServerUrl}/${img}` });
      return `${imageServerUrl}/${img}`;
    }
    
    // Use getImageUrl to handle proper path transformation
    const formattedUrl = getImageUrl(img);
    console.log('ListingDetailPage image transformed:', { 
      original: img, 
      formatted: formattedUrl 
    });
    
    return formattedUrl;
  }, []);

  // Handle making a listing featured
  const handleMakeFeature = useCallback(async () => {
    if (!listingResponse?.data?.id) return;
    
    setIsProcessingFeature(true);
    
    try {
      await featureListing({
        id: listingResponse.data.id,
        duration: selectedFeatureDuration
      }).unwrap();
      
      toast.success(t('listing.featureSuccess', 'Listing promoted successfully'));
      refetch();
      setIsFeatureModalOpen(false);
    } catch (err) {
      console.error('Failed to feature listing:', err);
      toast.error(t('listing.featureFailed', 'Failed to promote listing'));
    } finally {
      setIsProcessingFeature(false);
    }
  }, [featureListing, listingResponse?.data?.id, selectedFeatureDuration, refetch, t]);
  
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
                isChangingStatus={isChangingStatus || isApproving}
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

export default ListingDetailPageWithErrorBoundary; 