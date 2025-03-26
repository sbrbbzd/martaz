import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import ImageComponent from '../common/ImageComponent';
import './ListingCard.scss';
import { getImageUrl, markImageAsFailed, isFailedImage } from '../../utils/helpers';
import { FaRegHeart, FaHeart } from 'react-icons/fa6';
import { clearFailedImageCache } from '../../utils/helpers';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAddFavoriteMutation, useCheckFavoriteQuery, useRemoveFavoriteMutation, useGetFavoriteQuery } from '../../services/api';
import { toast } from 'react-toastify';

// Placeholder image from helpers
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
  isPromoted?: boolean;
  isNew?: boolean;
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
  isPromoted = false,
  isNew = false,
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
  const [imageToUse, setImageToUse] = useState<string | null>(null);
  
  // Auth state to check if user is logged in
  const { token } = useSelector((state: RootState) => state.auth);
  
  // API hooks for favorites
  const { data: favoriteStatus } = useCheckFavoriteQuery(
    { itemId: id.toString(), itemType: 'listing' },
    { skip: !token }
  );
  const [addFavorite, { isLoading: isAdding }] = useAddFavoriteMutation();
  const [removeFavorite, { isLoading: isRemoving }] = useRemoveFavoriteMutation();
  const { data: favoriteData, refetch: refetchFavorite } = useGetFavoriteQuery(
    { itemId: id.toString(), itemType: 'listing' },
    { skip: !token || !isFavorite }
  );
  
  // Update local state when server data is fetched
  useEffect(() => {
    if (favoriteStatus) {
      setIsFavorite(favoriteStatus.isFavorite);
    }
  }, [favoriteStatus]);

  // Handle image loading error
  const handleImageError = () => {
    console.error(`Image failed to load for ${title}:`, currentImageUrl);
    setImageLoaded(false);
    
    if (imageToUse) {
      markImageAsFailed(imageToUse);
    } else if (featuredImage) {
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
      if (!isMounted) return;

      console.log(`Processing image for ${title}:`, { 
        featuredImage,
        hasImage: !!featuredImage,
        imagesArray: images
      });
      
      // Try to use featuredImage first, otherwise use the first image from images array if available
      let imgToUse = featuredImage;
      
      // Clean featuredImage if it's in curly braces
      if (imgToUse && typeof imgToUse === 'string' && imgToUse.includes('{') && imgToUse.includes('}')) {
        imgToUse = imgToUse.replace(/[{}]/g, '');
        console.log(`Cleaned curly braces from featuredImage: ${imgToUse}`);
      }
      
      // If no featuredImage, but we have images array, use the first valid image
      if ((!imgToUse || imgToUse === 'placeholder.jpg') && images && images.length > 0) {
        console.log(`No featuredImage for ${title}, trying first image from array:`, images);
        
        // Find the first non-empty image that isn't already known to fail
        const validImage = images.find(img => {
          if (!img) return false;
          
          // Clean the image path if it has quotes or curly braces
          let cleanedImg = img;
          if (typeof cleanedImg === 'string') {
            if (cleanedImg.includes("'") || cleanedImg.includes('"')) {
              cleanedImg = cleanedImg.replace(/['"]/g, '');
            }
            if (cleanedImg.includes('{') && cleanedImg.includes('}')) {
              cleanedImg = cleanedImg.replace(/[{}]/g, '');
            }
            
            return cleanedImg && cleanedImg !== 'placeholder.jpg' && !isFailedImage(cleanedImg);
          }
          return false;
        });
        
        if (validImage) {
          let cleanedValidImage = validImage;
          
          // Clean the path if needed
          if (typeof validImage === 'string') {
            if (validImage.includes("'") || validImage.includes('"')) {
              cleanedValidImage = validImage.replace(/['"]/g, '');
            }
            if (validImage.includes('{') && validImage.includes('}')) {
              cleanedValidImage = validImage.replace(/[{}]/g, '');
            }
          }
          
          imgToUse = cleanedValidImage;
          if (isMounted) {
            setImageToUse(cleanedValidImage);
          }
          console.log(`Found valid image in array for ${title}:`, cleanedValidImage);
        }
      } else if (imgToUse && imgToUse !== 'placeholder.jpg') {
        if (isMounted) {
          setImageToUse(imgToUse);
          // Log the generated URL for debugging
          const generatedUrl = getImageUrl(imgToUse);
          console.log(`Generated URL for ${title}: ${generatedUrl} from source: ${imgToUse}`);
        }
      } else {
        console.log(`Using placeholder for ${title} - No valid image found`);
        if (isMounted) {
          setImageToUse(placeholderImage);
        }
      }
    };
    
    // Start loading the image
    loadImage();
    
    // Clean up on component unmount
    return () => {
      isMounted = false;
    };
  }, [featuredImage, title, images]);

  // Handle favorite button click
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!token) {
      toast.info(t('common.loginRequired'));
      return;
    }
    
    const newValue = !isFavorite;
    setIsFavorite(newValue);
    
    try {
      if (newValue) {
        // Add to favorites
        await addFavorite({ itemId: id.toString(), itemType: 'listing' }).unwrap();
        toast.success(t('common.addedToFavorites', 'Added to favorites'));
      } else {
        // Remove from favorites - first get the ID of the favorite
        if (!favoriteData) {
          await refetchFavorite();
        }
        
        if (favoriteData?.id) {
          await removeFavorite(favoriteData.id).unwrap();
          toast.success(t('common.removedFromFavorites', 'Removed from favorites'));
        }
      }
    } catch (error) {
      // Revert on error
      setIsFavorite(!newValue);
      console.error('Favorite operation failed:', error);
      toast.error(t('common.favoritesError', 'Failed to update favorites'));
    }
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
          <div className="listing-card__image-container">
            <Link to={listingUrl} className="listing-card__image-link" target="_blank" rel="noopener noreferrer">
              <ImageComponent 
                src={imageToUse || featuredImage}
                alt={title} 
                className="listing-card__image"
                fallbackImage={placeholderImage}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  const target = e.currentTarget;
                  console.error('Image failed to load for ' + title + ':', target.src);
                  
                  if (imageToUse) {
                    markImageAsFailed(imageToUse);
                  } else if (featuredImage) {
                    markImageAsFailed(featuredImage);
                  }
                  setImageLoaded(false);
                }}
              />
            </Link>
          </div>
          
          {!imageLoaded && (
            <div className="listing-card__skeleton"></div>
          )}
          
          <div className="listing-card__badges">
            {isPromoted && <Badge variant="secondary" size="sm" rounded>{t('listing.featured')}</Badge>}
            {isNew && <Badge variant="accent" size="sm" rounded>{t('listing.new')}</Badge>}
            {condition && <Badge variant="primary" size="sm" rounded>{t(`condition.${condition}`)}</Badge>}
          </div>
          
          <button 
            className={`listing-card__favorite ${isFavorite ? 'listing-card__favorite--active' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
            disabled={isAdding || isRemoving}
          >
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>
        
        <Link to={listingUrl} className="listing-card__content-link" target="_blank" rel="noopener noreferrer">
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
              {t('common.viewDetails')}
            </Button>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
};

export default ListingCard; 