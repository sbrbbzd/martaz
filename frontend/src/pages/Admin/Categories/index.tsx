import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FiGrid, 
  FiCheck, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiChevronDown, 
  FiChevronRight,
  FiAlertCircle,
  FiSearch,
  FiEye
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminLayout from '../../../components/Admin/AdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from '../../../services/api';
// @ts-ignore - Module exists but TypeScript can't find it
import { showConfirm } from '../../../utils/confirm';
// @ts-ignore
import slugify from 'slugify';
import './styles.scss';
import { uploadImagesToServer, getImageUrl } from '../../../services/imageServer';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  icon: string;
  isActive: boolean;
  iconFile?: File | null;
  iconPreview?: string | null;
}

const initialFormData: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  parentId: null,
  icon: '',
  isActive: true,
  iconFile: null,
  iconPreview: null
};

const CategoryManagement: React.FC = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [uploadStatus, setUploadStatus] = useState<{
    uploading: boolean,
    progress: number
  }>({
    uploading: false,
    progress: 0
  });
  
  // Fetch categories with RTK Query
  const { 
    data: categoriesData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useGetCategoriesQuery(undefined);
  
  // Mutations for category actions
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();
  
  // Filter categories by search text
  const filteredCategories = categoriesData ? 
    categoriesData.filter(category => 
      category.name.toLowerCase().includes(searchText.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchText.toLowerCase())
    ) : [];
  
  // Get root categories and their subcategories
  const rootCategories = filteredCategories.filter(category => !category.parentId);
  
  // Get subcategories for a parent category
  const getSubcategories = (parentId: string) => {
    return filteredCategories.filter(category => category.parentId === parentId);
  };
  
  // Toggle category expansion in tree view
  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  // Handle name change separately to auto-update slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      name: value,
      slug: generateSlug(value)
    }));
  };
  
  // Handle file input change for icon
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      
      setFormData({
        ...formData,
        iconFile: file,
        iconPreview: previewUrl
      });
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setEditingCategoryId(null);
    setShowForm(false);
    setUploadStatus({
      uploading: false,
      progress: 0
    });
  };
  
  // Edit category
  const handleEditCategory = (category: any) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parentId,
      icon: category.icon || '',
      isActive: category.isActive,
      iconFile: null,
      iconPreview: category.icon ? (category.icon.startsWith('http') ? category.icon : getImageUrl(category.icon)) : null
    });
    setEditingCategoryId(category.id);
    setShowForm(true);
  };
  
  // Delete category with confirmation
  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm(t('admin.categories.deleteConfirmation', 'Are you sure you want to delete this category? This will also delete all subcategories and may affect listings.'))) {
      try {
        await deleteCategory(categoryId).unwrap();
        // Could add success notification here
      } catch (err) {
        console.error('Failed to delete category:', err);
        // Could add error notification here
      }
    }
  };
  
  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let iconPath = formData.icon;
      
      // Upload icon file if selected
      if (formData.iconFile) {
        setUploadStatus({
          uploading: true,
          progress: 0
        });
        
        const formDataForIcon = new FormData();
        formDataForIcon.append('images', formData.iconFile);
        
        const uploadResponse = await uploadImagesToServer(formDataForIcon, (progress) => {
          setUploadStatus({
            uploading: true,
            progress
          });
        });
        
        if (uploadResponse.success && uploadResponse.files && uploadResponse.files.length > 0) {
          // Get the first file's path or URL
          const fileData = uploadResponse.files[0];
          if (fileData.path) {
            iconPath = fileData.path;
          } else if (fileData.url) {
            iconPath = fileData.url;
          } else if (typeof fileData === 'string') {
            iconPath = fileData;
          }
          console.log('Uploaded icon path:', iconPath);
        } else {
          console.error('Icon upload failed:', uploadResponse);
          toast.error(t('admin.categories.iconUploadFailed', 'Failed to upload category icon'));
        }
        
        setUploadStatus({
          uploading: false,
          progress: 100
        });
      }
      
      const categoryData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        parentId: formData.parentId || null,
        icon: iconPath,
        isActive: formData.isActive
      };
      
      if (editingCategoryId) {
        await updateCategory({ id: editingCategoryId, ...categoryData });
        toast.success(t('admin.categories.updateSuccess', 'Category updated successfully'));
      } else {
        await createCategory(categoryData).unwrap();
        toast.success(t('admin.categories.createSuccess', 'Category created successfully'));
      }
      
      resetForm();
      refetch();
    } catch (error) {
      console.error('Category save error:', error);
      toast.error(t('admin.categories.saveFailed', 'Failed to save category'));
    }
  };
  
  // Recursive component to render category tree
  const CategoryTree = ({ categories, level = 0 }: { categories: any[], level?: number }) => {
    return (
      <ul className={`category-tree level-${level}`}>
        {categories.map(category => {
          const subcategories = getSubcategories(category.id);
          const hasSubcategories = subcategories.length > 0;
          const isExpanded = expandedCategories[category.id];
          
          return (
            <li key={category.id} className="category-item">
              <div className="category-row">
                {hasSubcategories && (
                  <button 
                    className="toggle-button"
                    onClick={() => toggleCategoryExpand(category.id)}
                  >
                    {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                  </button>
                )}
                
                {!hasSubcategories && <span className="toggle-placeholder"></span>}
                
                <div className="category-info">
                  <span className="category-name">
                    {category.icon && <span className="category-icon">{category.icon}</span>}
                    {category.name}
                  </span>
                  
                  {!category.isActive && (
                    <span className="inactive-badge">{t('admin.categories.inactive', 'Inactive')}</span>
                  )}
                </div>
                
                <div className="category-actions">
                  <button 
                    className="action-button view"
                    onClick={() => window.open(`/${category.slug}`, '_blank')}
                  >
                    <FiEye />
                  </button>
                  
                  <button 
                    className="action-button edit"
                    onClick={() => handleEditCategory(category)}
                  >
                    <FiEdit />
                  </button>
                  
                  <button 
                    className="action-button delete"
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={isDeleting}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              
              {hasSubcategories && isExpanded && (
                <CategoryTree categories={subcategories} level={level + 1} />
              )}
            </li>
          );
        })}
      </ul>
    );
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <LoadingSpinner />
          <p>{t('admin.categories.loading', 'Loading categories...')}</p>
        </div>
      </AdminLayout>
    );
  }
  
  // Show error state
  if (isError || !categoriesData) {
    return (
      <AdminLayout>
        <div className="admin-error">
          <FiAlertCircle size={48} />
          <h2>{t('admin.categories.error', 'Error loading categories')}</h2>
          <p>{error?.toString() || t('admin.categories.tryAgain', 'Please try again later')}</p>
          <button onClick={() => refetch()} className="retry-button">
            {t('admin.categories.retry', 'Retry')}
          </button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="admin-categories">
        <div className="page-header">
          <h1>{t('admin.categories.title', 'Category Management')}</h1>
          <button 
            className="add-button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <FiPlus />
            {t('admin.categories.addNew', 'Add New Category')}
          </button>
        </div>
        
        <div className="categories-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('admin.categories.search', 'Search categories...')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <FiSearch />
          </div>
          
          <button 
            className="expand-all-button"
            onClick={() => {
              // Create a new object with all categories expanded
              const allExpanded = filteredCategories.reduce((acc, category) => {
                acc[category.id] = true;
                return acc;
              }, {} as {[key: string]: boolean});
              
              setExpandedCategories(allExpanded);
            }}
          >
            {t('admin.categories.expandAll', 'Expand All')}
          </button>
          
          <button 
            className="collapse-all-button"
            onClick={() => setExpandedCategories({})}
          >
            {t('admin.categories.collapseAll', 'Collapse All')}
          </button>
        </div>
        
        <div className="categories-container">
          {rootCategories.length > 0 ? (
            <CategoryTree categories={rootCategories} />
          ) : (
            <div className="empty-state">
              <FiGrid size={36} />
              <p>{t('admin.categories.noCategories', 'No categories found. Create a new category to get started.')}</p>
            </div>
          )}
        </div>
        
        {showForm && (
          <div className="category-form-container">
            <div className="form-overlay" onClick={resetForm}></div>
            <div className="category-form">
              <h2>
                {editingCategoryId
                  ? t('admin.categories.editCategory', 'Edit Category')
                  : t('admin.categories.newCategory', 'New Category')}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">{t('admin.categories.name', 'Name')}*</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="slug">{t('admin.categories.slug', 'Slug')}*</label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">{t('admin.categories.description', 'Description')}</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="parentId">{t('admin.categories.parent', 'Parent Category')}</label>
                  <select
                    id="parentId"
                    name="parentId"
                    value={formData.parentId || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">{t('admin.categories.noParent', 'No Parent (Root Category)')}</option>
                    {categoriesData.map(category => (
                      // Prevent a category from being its own parent
                      editingCategoryId !== category.id && (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      )
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>{t('admin.categories.iconUpload', 'Category Icon')}</label>
                  
                  <div className="icon-upload-container">
                    <div className="icon-preview">
                      {formData.iconPreview ? (
                        <img 
                          src={formData.iconPreview} 
                          alt="Category icon preview" 
                          className="icon-preview-image"
                        />
                      ) : (
                        <div className="icon-placeholder">
                          <FiGrid size={24} />
                        </div>
                      )}
                    </div>
                    
                    <div className="icon-upload-controls">
                      <input
                        type="file"
                        id="icon-file"
                        accept="image/*"
                        onChange={handleIconChange}
                        className="icon-file-input"
                      />
                      <label htmlFor="icon-file" className="icon-upload-button">
                        {t('admin.categories.uploadIcon', 'Upload Icon')}
                      </label>
                      
                      {formData.iconPreview && (
                        <button
                          type="button"
                          className="icon-remove-button"
                          onClick={() => setFormData({
                            ...formData,
                            iconFile: null,
                            iconPreview: null,
                            icon: ''
                          })}
                        >
                          {t('admin.categories.removeIcon', 'Remove')}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {uploadStatus.uploading && (
                    <div className="upload-progress">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${uploadStatus.progress}%` }}
                      ></div>
                      <span className="progress-text">{uploadStatus.progress}%</span>
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="icon">{t('admin.categories.iconCode', 'Icon Code (optional)')}</label>
                  <input
                    type="text"
                    id="icon"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    placeholder="e.g. FiHome or URL to icon"
                  />
                  <small className="help-text">
                    {t('admin.categories.iconHelp', 'Enter an icon name from React Icons or use the uploader above')}
                  </small>
                </div>
                
                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="isActive">{t('admin.categories.active', 'Active')}</label>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={resetForm}
                  >
                    {t('admin.categories.cancel', 'Cancel')}
                  </button>
                  
                  <button 
                    type="submit"
                    className="save-button"
                    disabled={isCreating || isUpdating || uploadStatus.uploading}
                  >
                    {isCreating || isUpdating || uploadStatus.uploading ? (
                      <div className="saving-spinner">
                        <LoadingSpinner />
                        <span>{uploadStatus.uploading ? t('admin.categories.uploading', 'Uploading...') : t('admin.categories.saving', 'Saving...')}</span>
                      </div>
                    ) : (
                      <>
                        <FiCheck />
                        {t('admin.categories.save', 'Save Category')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CategoryManagement; 