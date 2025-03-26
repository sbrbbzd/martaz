import React from 'react';
import { TFunction } from 'i18next';
import { formatPrice } from '../../../utils/helpers';
import { FaCrown } from 'react-icons/fa';
import { FaRegHeart, FaHeart } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useAddFavoriteMutation, useCheckFavoriteQuery, useRemoveFavoriteMutation, useGetFavoriteQuery } from '../../../services/api';
import { toast } from 'react-toastify';

interface ListingHeaderProps {
  listing: any;
  getStatusBadgeClass: (status: string) => string;
  t: TFunction;
}

// Define a component for Listing Info Header
const ListingHeader: React.FC<ListingHeaderProps> = ({ 
  listing, 
  getStatusBadgeClass, 
  t 
}) => {
  // Auth state to check if user is logged in
  const { token } = useSelector((state: RootState) => state.auth);
  
  // State for favorite status
  const [isFavorite, setIsFavorite] = React.useState(false);
  
  // API hooks for favorites
  const { data: favoriteStatus } = useCheckFavoriteQuery(
    { itemId: listing.id.toString(), itemType: 'listing' },
    { skip: !token || !listing?.id }
  );
  
  const [addFavorite, { isLoading: isAdding }] = useAddFavoriteMutation();
  const [removeFavorite, { isLoading: isRemoving }] = useRemoveFavoriteMutation();
  const { data: favoriteData, refetch: refetchFavorite } = useGetFavoriteQuery(
    { itemId: listing.id.toString(), itemType: 'listing' },
    { skip: !token || !isFavorite || !listing?.id }
  );
  
  // Update local state when server data is fetched
  React.useEffect(() => {
    if (favoriteStatus) {
      setIsFavorite(favoriteStatus.isFavorite);
    }
  }, [favoriteStatus]);

  // Handle favorite button click
  const handleFavoriteClick = async () => {
    if (!token) {
      toast.info(t('common.loginRequired'));
      return;
    }
    
    const newValue = !isFavorite;
    setIsFavorite(newValue);
    
    try {
      if (newValue) {
        // Add to favorites
        await addFavorite({ itemId: listing.id.toString(), itemType: 'listing' }).unwrap();
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

  return (
    <>
      <div className="listing-detail-page__title-row">
        <h1 className="listing-detail-page__title">{listing.title || ''}</h1>
        
        {/* Favorite button */}
        <button 
          className={`listing-detail-page__favorite-btn ${isFavorite ? 'is-favorite' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
          disabled={isAdding || isRemoving}
        >
          {isFavorite ? <FaHeart /> : <FaRegHeart />}
        </button>
      </div>
      
      <div className="listing-detail-page__meta">
        <div className="listing-detail-page__price">
          {formatPrice(listing.price)}
        </div>
        
        {/* Featured badge */}
        {listing.isPromoted && (
          <div className="listing-detail-page__featured-badge">
            <FaCrown />
            {t('listing.featured')}
          </div>
        )}
        
        {/* Status display - always visible */}
        {listing.status && (
          <div className="listing-detail-page__status">
            <span className="listing-detail-page__status-label">{t('listing.statusLabel')}:</span>
            <span className={`listing-detail-page__status-value ${getStatusBadgeClass(listing.status)}`}>
              {t(`listing.status.${listing.status}`)}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default ListingHeader; 