import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FiHeart, 
  FiFilter, 
  FiSearch, 
  FiMapPin, 
  FiAlertCircle, 
  FiRefreshCw,
  FiShoppingBag 
} from 'react-icons/fi';
import { getImageUrl, markImageAsFailed, isFailedImage } from '../../../utils/helpers';
import { useGetFavoritesQuery, useRemoveFavoriteMutation } from '../../../services/api';
import FavoritesFilters from './FavoritesFilters';

// Define sort parameter mapping between UI and API
const SORT_MAPPING = {
  'newest': 'created_at:desc',
  'oldest': 'created_at:asc',
  'price_asc': 'price:asc',
  'price_desc': 'price:desc',
  'title_asc': 'title:asc',
  'title_desc': 'title:desc'
};

// Define constants
const PLACEHOLDER_IMAGE = getImageUrl('placeholder.jpg');

const FavoritesTab: React.FC = () => {
  const { t } = useTranslation();
  const [sortValue, setSortValue] = useState<string>('newest');
  const [isRemovingFavorite, setIsRemovingFavorite] = useState<Record<string, boolean>>({});
  
  // Use our mapping to convert UI sort to API sort format
  const apiSortValue = SORT_MAPPING[sortValue as keyof typeof SORT_MAPPING] || 'created_at:desc';
  
  const [favoritesParams, setFavoritesParams] = useState({
    page: 1,
    limit: 12,
    sort: apiSortValue
  });

  const { 
    data: favoritesData, 
    isLoading, 
    isError,
    refetch
  } = useGetFavoritesQuery(favoritesParams);
  
  const [removeFavorite] = useRemoveFavoriteMutation();

  const handleSortChange = (value: string) => {
    setSortValue(value);
    setFavoritesParams({
      ...favoritesParams,
      sort: SORT_MAPPING[value as keyof typeof SORT_MAPPING] || 'created_at:desc'
    });
  };

  const handleRemoveFavorite = async (id: string) => {
    // Prevent multiple clicks
    if (isRemovingFavorite[id]) return;
    
    try {
      setIsRemovingFavorite((prev) => ({ ...prev, [id]: true }));
      await removeFavorite(id).unwrap();
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    } finally {
      setIsRemovingFavorite((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="favorites-tab">
        <div className="favorites-tab__header">
          <h2>{t('favorites.title')}</h2>
        </div>
        <div className="favorites-tab__loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="favorites-tab">
        <div className="favorites-tab__header">
          <h2>{t('favorites.title')}</h2>
        </div>
        <div className="favorites-tab__error">
          <FiAlertCircle className="error-icon" />
          <h3>{t('common.error')}</h3>
          <p>{t('favorites.loadError')}</p>
          <button onClick={() => refetch()}>
            <FiRefreshCw /> {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  const favorites = favoritesData?.data?.listings || [];
  const totalFavorites = favoritesData?.data?.total || 0;

  // Empty state
  if (!favorites.length) {
    return (
      <div className="favorites-tab">
        <div className="favorites-tab__header">
          <h2>{t('favorites.title')}</h2>
        </div>
        <div className="favorites-tab__empty">
          <FiHeart className="empty-icon" />
          <h3>{t('favorites.emptyTitle')}</h3>
          <p>{t('favorites.emptyDescription')}</p>
          <Link to="/" className="browse-link">
            <FiShoppingBag /> {t('favorites.browseCta')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-tab">
      <div className="favorites-tab__header">
        <h2>{t('favorites.title')}</h2>
      </div>

      {favorites.length > 0 && (
        <div className="favorites-tab__filters">
          <FiFilter className="filter-icon" />
          <FavoritesFilters 
            value={sortValue}
            onChange={handleSortChange}
          />
        </div>
      )}

      <div className="favorites-tab__grid">
        {favorites.map((favorite) => {
          // Use the helper functions to get image URLs
          let imageUrl;
          
          if (favorite.featuredImage) {
            imageUrl = getImageUrl(favorite.featuredImage);
          } else if (favorite.images && Array.isArray(favorite.images) && favorite.images.length > 0) {
            // Find the first non-failed image
            const validImage = favorite.images.find(img => !isFailedImage(img));
            imageUrl = validImage ? getImageUrl(validImage) : PLACEHOLDER_IMAGE;
          } else {
            imageUrl = PLACEHOLDER_IMAGE;
          }
          
          return (
            <div key={favorite.id} className="favorites-tab__item">
              <div className="item-image">
                <img 
                  src={imageUrl}
                  alt={favorite.title}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.log('Image failed to load:', imageUrl);
                    
                    // Mark as failed image
                    if (favorite.featuredImage) {
                      markImageAsFailed(favorite.featuredImage);
                    }
                    
                    // Try to use first image from array if featured image failed
                    if (favorite.images && Array.isArray(favorite.images) && favorite.images.length > 0) {
                      const nextImage = favorite.images.find(img => !isFailedImage(img));
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
              {favorite.isPromoted && (
                <span className="item-badge">{t('listing.promoted')}</span>
              )}
              <button 
                className="favorite-btn"
                onClick={() => handleRemoveFavorite(favorite.id)}
                disabled={isRemovingFavorite[favorite.id]}
              >
                <FiHeart style={{ fill: '#f97316' }} />
              </button>
              <div className="item-content">
                <h3 className="item-title">{favorite.title}</h3>
                {favorite.location && (
                  <div className="item-location">
                    <FiMapPin /> {favorite.location}
                  </div>
                )}
                <div className="item-price">
                  <div>
                    {favorite.price} <span className="currency">{favorite.currency}</span>
                  </div>
                  <Link to={`/listings/${favorite.slug}`} className="view-details">
                    {t('common.viewDetails')}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add pagination here if needed */}
    </div>
  );
};

export default FavoritesTab; 