import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { AppDispatch } from '../../store/types';
import { updateProfile, updateProfileImage, selectAuthUser, selectAuthLoading } from '../../store/slices/authSlice';
import { FiCamera, FiEdit, FiTrash2, FiPlus, FiMapPin, FiEye, FiHeart, FiAlertCircle } from 'react-icons/fi';
import { useGetMyListingsQuery, useDeleteListingMutation, Listing, useGetListingsQuery, useToggleFavoriteMutation } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Define User interface to match what comes from the auth slice
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  profileImage?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  username?: string;
}

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser) as User;
  const loading = useSelector(selectAuthLoading);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'listings' | 'favorites'>('profile');
  
  // Profile form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profileImage: user?.profileImage || ''
  });
  
  // Listings query params
  const [listingsParams, setListingsParams] = useState({
    page: 1,
    limit: 10,
    status: 'all'
  });
  
  // Status filter options
  const statusOptions = [
    { value: 'all', label: t('profile.filters.all') },
    { value: 'active', label: t('profile.filters.active') },
    { value: 'pending', label: t('profile.filters.pending') },
    { value: 'sold', label: t('profile.filters.sold') }
  ];
  
  // Favorites query params
  const [favoritesParams, setFavoritesParams] = useState({
    page: 1,
    limit: 10
  });
  
  // API queries
  const { 
    data: listingsData, 
    isLoading: listingsLoading,
    refetch: refetchListings
  } = useGetMyListingsQuery(listingsParams, {
    skip: activeTab !== 'listings' || !user
  });
  
  const { 
    data: favoritesData, 
    isLoading: favoritesLoading 
  } = useGetListingsQuery({
    ...favoritesParams,
    favorites: true
  }, {
    skip: activeTab !== 'favorites' || !user
  });
  
  // Mutations
  const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();
  const [toggleFavorite, { isLoading: isTogglingFavorite }] = useToggleFavoriteMutation();
  
  // Profile image upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Add an error state variable
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Update form data when user changes
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      profileImage: user.profileImage || ''
    });
    
  }, [user, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await dispatch(updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      })).unwrap();
      
      if (selectedImage) {
        const formData = new FormData();
        formData.append('profileImage', selectedImage);
        
        await dispatch(updateProfileImage(formData)).unwrap();
        setSelectedImage(null);
        setImagePreview(null);
      }
      
      toast.success(t('profile.profileUpdated'));
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
      toast.error(err.message || t('common.errorOccurred'));
    }
  };
  
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };
  
  const compressProfileImage = async (file: File, maxSizeMB: number = 0.5): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target || !event.target.result) {
          reject(new Error('File read failed'));
          return;
        }
        
        img.onload = () => {
          // Calculate dimensions to maintain aspect ratio
          let width = img.width;
          let height = img.height;
          
          // Set maximum dimensions for profile image (smaller than regular images)
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
          
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw the image on the canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Start with high quality
          let quality = 0.8; // Lower starting quality for profile images
          
          // Function to get blob from canvas
          const getBlob = (q: number): Promise<Blob> => {
            return new Promise((resolve) => {
              canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else resolve(new Blob([new Uint8Array(0)], { type: file.type }));
              }, 'image/jpeg', q); // Always convert to JPEG for profile
            });
          };
          
          // Try to compress
          const tryCompress = async () => {
            try {
              // Use a loop instead of recursion to prevent stack overflow
              while (true) {
                const compressedBlob = await getBlob(quality);
                
                if (compressedBlob.size > maxSizeMB * 1024 * 1024 && quality > 0.2) {
                  quality -= 0.1;
                  continue;
                } else {
                  resolve(compressedBlob);
                  break;
                }
              }
            } catch (err) {
              reject(err);
            }
          };
          
          tryCompress();
        };
        
        img.src = event.target.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsDataURL(file);
    });
  };
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Size validation
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error(t('profile.imageTooLarge'));
        return;
      }
      
      // Type validation
      if (!file.type.startsWith('image/')) {
        toast.error(t('profile.invalidImageType'));
        return;
      }
      
      // Create preview
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      
      try {
        // Compress the image first
        const compressedBlob = await compressProfileImage(file, 0.5);
        console.log(`Original size: ${file.size / 1024}KB, Compressed size: ${compressedBlob.size / 1024}KB`);
        
        // Convert compressed image to base64
        const base64 = await convertToBase64(new File([compressedBlob], file.name, { type: 'image/jpeg' }));
        const base64Data = base64.split(',')[1]; // Remove data:image/xxx;base64, prefix
        
        // Create form data with base64 string
        const formData = new FormData();
        formData.append('imageData', base64Data);
        formData.append('mimeType', 'image/jpeg');
        formData.append('fileName', file.name);
        
        // Update profile image
        dispatch(updateProfileImage(formData));
      } catch (error) {
        console.error('Error uploading profile image:', error);
        toast.error(t('profile.imageUploadError'));
      }
    }
  };
  
  const handleDeleteListing = async (id: string) => {
    if (window.confirm(t('profile.confirmDeleteListing'))) {
      try {
        await deleteListing(id).unwrap();
        toast.success(t('profile.listingDeleted'));
        refetchListings();
      } catch (err: any) {
        console.error('Failed to delete listing:', err);
        toast.error(err.message || t('common.errorOccurred'));
      }
    }
  };
  
  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id).unwrap();
      toast.success(t('profile.favoriteRemoved'));
    } catch (err: any) {
      console.error('Failed to toggle favorite:', err);
      toast.error(err.message || t('common.errorOccurred'));
    }
  };
  
  const handleLoadMore = () => {
    if (activeTab === 'listings') {
      setListingsParams(prev => ({
        ...prev,
        page: prev.page + 1
      }));
    } else if (activeTab === 'favorites') {
      setFavoritesParams(prev => ({
        ...prev,
        page: prev.page + 1
      }));
    }
  };
  
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };
  
  const handleStatusChange = (status: string) => {
    setListingsParams(prev => ({
      ...prev,
      page: 1,
      status
    }));
  };

  return (
    <div className="container">
      <Helmet>
        <title>{t('profile.pageTitle')} | Mart.az</title>
        <meta name="description" content={t('profile.metaDescription')} />
      </Helmet>
      
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-tabs">
            <div 
              className={`profile-tabs__item ${activeTab === 'profile' ? 'profile-tabs__item--active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              {t('profile.tabs.profile')}
            </div>
            <div 
              className={`profile-tabs__item ${activeTab === 'listings' ? 'profile-tabs__item--active' : ''}`}
              onClick={() => setActiveTab('listings')}
            >
              {t('profile.tabs.listings')}
            </div>
            <div 
              className={`profile-tabs__item ${activeTab === 'favorites' ? 'profile-tabs__item--active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              {t('profile.tabs.favorites')}
            </div>
          </div>
          
          <div className="profile-content">
            {activeTab === 'profile' && (
              <div className="profile-info">
                <div className="profile-stats">
                  <div className="stat-card">
                    <div className="stat-card__value">{listingsData?.data?.total || 0}</div>
                    <div className="stat-card__label">{t('profile.stats.listings')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__value">{favoritesData?.data?.total || 0}</div>
                    <div className="stat-card__label">{t('profile.stats.favorites')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__value">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </div>
                    <div className="stat-card__label">{t('profile.stats.memberSince')}</div>
                  </div>
                </div>
                
                <div className="profile-info__header">
                  <h2>{t('profile.personalInfo')}</h2>
                  <p>{t('profile.personalInfoSubtitle')}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="profile-info__form">
                  <div className="profile-info__avatar">
                    <div className="profile-info__avatar-image">
                      {imagePreview || formData.profileImage ? (
                        <img 
                          src={imagePreview || formData.profileImage} 
                          alt={`${formData.firstName} ${formData.lastName}`} 
                        />
                      ) : (
                        <span>{getInitials(formData.firstName, formData.lastName)}</span>
                      )}
                    </div>
                    
                    <div className="profile-info__avatar-upload">
                      <input 
                        type="file" 
                        id="profileImage" 
                        name="profileImage" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      <label htmlFor="profileImage">
                        <FiCamera size={16} />
                        {t('profile.changePhoto')}
                      </label>
                    </div>
                  </div>
                  
                  <div className="profile-info__details">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="firstName">{t('profile.firstName')}</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="form-control"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="lastName">{t('profile.lastName')}</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="form-control"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email">{t('profile.email')}</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        className="form-control"
                        disabled
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phone">{t('profile.phone')}</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="+994 XX XXX XX XX"
                      />
                    </div>
                    
                    {error && (
                      <div className="alert alert-danger">
                        <FiAlertCircle size={18} />
                        <span>{error}</span>
                      </div>
                    )}
                    
                    <div className="form-actions">
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={loading}
                      >
                        {loading ? t('common.saving') : t('profile.saveChanges')}
                      </button>
                      
                      <button 
                        type="button" 
                        className="btn-outline"
                        onClick={() => navigate('/')}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
            
            {activeTab === 'listings' && (
              <div className="user-listings">
                <div className="user-listings__header">
                  <h2>{t('profile.myListings')}</h2>
                  <Link to="/create-listing" className="btn-add">
                    <FiPlus size={16} />
                    {t('profile.createListing')}
                  </Link>
                </div>
                
                <div className="user-listings__filters">
                  <div className="filter-group">
                    <label>{t('profile.filters.status')}:</label>
                    <div className="status-filter">
                      {statusOptions.map(option => (
                        <button
                          key={option.value}
                          className={`status-filter__btn ${listingsParams.status === option.value ? 'status-filter__btn--active' : ''}`}
                          onClick={() => handleStatusChange(option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {listingsLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                  </div>
                ) : listingsData?.data?.listings && listingsData.data.listings.length > 0 ? (
                  <>
                    <div className="user-listings__grid">
                      {listingsData.data.listings.map((listing) => (
                        <div key={listing.id} className="user-listings__item">
                          <div className="user-listings__item-image">
                            <img 
                              src={listing.featuredImage || listing.images?.[0] || `https://placehold.co/300x200?text=${encodeURIComponent(listing.title)}`} 
                              alt={listing.title} 
                            />
                            <div className={`status-badge status-badge--${listing.status}`}>
                              {t(`profile.listingStatus.${listing.status}`)}
                            </div>
                          </div>
                          <div className="user-listings__item-content">
                            <h3 className="user-listings__item-title">{listing.title}</h3>
                            <div className="user-listings__item-price">{listing.price} {listing.currency}</div>
                            <div className="user-listings__item-meta">
                              <div className="location">
                                <FiMapPin size={12} />
                                <span>{listing.location}</span>
                              </div>
                              <div className="views">
                                <FiEye size={12} />
                                <span>{listing.views}</span>
                              </div>
                            </div>
                            <div className="user-listings__item-actions">
                              <Link to={`/edit-listing/${listing.id}`} className="btn-edit">
                                <FiEdit size={14} />
                                {t('common.edit')}
                              </Link>
                              <button 
                                onClick={() => handleDeleteListing(listing.id)} 
                                className="btn-delete"
                                disabled={isDeleting}
                              >
                                <FiTrash2 size={14} />
                                {t('common.delete')}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {listingsData.data.totalPages > listingsParams.page && (
                      <div className="load-more">
                        <button 
                          className="btn-outline"
                          onClick={handleLoadMore}
                        >
                          {t('common.loadMore')}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="user-listings__empty">
                    <h3>{t('profile.noListings')}</h3>
                    <p>{t('profile.noListingsDescription')}</p>
                    <Link to="/create-listing" className="btn-add">
                      <FiPlus size={18} />
                      {t('profile.createListing')}
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'favorites' && (
              <div className="favorites">
                <div className="favorites__header">
                  <h2>{t('profile.favorites')}</h2>
                </div>
                
                {favoritesLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                  </div>
                ) : favoritesData?.data?.listings && favoritesData.data.listings.length > 0 ? (
                  <>
                    <div className="favorites__grid">
                      {favoritesData.data.listings.map((favorite: Listing) => (
                        <div key={favorite.id} className="favorites__item">
                          <div className="favorites__item-image">
                            <img 
                              src={favorite.featuredImage || favorite.images?.[0] || `https://placehold.co/300x200?text=${encodeURIComponent(favorite.title)}`} 
                              alt={favorite.title} 
                            />
                            <button 
                              className="favorite-btn favorite-btn--active"
                              onClick={() => handleToggleFavorite(favorite.id)}
                              aria-label={t('common.remove')}
                            >
                              <FiHeart size={16} />
                            </button>
                          </div>
                          <div className="favorites__item-content">
                            <h3 className="favorites__item-title">
                              <Link to={`/listing/${favorite.slug || favorite.id}`}>
                                {favorite.title}
                              </Link>
                            </h3>
                            <div className="favorites__item-price">{favorite.price} {favorite.currency}</div>
                            <div className="favorites__item-meta">
                              <div className="location">
                                <FiMapPin size={12} />
                                <span>{favorite.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {favoritesData.data.totalPages > favoritesParams.page && (
                      <div className="load-more">
                        <button 
                          className="btn-outline"
                          onClick={handleLoadMore}
                        >
                          {t('common.loadMore')}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="favorites__empty">
                    <h3>{t('profile.noFavorites')}</h3>
                    <p>{t('profile.noFavoritesDescription')}</p>
                    <Link to="/listings" className="btn-browse">
                      {t('profile.browseListing')}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 