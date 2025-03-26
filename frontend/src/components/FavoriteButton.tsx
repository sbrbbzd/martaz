import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import './FavoriteButton.scss';
import { useAddFavoriteMutation, useCheckFavoriteQuery, useRemoveFavoriteMutation, useGetFavoriteQuery } from '../services/api';
import { toast } from 'react-toastify';
import { RootState } from '../store';

interface FavoriteButtonProps {
  itemId: string;
  itemType: 'product' | 'listing';
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ itemId, itemType, className = '' }) => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [isFavorited, setIsFavorited] = useState(false);
  
  // Server-side favorites state
  const { data: favoriteStatus, isLoading: isCheckingFavorite } = useCheckFavoriteQuery(
    { itemId, itemType },
    { skip: !token }
  );
  const [addFavorite, { isLoading: isAdding }] = useAddFavoriteMutation();
  const [removeFavorite, { isLoading: isRemoving }] = useRemoveFavoriteMutation();
  const { refetch: getFavorite } = useGetFavoriteQuery(
    { itemId, itemType },
    { skip: true } // Skip initial fetch, we'll call it manually when needed
  );
  
  const isLoading = isCheckingFavorite || isAdding || isRemoving;
  
  // Sync server state with local state when data is fetched
  useEffect(() => {
    if (favoriteStatus) {
      setIsFavorited(favoriteStatus.isFavorite);
    }
  }, [favoriteStatus]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!token) {
      toast.info('Please login to add items to favorites');
      return;
    }
    
    // Update local state first for immediate feedback
    const newValue = !isFavorited;
    setIsFavorited(newValue);
    
    try {
      if (newValue) {
        await addFavorite({ itemId, itemType }).unwrap();
        toast.success('Added to favorites');
      } else {
        // First get the favorite ID
        const result = await getFavorite().unwrap();
        if (result && result.id) {
          await removeFavorite(result.id).unwrap();
          toast.success('Removed from favorites');
        } else {
          throw new Error('Favorite not found');
        }
      }
    } catch (error) {
      // Revert on error
      setIsFavorited(!newValue);
      toast.error('Failed to update favorites');
      console.error('Favorite operation failed:', error);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      className={`favorite-button ${className} ${isLoading ? 'is-loading' : ''}`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      disabled={isLoading}
    >
      {isFavorited ? (
        <HeartFill className="text-danger" />
      ) : (
        <Heart className="text-danger" />
      )}
    </button>
  );
};

export default FavoriteButton; 