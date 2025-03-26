import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { FiCamera, FiAlertCircle, FiCheckCircle, FiUser, FiMail, FiPhone, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { AppDispatch, RootState } from '../../../store/types';

import ImageComponent from '../../../components/common/ImageComponent';
import { updateProfile, updateProfileImage, updateUser } from '../../../store/slices/authSlice';
import { getImageUrl, markImageAsFailed } from '../../../utils/helpers';

// Placeholder image
const PLACEHOLDER_AVATAR = getImageUrl('placeholder.jpg');

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
  createdAt?: string;
}

interface UserInfoTabProps {
  user: User;
}

const UserInfoTab: React.FC<UserInfoTabProps> = ({ user }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  
  // Get the current user from Redux store to ensure we have the latest data
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  console.log('UserInfoTab Re-render:', {
    propsUser: user,
    reduxUser: currentUser
  });
  
  // Use Redux user data first, fallback to props for initial render
  const userToUse = currentUser || user;
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: userToUse.firstName || '',
    lastName: userToUse.lastName || '',
    email: userToUse.email,
    phone: userToUse.phone || '',
    profileImage: userToUse.profileImage || '',
  });
  
  // Original data for comparison and reset
  const [originalData, setOriginalData] = useState({
    firstName: userToUse.firstName || '',
    lastName: userToUse.lastName || '',
    email: userToUse.email,
    phone: userToUse.phone || '',
    profileImage: userToUse.profileImage || '',
  });
  
  // Track if form has changed
  const [formChanged, setFormChanged] = useState(false);
  
  // Image preview state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Update form data when user prop changes (e.g., after a successful update)
  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email,
        phone: currentUser.phone || '',
        profileImage: currentUser.profileImage || '',
      });
      
      setOriginalData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email,
        phone: currentUser.phone || '',
        profileImage: currentUser.profileImage || '',
      });
    }
  }, [currentUser]);
  
  // Update formChanged state when form data changes
  useEffect(() => {
    const hasChanged = 
      formData.firstName !== originalData.firstName ||
      formData.lastName !== originalData.lastName ||
      formData.phone !== originalData.phone ||
      imageFile !== null;
    
    setFormChanged(hasChanged);
  }, [formData, originalData, imageFile]);
  
  // Reset success message after 3 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success) {
      timer = setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('profile.imageTooLarge'));
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(t('profile.invalidImageType'));
        return;
      }
      
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Process profile image URL
  const processProfileImage = (imageUrl?: string) => {
    if (!imageUrl) return PLACEHOLDER_AVATAR;
    try {
      return getImageUrl(imageUrl);
    } catch (error) {
      console.error('Error processing profile image:', error);
      return PLACEHOLDER_AVATAR;
    }
  };
  
  // Get initials for avatar placeholder
  const getInitials = (firstName: string = '', lastName: string = '') => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  // Reset form to original values
  const handleReset = () => {
    setFormData(originalData);
    setImagePreview(null);
    setImageFile(null);
    setError(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formChanged) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      let updatedProfileImage = formData.profileImage;
      
      // Handle profile image update if there's a new image
      if (imageFile) {
        const formData = new FormData();
        formData.append('profileImage', imageFile);
        
        const imageResult = await dispatch(updateProfileImage(formData)).unwrap();
        updatedProfileImage = imageResult.profileImage;
        
        // Update form data with new image
        setFormData(prev => ({
          ...prev,
          profileImage: updatedProfileImage,
        }));
      }
      
      // Update user profile data
      const profileData = await dispatch(updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      })).unwrap();
      
      // Force update Redux directly for immediate UI update
      dispatch(updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        profileImage: updatedProfileImage
      }));
      
      console.log('Profile updated successfully:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        profileImage: updatedProfileImage
      });
      
      // Create a custom event with the updated user data
      const customEvent = new CustomEvent('user-profile-updated', {
        detail: {
          timestamp: Date.now(),
          updatedFields: ['firstName', 'lastName', 'phone', imageFile ? 'profileImage' : null].filter(Boolean)
        }
      });
      
      // Dispatch the event
      window.dispatchEvent(customEvent);
      
      // Update original data to match new data
      setOriginalData({
        ...formData,
        ...profileData,
      });
      
      // Show success message
      setSuccess(true);
      toast.success(t('profile.updateSuccess'));
      
      // Reset image file state since it's been uploaded
      setImageFile(null);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const errorMessage = err.message || t('profile.updateError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="user-info-tab">
      <div className="user-info-tab__header">
        <h2>{t('profile.personalInfo')}</h2>
        <p>{t('profile.personalInfoSubtitle')}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="user-info-tab__form">
        <div className="user-info-tab__avatar">
          <div className="user-info-tab__avatar-image">
            {(imagePreview || formData.profileImage) ? (
              <ImageComponent
                src={imagePreview || processProfileImage(formData.profileImage)}
                alt={`${formData.firstName} ${formData.lastName}`}
                fallbackImage={PLACEHOLDER_AVATAR}
                onError={() => {
                  if (formData.profileImage) {
                    markImageAsFailed(formData.profileImage);
                  }
                }}
              />
            ) : (
              <span>{getInitials(formData.firstName, formData.lastName)}</span>
            )}
          </div>
          
          <div className="user-info-tab__avatar-upload">
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
          
          {imageFile && (
            <div className="user-info-tab__avatar-filename">
              {imageFile.name}
              <button 
                type="button" 
                className="remove-file-btn"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
        
        <div className="user-info-tab__details">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">
                <FiUser className="form-icon" />
                {t('profile.firstName')}
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="form-control"
                required
                placeholder={t('profile.firstName')}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">
                <FiUser className="form-icon" />
                {t('profile.lastName')}
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="form-control"
                required
                placeholder={t('profile.lastName')}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">
              <FiMail className="form-icon" />
              {t('profile.email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              className="form-control form-control--disabled"
              disabled
            />
            <div className="form-hint">{t('profile.emailCannotBeChanged')}</div>
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">
              <FiPhone className="form-icon" />
              {t('profile.phone')}
            </label>
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
          
          {success && (
            <div className="alert alert-success">
              <FiCheckCircle size={18} />
              <span>{t('profile.updateSuccess')}</span>
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn--primary"
              disabled={loading || !formChanged}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <FiSave size={18} />
                  {t('profile.saveChanges')}
                </>
              )}
            </button>
            
            <button 
              type="button" 
              className="btn btn--outline"
              onClick={handleReset}
              disabled={loading || !formChanged}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserInfoTab; 