import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiUpload, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { selectAuthUser } from '../../store/slices/authSlice';
import { useCreateListingMutation, useGetCategoriesQuery } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { isAuthenticated } from '../../utils/auth';
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
}

const CreateListingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useSelector(selectAuthUser) as User | null;
  
  // Fetch categories using the API 
  const { data: categories, isLoading: categoriesLoading } = useGetCategoriesQuery();
  
  // API mutation hook for creating a listing
  const [createListing, { isLoading: isSubmitting, isError, error }] = useCreateListingMutation();
  
  // State for form data
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    price: 0,
    currency: 'AZN',
    condition: 'new',
    location: '',
    images: [],
    categoryId: '',
    contactPhone: currentUser?.phone || '',
    contactEmail: currentUser?.email || '',
  });
  
  // State for validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof ListingFormData, string>>>({});
  
  // State for image previews
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Redirect if user is not authenticated
  useEffect(() => {
    if (!isAuthenticated(currentUser)) {
      toast.error(t('common.loginRequired'));
      navigate('/login');
    }
  }, [currentUser, navigate, t]);

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name as keyof ListingFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Limit to 10 images
      if (formData.images.length + selectedFiles.length > 10) {
        toast.warning(t('listings.maxImagesExceeded', { max: 10 }));
        return;
      }
      
      // Add new files to existing ones
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...selectedFiles]
      }));
      
      // Create and store previews
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Remove an image
  const handleRemoveImage = (index: number) => {
    // Remove from form data
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData(prev => ({ ...prev, images: newImages }));
    
    // Remove preview and revoke URL
    const previewUrl = imagePreviews[index];
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
    
    URL.revokeObjectURL(previewUrl);
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ListingFormData, string>> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t('listings.titleRequired');
    } else if (formData.title.length < 5) {
      newErrors.title = t('listings.titleTooShort');
    }
    
    if (!formData.description.trim()) {
      newErrors.description = t('listings.descriptionRequired');
    } else if (formData.description.length < 20) {
      newErrors.description = t('listings.descriptionTooShort');
    }
    
    if (formData.price <= 0) {
      newErrors.price = t('listings.priceRequired');
    }
    
    if (!formData.location.trim()) {
      newErrors.location = t('listings.locationRequired');
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = t('listings.categoryRequired');
    }
    
    if (!formData.contactPhone && !formData.contactEmail) {
      newErrors.contactPhone = t('listings.contactInfoRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = document.querySelector('.form-group.error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    try {
      // Create a regular object (not FormData) that matches Partial<Listing> type
      const listingData: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        currency: formData.currency,
        condition: formData.condition,
        location: formData.location,
        categoryId: formData.categoryId,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        // Generate a slug from the title
        slug: formData.title.toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with a single one
      };
      
      // Note: In a real implementation, you would need to handle image uploads separately
      // or modify the API to accept FormData. For now, we'll just send the data without images.
      // You may need to implement a custom API endpoint for this.
      
      // Submit the data
      const result = await createListing(listingData).unwrap();
      
      toast.success(t('listings.creationSuccess'));
      
      // Navigate to the new listing
      if (result.data?.id) {
        navigate(`/listings/${result.data.id}`);
      } else {
        navigate('/profile');
      }
      
    } catch (err) {
      console.error('Error creating listing:', err);
      toast.error(t('listings.creationError'));
    }
  };

  if (categoriesLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="create-listing-page">
      <div className="create-listing-container">
        <h1 className="page-title">{t('listings.createTitle')}</h1>
        <p className="page-subtitle">{t('listings.createSubtitle')}</p>
        
        <form onSubmit={handleSubmit} className="listing-form">
          {/* Basic Info Section */}
          <div className="form-section">
            <h2 className="section-title">{t('listings.basicInfo')}</h2>
            
            <div className={`form-group ${errors.title ? 'error' : ''}`}>
              <label htmlFor="title">{t('listings.title')} <span className="required">*</span></label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={t('listings.titlePlaceholder')}
                maxLength={100}
              />
              {errors.title && <div className="error-message"><FiAlertCircle /> {errors.title}</div>}
            </div>
            
            <div className={`form-group ${errors.description ? 'error' : ''}`}>
              <label htmlFor="description">{t('listings.description')} <span className="required">*</span></label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t('listings.descriptionPlaceholder')}
                rows={5}
              />
              {errors.description && <div className="error-message"><FiAlertCircle /> {errors.description}</div>}
            </div>
            
            <div className={`form-group ${errors.categoryId ? 'error' : ''}`}>
              <label htmlFor="categoryId">{t('listings.category')} <span className="required">*</span></label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
              >
                <option value="">{t('listings.selectCategory')}</option>
                {categories?.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <div className="error-message"><FiAlertCircle /> {errors.categoryId}</div>}
            </div>
          </div>
          
          {/* Price and Condition Section */}
          <div className="form-section">
            <h2 className="section-title">{t('listings.pricingDetails')}</h2>
            
            <div className="form-row">
              <div className={`form-group ${errors.price ? 'error' : ''}`}>
                <label htmlFor="price">{t('listings.price')} <span className="required">*</span></label>
                <div className="price-input-group">
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                  >
                    <option value="AZN">₼ AZN</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                </div>
                {errors.price && <div className="error-message"><FiAlertCircle /> {errors.price}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="condition">{t('listings.condition')}</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                >
                  <option value="new">{t('condition.new')}</option>
                  <option value="like-new">{t('condition.like-new')}</option>
                  <option value="good">{t('condition.good')}</option>
                  <option value="fair">{t('condition.fair')}</option>
                  <option value="poor">{t('condition.poor')}</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Location Section */}
          <div className="form-section">
            <h2 className="section-title">{t('listings.location')}</h2>
            
            <div className={`form-group ${errors.location ? 'error' : ''}`}>
              <label htmlFor="location">{t('listings.locationLabel')} <span className="required">*</span></label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder={t('listings.locationPlaceholder')}
              />
              {errors.location && <div className="error-message"><FiAlertCircle /> {errors.location}</div>}
            </div>
          </div>
          
          {/* Images Section */}
          <div className="form-section">
            <h2 className="section-title">{t('listings.images')}</h2>
            <p className="section-description">{t('listings.imagesDescription')}</p>
            
            <div className="image-upload-container">
              <label htmlFor="images" className="image-upload-label">
                <FiUpload className="upload-icon" />
                <span>{t('listings.uploadImages')}</span>
                <span className="image-count">
                  {formData.images.length}/10 {t('listings.imagesUploaded')}
                </span>
              </label>
              <input
                type="file"
                id="images"
                name="images"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden-input"
              />
              
              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={preview} alt={`Preview ${index + 1}`} />
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
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="form-section">
            <h2 className="section-title">{t('listings.contactInfo')}</h2>
            
            <div className={`form-group ${errors.contactPhone ? 'error' : ''}`}>
              <label htmlFor="contactPhone">{t('listings.contactPhone')}</label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder={t('listings.contactPhonePlaceholder')}
              />
              {errors.contactPhone && <div className="error-message"><FiAlertCircle /> {errors.contactPhone}</div>}
              <p className="help-text">{t('listings.contactInfoHelp')}</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="contactEmail">{t('listings.contactEmail')}</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder={t('listings.contactEmailPlaceholder')}
              />
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" />
                  {t('common.submitting')}
                </>
              ) : (
                <>
                  <FiPlus />
                  {t('listings.createButton')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListingPage; 