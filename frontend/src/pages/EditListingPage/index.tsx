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
  uploadListingImages,
  axiosInstance
} from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ImageComponent from '../../components/common/ImageComponent';
import { isUserAdmin } from '../../utils/auth';
import { debugAuthState } from '../../services/authService';
import { uploadImagesToServer } from '../../services/imageServer';
import { getImageUrl } from '../../utils/imageUrl';
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

// Interface for form errors
interface FormErrors {
  [key: string]: string;
}

interface UploadedFile {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  url?: string;
  fullUrl?: string;
}

// Add this helper function to get localized category name
const getLocalizedCategoryName = (category: any, currentLanguage: string) => {
  if (!category.translations) return category.name;
  
  // Try to get the translation for the current language
  const translation = category.translations[currentLanguage as keyof typeof category.translations];
  
  // If no translation exists for the current language, fallback to the default name
  return translation || category.name;
};

const EditListingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
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
  
  // State for tracking which images are currently uploading
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  
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
      console.log('Raw images array from API:', JSON.stringify(listingData.images));
      console.log('Images array type:', typeof listingData.images);
      console.log('Is images an array?', Array.isArray(listingData.images));
      if (Array.isArray(listingData.images)) {
        console.log('Images array length:', listingData.images.length);
        listingData.images.forEach((img: any, idx: number) => {
          console.log(`Image at index ${idx}:`, img, 'type:', typeof img);
        });
      }
      
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
      
      // Store existing images - filter out null values with even more validation
      const images = Array.isArray(listingData.images) 
        ? listingData.images.filter((img: any) => {
            // First, log the raw image for debugging
            console.log('Processing existing image:', img, 'type:', typeof img);
            
            // Enhanced validation to filter out any invalid images
            if (img === null || img === undefined) {
              console.log('Filtering out null/undefined image');
              return false;
            }
            
            if (typeof img !== 'string') {
              console.log(`Filtering out non-string image of type: ${typeof img}`);
              return false;
            }
            
            if (img.trim() === '') {
              console.log('Filtering out empty string image');
              return false;
            }
            
            if (img === 'null' || img === 'undefined' || img === 'unknown') {
              console.log(`Filtering out string "${img}" as image`);
              return false;
            }
            
            return true;
          })
        : [];
      
      console.log('Setting existing images after strict filtering:', images.length);
      setExistingImages(images);
      
      // Create preview URLs for existing images - only for valid URLs
      setImagesPreview(images); // All images are already filtered above
      
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
  
  // Handle extracting clean filename from various path formats
  const extractFilenameFromPath = (path: string): string => {
    if (!path) return '';
    
    // Handle base paths like /api/images/filename.jpg
    if (path.startsWith('/api/images/')) {
      return path.substring('/api/images/'.length);
    }
    
    // Handle full URLs
    if (path.startsWith('http')) {
      const urlParts = path.split('/');
      return urlParts[urlParts.length - 1];
    }
    
    // Handle other path formats
    if (path.includes('/')) {
      const pathParts = path.split('/');
      return pathParts[pathParts.length - 1];
    }
    
    // Already just a filename
    return path;
  };
  
  // Handle image upload
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Check if we'd exceed the maximum number of images (10)
    if (existingImages.length + files.length > 10) {
      toast.error(t('listings.tooManyImages', 'Maximum 10 images allowed'));
      return;
    }
    
    const newFiles = Array.from(files);
    
    // Check size and type of each file
    const invalidFiles = newFiles.filter(file => {
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      return !isValidSize || !isValidType;
    });
    
    if (invalidFiles.length > 0) {
      toast.error(t('listings.invalidImageFiles', 'Some files were rejected (max 5MB, jpg/png/webp only)'));
    }
    
    // Continue with valid files only
    const validFiles = newFiles.filter(file => {
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      return isValidSize && isValidType;
    });
    
    if (validFiles.length === 0) return; // Exit if no valid files
    
    console.log('Adding new valid image files:', validFiles.length);
    
    // Create FormData for immediate upload
    const formDataForImages = new FormData();
    validFiles.forEach((file, index) => {
      console.log(`Image ${index+1}: ${file.name}, ${file.type}, ${file.size} bytes`);
      formDataForImages.append('images', file);
    });
    
    // Create safe preview URLs for valid files only
    const safeNewPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    try {
      // Add previews for better user experience while uploading
      setImagesPreview(prev => [...prev, ...safeNewPreviews]);
      
      // Set loading state
      setUploadingImages(true);
      
      // Immediately upload the images
      toast.info(t('listings.uploadingImages', 'Uploading images...'));
      const imageUploadResponse = await uploadImagesToServer(formDataForImages);
      
      // Detailed logging of the response structure
      console.log('Raw upload response:', imageUploadResponse);
      
      // Reset loading state
      setUploadingImages(false);
      
      if (!imageUploadResponse.success) {
        console.error('Upload failed:', imageUploadResponse.message);
        toast.error(t('listings.imageUploadFailed', 'Failed to upload images'));
        
        // Remove the previews since upload failed
        const previewsToRemove = safeNewPreviews.length;
        setImagesPreview(prev => prev.slice(0, prev.length - previewsToRemove));
        return;
      }
      
      if (!imageUploadResponse.files || !Array.isArray(imageUploadResponse.files) || imageUploadResponse.files.length === 0) {
        console.error('Invalid response format or empty files array:', imageUploadResponse);
        toast.error(t('listings.invalidResponseFormat', 'Invalid response from server'));
        
        // Remove the previews since we got an invalid response
        const previewsToRemove = safeNewPreviews.length;
        setImagesPreview(prev => prev.slice(0, prev.length - previewsToRemove));
        return;
      }
      
      // Process each file in the response to extract filenames
      const filenames = processUploadedImages(imageUploadResponse.files);
      console.log('Extracted filenames:', filenames);
      
      // Final validation of filenames before adding to state
      const validFilenames = filenames.filter(filename => {
        if (!filename) {
          console.log('Filtering out null/undefined filename');
          return false;
        }
        
        if (typeof filename !== 'string') {
          console.log(`Filtering out non-string filename of type: ${typeof filename}`);
          return false;
        }
        
        if (filename.trim() === '') {
          console.log('Filtering out empty string filename');
          return false;
        }
        
        if (filename === 'null' || filename === 'undefined' || filename === 'unknown') {
          console.log(`Filtering out string "${filename}" as filename`);
          return false;
        }
        
        return true;
      });
      
      console.log('Valid filenames after filtering:', validFilenames);
      
      if (validFilenames.length > 0) {
        console.log('New filenames to add:', validFilenames);
        
        // SIMPLIFIED APPROACH: Send just the filenames as a direct JSON string
        try {
          console.log(`Attaching ${validFilenames.length} images to listing ${id}`);
          
          // Use the improved uploadListingImages function
          const imageResponse = await uploadListingImages(
            id || '',
            validFilenames, 
            true // append to existing images
          );
          
          console.log('Image attachment response:', imageResponse);
          
          if (imageResponse.success) {
            // Add new filenames to existing images
            setExistingImages(prev => [...prev, ...validFilenames]);
            toast.success(`${validFilenames.length} images uploaded`);
            
            // If this is the first image being added, set it as the featured image
            if (existingImages.length === 0 && validFilenames.length > 0) {
              console.log('Setting first uploaded image as featured image:', validFilenames[0]);
              try {
                await axiosInstance.put(`/listings/${id}`, {
                  featuredImage: validFilenames[0]
                });
                toast.success(t('listings.featuredImageSet', 'First image set as featured image'));
              } catch (error) {
                console.error('Error setting featured image:', error);
                // Don't show error toast as it's not critical
              }
            }
            
            // Since we have valid filenames, adjust preview URLs
            // Remove the temporary previews and replace with proper URLs
            setImagesPreview(prev => {
              // Keep all existing previews except the temporary ones we added
              const oldPreviews = prev.slice(0, prev.length - safeNewPreviews.length);
              // Add the new valid filenames
              return [...oldPreviews, ...validFilenames];
            });
          } else {
            console.error('Failed to attach images to listing:', imageResponse.message);
            toast.error(t('listings.attachFailed', 'Failed to attach images to listing'));
            
            // Remove the previews since attachment failed
            const previewsToRemove = safeNewPreviews.length;
            setImagesPreview(prev => prev.slice(0, prev.length - previewsToRemove));
          }
        } catch (error) {
          console.error('Error attaching images to listing:', error);
          toast.error(t('listings.attachFailed', 'Failed to attach images to listing'));
          
          // Remove the previews since attachment failed
          const previewsToRemove = safeNewPreviews.length;
          setImagesPreview(prev => prev.slice(0, prev.length - previewsToRemove));
        }
      } else {
        console.error('No valid filenames extracted from response');
        toast.error(t('listings.noValidImages', 'No valid images were processed'));
        
        // Remove the previews since we couldn't extract valid filenames
        const previewsToRemove = safeNewPreviews.length;
        setImagesPreview(prev => prev.slice(0, prev.length - previewsToRemove));
      }
      
    } catch (error) {
      console.error('Error handling image upload:', error);
      setUploadingImages(false);
      toast.error(t('listings.uploadError', 'Error uploading images'));
      
      // Remove previews in case of error
      const previewsToRemove = safeNewPreviews.length;
      if (previewsToRemove > 0) {
        setImagesPreview(prev => prev.slice(0, prev.length - previewsToRemove));
      }
    }
  };
  
  // Clean up object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up function to revoke object URLs
      imagesPreview.forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(url);
          } catch (error) {
            console.error('Error revoking object URL:', error);
          }
        }
      });
    };
  }, [imagesPreview]);
  
  // Process the uploaded images to extract filenames
  const processUploadedImages = (files: any[]): string[] => {
    return files.map(file => {
      if (file.filename) return file.filename;
      if (file.url) return extractFilenameFromPath(file.url);
      if (file.path) return extractFilenameFromPath(file.path);
      return '';
    }).filter(filename => filename.trim() !== '');
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
  
  // Form validation
  const validateForm = () => {
    const errors: FormErrors = {};
    let isValid = true;
    
    // Title validation
    if (!formData.title.trim()) {
      errors.title = t('validation.required', 'This field is required');
      isValid = false;
    } else if (formData.title.length < 5) {
      errors.title = t('validation.minLength', 'Must be at least 5 characters');
      isValid = false;
    }
    
    // Description validation
    if (!formData.description.trim()) {
      errors.description = t('validation.required', 'This field is required');
      isValid = false;
    } else if (formData.description.length < 20) {
      errors.description = t('validation.minLength', 'Must be at least 20 characters');
      isValid = false;
    }
    
    // Price validation
    if (formData.price <= 0) {
      errors.price = t('validation.positiveNumber', 'Price must be greater than 0');
      isValid = false;
    }
    
    // Category validation
    if (!formData.categoryId) {
      errors.categoryId = t('validation.required', 'Please select a category');
      isValid = false;
    }
    
    // Contact info validation
    if (!formData.contactPhone && !formData.contactEmail) {
      errors.contactPhone = t('validation.contactRequired', 'At least one contact method is required');
      isValid = false;
    }
    
    // Location validation
    if (!formData.location.trim()) {
      errors.location = t('validation.required', 'This field is required');
      isValid = false;
    }
    
    // Update form errors
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
      
      // Now handle images separately - always update images if we have any
      if (existingImages.length > 0) {
        // Since images are already uploaded when selected, we just need to update the listing
        console.log('Updating with pre-uploaded images');
        console.log('Current existing images:', JSON.stringify(existingImages));
        
        // Filter out any invalid entries before sending with enhanced validation
        const validExistingImages = existingImages.filter(img => {
          // Very explicit validation to avoid NULL values in database
          if (img === null || img === undefined) {
            console.log('Filtering out null/undefined existing image');
            return false;
          }
          if (typeof img !== 'string') {
            console.log(`Filtering out non-string existing image: ${typeof img}`);
            return false;
          }
          if (img.trim() === '') {
            console.log('Filtering out empty string existing image');
            return false;
          }
          if (img === 'null' || img === 'undefined' || img === 'unknown') {
            console.log(`Filtering out "${img}" string existing image`);
            return false;
          }
          return true;
        });
        
        console.log('Valid existing images after filtering:', JSON.stringify(validExistingImages));
        
        // Ensure we have at least one valid image
        if (validExistingImages.length === 0) {
          console.error('No valid existing images after filtering');
          toast.error(t('listings.noValidImages', 'No valid images available'));
          setIsSubmitting(false);
          return;
        }
        
        try {
          console.log('Updating listing with images:', validExistingImages);
          const imagesResponse = await updateListing({
            id: id || '',
            listing: {
              images: validExistingImages
            }
          }).unwrap();
          
          console.log('Image update response:', imagesResponse);
          
          // No need to check for errors here, if we made it past unwrap() it succeeded
        } catch (imageError) {
          console.error('Error updating images:', imageError);
          toast.error(t('listings.imageUpdateError', 'Error updating images'));
          // Continue with the flow despite image errors
        }
      }
      
      setIsSubmitting(false);
      toast.success(t('listings.updateSuccess', 'Listing updated successfully'));
      
      // Navigate back to the listing page
      navigate(`/listings/${id}`);
    } catch (error) {
      console.error('Error updating listing:', error);
      setIsSubmitting(false);
      toast.error(
        t('listings.updateError', 'There was an error updating your listing')
      );
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
                <option value="new">{t('conditions.new', 'New')}</option>
                <option value="like_new">{t('conditions.likeNew', 'Like New')}</option>
                <option value="good">{t('conditions.good', 'Good')}</option>
                <option value="fair">{t('conditions.fair', 'Fair')}</option>
                <option value="poor">{t('conditions.poor', 'Poor')}</option>
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
                placeholder={t('listings.locationPlaceholder', 'Enter the item location')}
                required
                className={formErrors.location ? 'error' : ''}
              />
              {formErrors.location && <span className="error-message">{formErrors.location}</span>}
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
                {Array.isArray(categories) && categories.length > 0 && categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getLocalizedCategoryName(category, currentLanguage)}
                  </option>
                ))}
              </select>
              {formErrors.categoryId && <span className="error-message">{formErrors.categoryId}</span>}
            </div>
          </div>
          
          {/* Images Section */}
          <div className="create-listing-page__section">
            <h2>{t('listings.images', 'Images')}</h2>
            <p className="create-listing-page__help-text">
              {t('listings.imagesHelp', 'Upload up to 10 images. First image will be the main image shown in listings.')}
            </p>
            
            <div className="image-upload-container">
              <label htmlFor="images" className="image-upload-label">
                {uploadingImages ? (
                  <>
                    <LoadingSpinner size="small" /> {t('listings.uploading', 'Uploading...')}
                  </>
                ) : (
                  <>
                    <FiUpload className="upload-icon" />
                    <span>{t('listings.uploadImages', 'Upload Images')}</span>
                    <span className="image-count">
                      {imagesPreview.length}/10 {t('listings.imagesUploaded')}
                    </span>
                  </>
                )}
              </label>
              
              <input
                type="file"
                id="images"
                name="images"
                onChange={handleImageUpload}
                accept="image/jpeg, image/png, image/webp"
                multiple
                className="hidden-input"
              />
              
              {imagesPreview.length > 0 && (
                <div className="image-previews">
                  {imagesPreview.map((imageSrc, index) => (
                    <div className="image-preview-item" key={index}>
                      <ImageComponent
                        src={imageSrc.startsWith('blob:') ? imageSrc : getImageUrl(imageSrc)}
                        alt={`Listing image ${index + 1}`}
                        fallback="/placeholder.jpg"
                        silent={true}
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {formErrors.images && <div className="error-message"><FiAlertCircle /> {formErrors.images}</div>}
            </div>
          </div>
          
          {/* Contact Section */}
          <div className="create-listing-page__section">
            <h2>{t('listings.contactDetails', 'Contact Details')}</h2>
            
            <div className="create-listing-page__field">
              <label htmlFor="contactPhone">
                {t('listings.phone', 'Phone Number')}
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder={t('listings.phonePlaceholder', 'Enter contact phone number')}
                className={formErrors.contactPhone ? 'error' : ''}
              />
              {formErrors.contactPhone && <span className="error-message">{formErrors.contactPhone}</span>}
            </div>
            
            <div className="create-listing-page__field">
              <label htmlFor="contactEmail">
                {t('listings.email', 'Email')}
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder={t('listings.emailPlaceholder', 'Enter contact email')}
                className={formErrors.contactEmail ? 'error' : ''}
              />
              {formErrors.contactEmail && <span className="error-message">{formErrors.contactEmail}</span>}
            </div>
          </div>
          
          {/* Admin-only status section */}
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