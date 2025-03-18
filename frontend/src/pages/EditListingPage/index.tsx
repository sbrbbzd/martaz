import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiUpload, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';

import { selectAuthUser, selectAuthToken, selectIsAuthenticated } from '../../store/slices/authSlice';
import { 
  useGetListingQuery, 
  useUpdateListingMutation, 
  useGetCategoriesQuery,
  uploadListingImages
} from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { isUserAdmin } from '../../utils/auth';
import { debugAuthState } from '../../services/authService';
import { uploadImagesToServer } from '../../services/imageServer';
import './styles.scss';

// Define User interface
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  profileImage?: string;
}

// Interface for the form data
interface ListingFormData {
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  location: string;
  images: File[];
  categoryId: string;
  contactPhone: string;
  contactEmail: string;
  status: string;
}

// Interface for form validation errors
interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
  location?: string;
  categoryId?: string;
  images?: string;
}

const EditListingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useSelector(selectAuthUser) as User | null;
  const authToken = useSelector(selectAuthToken);
  const isUserAuthenticated = useSelector(selectIsAuthenticated);
  
  // Get listing data
  const { 
    data: listingResponse, 
    isLoading: isListingLoading, 
    error: listingError 
  } = useGetListingQuery(id || '');
  
  // Get categories
  const { 
    data: categories, 
    isLoading: isCategoriesLoading 
  } = useGetCategoriesQuery();
  
  // Update listing mutation
  const [updateListing, { isLoading: isUpdating }] = useUpdateListingMutation();
  
  // Define form state
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    price: 0,
    currency: 'AZN',
    condition: 'good',
    location: '',
    images: [],
    categoryId: '',
    contactPhone: '',
    contactEmail: '',
    status: 'active'
  });
  
  // Track existing images (from the server) separately from newly uploaded ones
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagesPreview, setImagesPreview] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Fill form with listing data when it loads
  useEffect(() => {
    console.log('==== EDIT LISTING PAGE DEBUG ====');
    console.log('Auth state - isAuthenticated:', isUserAuthenticated);
    console.log('Current user:', currentUser);
    console.log('Auth token:', authToken);
    
    if (listingResponse?.data) {
      // The API returns data directly, not nested in a "listing" property
      const listingData = listingResponse.data;
      
      console.log('Listing data:', JSON.stringify(listingResponse.data));
      
      if (!listingData) {
        console.error('Listing data is missing or malformed');
        toast.error(t('listings.notFound', 'Listing not found'));
        navigate('/');
        return;
      }
      
      // Check if current user is authorized to edit this listing
      const currentUserId = currentUser?.id?.toString();
      const listingUserId = listingData.userId?.toString();
      
      const isOwner = currentUserId === listingUserId;
      const isAdmin = currentUser && isUserAdmin(currentUser);
      
      console.log('Authorization check:');
      console.log('currentUserId:', currentUserId, 'type:', typeof currentUserId);
      console.log('listingUserId:', listingUserId, 'type:', typeof listingUserId);
      console.log('Direct comparison:', currentUser?.id === listingData.userId);
      console.log('String comparison:', currentUserId === listingUserId);
      console.log('isOwner:', isOwner, 'isAdmin:', isAdmin);
      
      // If not authorized, redirect
      if (!isOwner && !isAdmin) {
        console.error('Authorization failed - redirecting to home');
        toast.error(t('listings.notAuthorized', 'You are not authorized to edit this listing'));
        navigate('/');
        return;
      }
      
      console.log('Authorization passed - continuing with edit form');
      
      // Convert string price to number if needed
      const priceValue = typeof listingData.price === 'string' 
        ? parseFloat(listingData.price) 
        : listingData.price;
      
      setFormData({
        title: listingData.title || '',
        description: listingData.description || '',
        price: isNaN(priceValue) ? 0 : priceValue,
        currency: listingData.currency || 'AZN',
        condition: listingData.condition || 'good',
        location: listingData.location || '',
        images: [], // We'll handle existing images separately
        categoryId: listingData.categoryId || '',
        contactPhone: listingData.contactPhone || '',
        contactEmail: listingData.contactEmail || '',
        status: listingData.status || 'active'
      });
      
      // Store existing images
      const images = listingData.images || [];
      console.log('Setting existing images:', images.length);
      setExistingImages(images);
      
      // Create preview URLs for existing images
      setImagesPreview(images);
      
      // Reset new image files
      setImageFiles([]);
    }
  }, [listingResponse, currentUser, navigate, t]);
  
  // Check authentication and debug auth state
  useEffect(() => {
    // Debug auth state
    const authDebug = debugAuthState();
    console.log('Auth debug result:', authDebug);
    
    if (!isUserAuthenticated) {
      toast.error(t('auth.notAuthenticated', 'You must be logged in to edit a listing'));
      navigate('/login', { state: { from: `/listings/${id}/edit` } });
    }
  }, [isUserAuthenticated, navigate, t, id]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear any error for this field when the user types
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    
    if (name === 'price') {
      const numValue = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : isNaN(numValue) ? 0 : numValue
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle image upload
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files);
    
    // Check size and type of each file
    const invalidFiles = newFiles.filter(file => {
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      return !isValidSize || !isValidType;
    });
    
    if (invalidFiles.length > 0) {
      toast.error(t('listings.invalidImageFiles', 'Some files were rejected (max 5MB, jpg/png/webp only)'));
      return;
    }
    
    // Update files and previews - only add the new files
    setImageFiles(prev => [...prev, ...newFiles]);
    
    // Generate previews for new files
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagesPreview(prev => [...prev, ...newPreviews]);
  };
  
  // Handle removing images 
  const handleRemoveImage = (index: number) => {
    // Determine if this is an existing image or a new file
    if (index < existingImages.length) {
      // Remove an existing image
      setExistingImages(prev => prev.filter((_, i) => i !== index));
      setImagesPreview(prev => {
        const newPreviews = [...prev];
        newPreviews.splice(index, 1);
        return newPreviews;
      });
    } else {
      // Remove a new image file
      const adjustedIndex = index - existingImages.length;
      setImageFiles(prev => prev.filter((_, i) => i !== adjustedIndex));
      
      // Update previews
      setImagesPreview(prev => {
        const newPreviews = [...prev];
        newPreviews.splice(index, 1);
        return newPreviews;
      });
    }
  };
  
  // Form validation
  const validateForm = () => {
    const errors: FormErrors = {};
    let isValid = true;
    
    console.log('Validating form with data:', formData);
    console.log('Existing images:', existingImages.length, 'New images:', imageFiles.length);

    // Validate title
    if (!formData.title || formData.title.length < 3) {
      errors.title = t('listings.titleRequired', 'Title must be at least 3 characters');
      isValid = false;
      console.log('Title validation failed:', formData.title);
    }
    
    // Validate description
    if (!formData.description || formData.description.length < 10) {
      errors.description = t('listings.descriptionRequired', 'Description must be at least 10 characters');
      isValid = false;
      console.log('Description validation failed:', formData.description);
    }
    
    // Validate price
    if (formData.price <= 0) {
      console.log('Price validation failed:', formData.price);
      errors.price = t('listings.priceRequired', 'Price must be greater than 0');
      isValid = false;
    }
    
    // Validate location
    if (!formData.location) {
      console.log('Location validation failed');
      errors.location = t('listings.locationRequired', 'Location is required');
      isValid = false;
    }
    
    // Validate category
    if (!formData.categoryId) {
      console.log('Category validation failed');
      errors.categoryId = t('listings.categoryRequired', 'Category is required');
      isValid = false;
    }
    
    // Require at least one image
    if (existingImages.length === 0 && imageFiles.length === 0) {
      console.log('Images validation failed - no images found');
      errors.images = t('listings.imagesRequired', 'At least one image is required');
      isValid = false;
    }
    
    // Store validation errors and return result
    setFormErrors(errors);
    
    if (!isValid) {
      console.log('Form validation failed with errors:', errors);
    } else {
      console.log('Form validation passed');
    }
    
    return isValid;
  };
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting form submission');
    
    // Validate the form
    if (!validateForm()) {
      console.error('Form validation failed');
      toast.error(t('listings.formHasErrors', 'Please correct the errors in the form'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First update the listing details without images
      console.log('Updating listing details...');
      
      // Prepare formData for API
      const listingUpdateData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        currency: formData.currency,
        condition: formData.condition,
        location: formData.location,
        categoryId: formData.categoryId,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        status: formData.status
      };
      
      // Update the listing without modifying images
      const response = await updateListing({
        id: id || '',
        listing: listingUpdateData
      }).unwrap();
      
      console.log('Update listing response:', response);
      
      // Now handle images separately
      let hasImageChanges = imageFiles.length > 0 || 
                           (listingResponse?.data?.images?.length !== existingImages.length);
      
      if (hasImageChanges) {
        try {
          // 1. If we have new images, upload them first
          let newImagePaths: string[] = [];
          
          if (imageFiles.length > 0) {
            toast.info(t('listings.uploadingImages'));
            
            const formDataForImages = new FormData();
            imageFiles.forEach(file => {
              formDataForImages.append('images', file);
            });
            
            const imageUploadResponse = await uploadImagesToServer(formDataForImages);
            console.log('Image upload response:', imageUploadResponse);
            
            if (!imageUploadResponse.success || !imageUploadResponse.files) {
              throw new Error('Failed to upload new images');
            }
            
            newImagePaths = imageUploadResponse.files.map(file => file.path);
          }
          
          // 2. Update the listing with the final list of images
          const finalImagesList = [...existingImages, ...newImagePaths];
          console.log('Final images list:', finalImagesList);
          
          // Update the listing with the new images list
          await updateListing({
            id: id || '',
            listing: {
              ...listingUpdateData,
              images: finalImagesList
            }
          }).unwrap();
          
          toast.success(t('listings.updateSuccess'));
        } catch (error) {
          console.error('Error updating images:', error);
          toast.error(t('listings.imageUploadError'));
        }
      } else {
        // No image changes, just show success message
        toast.success(t('listings.updateSuccess'));
      }
      
      // Redirect to the listing detail page
      navigate(`/listings/${id}`);
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error(t('listings.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Loading state
  if (isListingLoading || isCategoriesLoading) {
    return <LoadingSpinner size="large" text={t('listings.loading', 'Loading...')} />;
  }
  
  // Error state
  if (listingError || !listingResponse) {
    return <ErrorMessage message={t('listings.notFound', 'Listing not found')} />;
  }
  
  return (
    <div className="create-listing-page">
      <Helmet>
        <title>{t('listings.editTitle', 'Edit Listing')} | {t('app.name', 'Mart.az')}</title>
      </Helmet>
      
      <div className="container">
        <div className="create-listing-page__header">
          <h1>{t('listings.editTitle', 'Edit Listing')}</h1>
        </div>
        
        <form className="create-listing-page__form" onSubmit={handleSubmit}>
          {/* Basic Details Section */}
          <div className="create-listing-page__section">
            <h2>{t('listings.basicDetails', 'Basic Details')}</h2>
            
            <div className="create-listing-page__field">
              <label htmlFor="title">
                {t('listings.title', 'Title')} <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={t('listings.titlePlaceholder', 'Enter a descriptive title')}
                required
                className={formErrors.title ? 'error' : ''}
              />
              {formErrors.title && <span className="error-message">{formErrors.title}</span>}
            </div>
            
            <div className="create-listing-page__field">
              <label htmlFor="description">
                {t('listings.description', 'Description')} <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t('listings.descriptionPlaceholder', 'Describe your item in detail')}
                rows={5}
                required
                className={formErrors.description ? 'error' : ''}
              />
              {formErrors.description && <span className="error-message">{formErrors.description}</span>}
            </div>
            
            <div className="create-listing-page__field-group">
              <div className="create-listing-page__field">
                <label htmlFor="price">
                  {t('listings.price', 'Price')} <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  className={formErrors.price ? 'error' : ''}
                />
                {formErrors.price && <span className="error-message">{formErrors.price}</span>}
              </div>
              
              <div className="create-listing-page__field">
                <label htmlFor="currency">
                  {t('listings.currency', 'Currency')}
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                >
                  <option value="AZN">AZN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            
            <div className="create-listing-page__field-group">
              <div className="create-listing-page__field">
                <label htmlFor="condition">
                  {t('listings.condition', 'Condition')}
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                >
                  <option value="new">{t('condition.new', 'New')}</option>
                  <option value="like-new">{t('condition.like-new', 'Like New')}</option>
                  <option value="good">{t('condition.good', 'Good')}</option>
                  <option value="fair">{t('condition.fair', 'Fair')}</option>
                  <option value="poor">{t('condition.poor', 'Poor')}</option>
                </select>
              </div>
              
              <div className="create-listing-page__field">
                <label htmlFor="location">
                  {t('listings.location', 'Location')} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder={t('listings.locationPlaceholder', 'e.g., Baku, Azerbaijan')}
                  required
                  className={formErrors.location ? 'error' : ''}
                />
                {formErrors.location && <span className="error-message">{formErrors.location}</span>}
              </div>
            </div>
            
            <div className="create-listing-page__field">
              <label htmlFor="categoryId">
                {t('listings.category', 'Category')} <span className="required">*</span>
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                required
                className={formErrors.categoryId ? 'error' : ''}
              >
                <option value="">{t('listings.selectCategory', 'Select a category')}</option>
                {categories && categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {formErrors.categoryId && <span className="error-message">{formErrors.categoryId}</span>}
            </div>
          </div>
          
          {/* Images Section */}
          <div className="create-listing-page__section">
            <h2>{t('listings.images', 'Images')}</h2>
            
            <div className="create-listing-page__images">
              {imagesPreview.map((src, index) => (
                <div className="create-listing-page__image-preview" key={index}>
                  <img src={src} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="create-listing-page__image-remove"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
              
              <label className="create-listing-page__image-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                />
                <div className="create-listing-page__upload-content">
                  <FiUpload size={24} />
                  <span>{t('listings.uploadImages', 'Upload Images')}</span>
                </div>
              </label>
            </div>
            
            {formErrors.images && <span className="error-message">{formErrors.images}</span>}
            
            <p className="create-listing-page__image-tip">
              <FiAlertCircle />
              {t('listings.imageHelp', 'Add clear photos to get more interest. Maximum 5MB per image, jpg/png formats.')}
            </p>
          </div>
          
          {/* Contact Section */}
          <div className="create-listing-page__section">
            <h2>{t('listings.contactInfo', 'Contact Information')}</h2>
            
            <div className="create-listing-page__field">
              <label htmlFor="contactPhone">
                {t('listings.contactPhone', 'Phone Number')}
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder={t('listings.contactPhonePlaceholder', 'e.g., +994 50 123 4567')}
              />
            </div>
            
            <div className="create-listing-page__field">
              <label htmlFor="contactEmail">
                {t('listings.contactEmail', 'Email')}
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder={t('listings.contactEmailPlaceholder', 'e.g., name@example.com')}
              />
            </div>
          </div>
          
          {/* Admin only status field */}
          {currentUser && isUserAdmin(currentUser) && (
            <div className="create-listing-page__section">
              <h2>{t('listings.status', 'Listing Status')}</h2>
              
              <div className="create-listing-page__field">
                <label htmlFor="status">
                  {t('listings.status', 'Status')}
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">{t('status.active', 'Active')}</option>
                  <option value="pending">{t('status.pending', 'Pending')}</option>
                  <option value="sold">{t('status.sold', 'Sold')}</option>
                  <option value="expired">{t('status.expired', 'Expired')}</option>
                </select>
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="create-listing-page__actions">
            <button
              type="button"
              className="create-listing-page__cancel"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            
            <button
              type="submit"
              className="create-listing-page__submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" />
                  {t('listings.updating', 'Updating...')}
                </>
              ) : (
                <>
                  <FiCheck />
                  {t('listings.updateListing', 'Update Listing')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditListingPage; 