import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ImageComponent from '../../../components/common/ImageComponent';
import useViewport from '../../../hooks/useViewport';

interface GalleryProps { 
  images: string[];
  featuredImage: string;
  onImageError: (src: string) => void;
  failedImagesCount: number;
}

// Enhanced Gallery component with better error handling and loading states
const Gallery: React.FC<GalleryProps> = ({ 
  images, 
  featuredImage,
  onImageError,
  failedImagesCount
}) => {
  const { t } = useTranslation();
  const { width } = useViewport();
  const isMobile = width <= 768;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Debug image paths
  useEffect(() => {
    console.log('Gallery received images:', images);
    console.log('Gallery featured image:', featuredImage);
  }, [images, featuredImage]);
  
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
        <div className="image-container">
          <ImageComponent 
            src={images[currentImageIndex] || featuredImage}
            alt={t('listing.productImage', 'Product image')} 
            className="listing-detail-page__image"
            width="100%"
            height="100%"
            onError={() => {
              console.log('Image error in Gallery:', images[currentImageIndex] || featuredImage);
              onImageError(images[currentImageIndex] || featuredImage);
            }}
          />
        </div>
        
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
              <ImageComponent 
                src={image}
                alt={t('listing.thumbnailImage', 'Thumbnail image {{number}}', { number: index + 1 })}
                onError={() => {
                  console.log('Thumbnail error in Gallery:', image);
                  onImageError(image);
                }}
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
};

export default React.memo(Gallery); 