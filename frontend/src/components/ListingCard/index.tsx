import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import './ListingCard.scss';
import { getImageUrl } from '../../utils/imageUrl';
import { FaRegHeart, FaHeart } from 'react-icons/fa6';
import { markImageAsFailed, isFailedImage, clearFailedImageCache } from '../../utils/helpers';

// Placeholder image
const placeholderImage = getImageUrl('placeholder.jpg');

interface ListingCardProps {
  id: string | number;
  title: string;
  price: number;
  currency?: string;
  location: string;
  featuredImage?: string;
  images?: string[];
  category?: string;
  categoryName?: string;
  categorySlug?: string;
  slug?: string;
  condition?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isPromoted?: boolean;
  createdAt?: string;
  className?: string;
  userName?: string;
  userImage?: string;
  onClick?: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  currency = '₼',
  location,
  featuredImage,
  images,
  category,
  categoryName,
  categorySlug,
  slug,
  condition,
  isFeatured = false,
  isNew = false,
  isPromoted = false,
  createdAt,
  className = '',
  userName,
  userImage,
  onClick,
}) => {
  const { t } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(placeholderImage);
  
  // Handle image loading error
  const handleImageError = () => {
    console.error(`Image failed to load for ${title}:`, currentImageUrl);
    setImageLoaded(false);
    
    if (featuredImage) {
      markImageAsFailed(featuredImage);
    }
    
    // Set to placeholder when image fails
    setCurrentImageUrl(placeholderImage);
    
    // Show the reload notification banner if not already shown
    try {
      // Trigger a storage event to notify the App component
      localStorage.setItem('hasFailedImages', 'true');
      // Manually dispatch storage event for current window
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to update local storage:', e);
    }
  };

  // Set up image URL on component mount or when featuredImage changes
  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      console.log(`Processing image for ${title}:`, { 
        featuredImage,
        hasImage: !!featuredImage
      });
      
      // If there's no featured image or it's failed, use placeholder
      if (!featuredImage || isFailedImage(featuredImage)) {
        console.log(`Using placeholder for ${title} - No valid image`);
        if (isMounted) {
          setCurrentImageUrl(placeholderImage);
        }
        return;
      }
      
      // Use the utility to get the correct image URL
      const url = getImageUrl(featuredImage);
      console.log(`Generated URL for ${title}:`, url);
      
      // Create a promise to load the image
      try {
        const imgPromise = new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          
          img.onload = () => {
            console.log(`Image loaded successfully for ${title}`);
            resolve(url);
          };
          
          img.onerror = () => {
            console.error(`Image failed to load for ${title}:`, url);
            reject(new Error(`Failed to load image for ${title}`));
          };
          
          // Set src after adding event handlers
          img.src = url;
          
          // Set a timeout to reject the promise after 5 seconds
          setTimeout(() => {
            reject(new Error(`Timeout loading image for ${title}`));
          }, 5000);
        });
        
        // Try to load the image with a timeout
        const imageUrl = await imgPromise as string;
        
        // Only update state if component is still mounted
        if (isMounted) {
          setCurrentImageUrl(imageUrl);
          setImageLoaded(true);
        }
      } catch (error) {
        // Image failed to load
        console.error(`Image load error for ${title}:`, error);
        
        // Only update state if component is still mounted
        if (isMounted && featuredImage) {
          markImageAsFailed(featuredImage);
          setCurrentImageUrl(placeholderImage);
        }
      }
    };
    
    // Start loading the image
    loadImage();
    
    // Clean up on component unmount
    return () => {
      isMounted = false;
    };
  }, [featuredImage, title]);

  // Handle favorite button click
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  // Handle card click event
  const handleCardClick = () => {
    if (onClick) onClick();
  };

  // Generate URL for the listing
  const listingUrl = slug ? `/listings/${slug}` : `/listings/${id}`;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className={className}
    >
      <Card variant="default" padding="none" radius="lg" className="listing-card">
        <div className="listing-card__header">
          <div className="listing-card__image">
            <Link to={listingUrl}>
              <img 
                className={`listing-card__image ${imageLoaded ? 'loaded' : ''}`}
                src={currentImageUrl}
                alt={title} 
                loading="lazy" 
                crossOrigin="anonymous"
                onError={handleImageError}
                onLoad={() => setImageLoaded(true)}
              />
            </Link>
          </div>
          
          {!imageLoaded && (
            <div className="listing-card__skeleton"></div>
          )}
          
          <div className="listing-card__badges">
            {isFeatured && <Badge variant="secondary" size="sm" rounded>{t('featured')}</Badge>}
            {isPromoted && <Badge variant="secondary" size="sm" rounded>{t('promoted')}</Badge>}
            {isNew && <Badge variant="accent" size="sm" rounded>{t('new')}</Badge>}
            {condition && <Badge variant="primary" size="sm" rounded>{t(`condition.${condition}`)}</Badge>}
          </div>
          
          <button 
            className={`listing-card__favorite ${isFavorite ? 'listing-card__favorite--active' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
          >
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>
        
        <Link to={listingUrl} className="listing-card__content-link">
          <div className="listing-card__content">
            {(category || categoryName) && (
              <div className="listing-card__category">
                {categoryName || category}
              </div>
            )}
            
            <h3 className="listing-card__title">{title}</h3>
            
            <div className="listing-card__meta">
              <div className="listing-card__location">{location}</div>
            </div>
            
            {userName && (
              <div className="listing-card__user">
                <span className="listing-card__user-name">{userName}</span>
              </div>
            )}
          </div>
          
          <div className="listing-card__footer">
            <div className="listing-card__price">
              {currency === 'AZN' ? '₼' : currency} {price.toLocaleString()}
            </div>
            
            <Button 
              variant="text" 
              size="sm" 
            >
              {t('viewDetails')}
            </Button>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
};

export default ListingCard; 