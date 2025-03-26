import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { RootState } from '../../../store';
import AdminLayout from '../../../components/Admin/AdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { fetchWithAuth } from '../../../utils/fetchWithAuth';
import './styles.scss';

// Define interfaces for SEO settings
interface SeoSettings {
  id: string;
  pageType: string;
  pageIdentifier: string | null;
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  canonical: string | null;
  robotsDirectives: string | null;
  structuredData: Record<string, any> | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface PageType {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface StaticPageOption {
  id: string;
  name: string;
  path: string;
}

interface AvailablePagesData {
  pageTypes: PageType[];
  categories: CategoryOption[];
  staticPages: StaticPageOption[];
}

interface SeoFormData {
  pageType: string;
  pageIdentifier: string | null;
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  canonical: string | null;
  robotsDirectives: string | null;
  structuredData: string | null;
  priority: number;
}

const initialFormData: SeoFormData = {
  pageType: 'global',
  pageIdentifier: null,
  title: '',
  description: '',
  keywords: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  twitterTitle: '',
  twitterDescription: '',
  twitterImage: '',
  canonical: '',
  robotsDirectives: '',
  structuredData: null,
  priority: 0
};

const SEOManagement: React.FC = () => {
  const { user, loading: userLoading } = useSelector((state: RootState) => state.auth);
  const [seoSettings, setSeoSettings] = useState<SeoSettings[]>([]);
  const [availablePages, setAvailablePages] = useState<AvailablePagesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState<SeoFormData>(initialFormData);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('general');

  // Fetch SEO settings and available pages on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Make API calls to fetch SEO data
        console.log('Fetching SEO data from API endpoints...');
        const [settingsResponse, pagesResponse] = await Promise.all([
          fetchWithAuth('/seo'),
          fetchWithAuth('/seo/available-pages')
        ]);

        // Process SEO settings response
        if (settingsResponse && settingsResponse.success && settingsResponse.data) {
          console.log('Successfully fetched SEO settings from API:', settingsResponse.data.length, 'settings found');
          setSeoSettings(settingsResponse.data);
        } else {
          console.error('Failed to fetch SEO settings:', settingsResponse?.message || 'Unknown error');
          toast.error('Failed to load SEO settings');
          setSeoSettings([]);
        }
        
        // Process available pages response
        if (pagesResponse && pagesResponse.success && pagesResponse.data) {
          console.log('Successfully fetched available pages from API');
          setAvailablePages(pagesResponse.data);
        } else {
          console.error('Failed to fetch available pages:', pagesResponse?.message || 'Unknown error');
          toast.error('Failed to load page options');
          setAvailablePages({
            pageTypes: [],
            categories: [],
            staticPages: []
          });
        }
      } catch (error) {
        console.error('Error fetching SEO data:', error);
        toast.error('Failed to load SEO data');
        setSeoSettings([]);
        setAvailablePages({
          pageTypes: [],
          categories: [],
          staticPages: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle page type change
  const handlePageTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      pageType: value,
      pageIdentifier: null
    }));
  };

  // Handle structured data change
  const handleStructuredDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      // Validate JSON
      const value = e.target.value;
      if (value.trim() === '') {
        setFormData(prev => ({
          ...prev,
          structuredData: null
        }));
      } else {
        JSON.parse(value);
        setFormData(prev => ({
          ...prev,
          structuredData: value
        }));
      }
    } catch (error) {
      // Don't update if invalid JSON
      toast.error('Invalid JSON format for structured data');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Prepare the data
      const dataToSubmit = {
        ...formData,
        structuredData: formData.structuredData ? JSON.parse(formData.structuredData as string) : null
      };
      
      let response;
      
      if (isEditing && currentId) {
        // Update existing SEO setting
        response = await fetchWithAuth(`/seo/${currentId}`, 'PUT', dataToSubmit);
      } else {
        // Create new SEO setting
        response = await fetchWithAuth('/seo', 'POST', dataToSubmit);
      }
      
      if (response.success) {
        toast.success(isEditing ? 'SEO setting updated successfully' : 'SEO setting created successfully');
        
        // Refresh the SEO settings list
        const settingsResponse = await fetchWithAuth('/seo');
        if (settingsResponse.success) {
          setSeoSettings(settingsResponse.data);
        }
        
        // Reset form
        setIsEditing(false);
        setCurrentId(null);
        setFormData(initialFormData);
        setShowForm(false);
      } else {
        toast.error(response.message || 'Failed to save SEO setting');
      }
    } catch (error) {
      console.error('Error saving SEO setting:', error);
      toast.error('Failed to save SEO setting');
    } finally {
      setLoading(false);
    }
  };

  // Handle editing a SEO setting
  const handleEdit = async (id: string) => {
    try {
      setLoading(true);
      
      // Fetch the setting from the API
      const response = await fetchWithAuth(`/seo/${id}`);
      
      if (response.success && response.data) {
        const settingToEdit = response.data;
        
        setFormData({
          pageType: settingToEdit.pageType,
          pageIdentifier: settingToEdit.pageIdentifier,
          title: settingToEdit.title,
          description: settingToEdit.description,
          keywords: settingToEdit.keywords,
          ogTitle: settingToEdit.ogTitle,
          ogDescription: settingToEdit.ogDescription,
          ogImage: settingToEdit.ogImage,
          twitterTitle: settingToEdit.twitterTitle,
          twitterDescription: settingToEdit.twitterDescription,
          twitterImage: settingToEdit.twitterImage,
          canonical: settingToEdit.canonical,
          robotsDirectives: settingToEdit.robotsDirectives,
          structuredData: settingToEdit.structuredData ? JSON.stringify(settingToEdit.structuredData, null, 2) : null,
          priority: settingToEdit.priority
        });
        
        setIsEditing(true);
        setCurrentId(id);
        setShowForm(true);
      } else {
        toast.error(response.message || 'Failed to fetch SEO setting details');
      }
    } catch (error) {
      console.error('Error fetching SEO setting details:', error);
      toast.error('An error occurred while fetching SEO setting details');
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a SEO setting
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this SEO setting?')) {
      try {
        setLoading(true);
        
        const response = await fetchWithAuth(`/seo/${id}`, 'DELETE');
        
        if (response.success) {
          toast.success('SEO setting deleted successfully');
          
          // Remove the deleted setting from the state
          setSeoSettings(prev => prev.filter(setting => setting.id !== id));
        } else {
          toast.error(response.message || 'Failed to delete SEO setting');
        }
      } catch (error) {
        console.error('Error deleting SEO setting:', error);
        toast.error('An error occurred while deleting SEO setting');
      } finally {
        setLoading(false);
      }
    }
  };

  // Get page identifier options based on selected page type
  const getPageIdentifierOptions = () => {
    if (!availablePages) return [];
    
    switch (formData.pageType) {
      case 'category':
        return availablePages.categories;
      case 'static':
        return availablePages.staticPages;
      default:
        return [];
    }
  };

  // Get page identifier display text
  const getPageIdentifierText = (setting: SeoSettings) => {
    if (!setting.pageIdentifier) return 'Default';
    
    if (setting.pageType === 'category' && availablePages) {
      const category = availablePages.categories.find(c => c.id === setting.pageIdentifier);
      return category ? category.name : setting.pageIdentifier;
    } else if (setting.pageType === 'static' && availablePages) {
      const staticPage = availablePages.staticPages.find(p => p.id === setting.pageIdentifier);
      return staticPage ? staticPage.name : setting.pageIdentifier;
    }
    
    return setting.pageIdentifier;
  };

  // Filter SEO settings based on search term
  const filteredSettings = seoSettings.filter(setting => {
    const pageTypeName = availablePages?.pageTypes.find(pt => pt.id === setting.pageType)?.name || setting.pageType;
    const pageIdentifierText = getPageIdentifierText(setting);
    
    return (
      pageTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pageIdentifierText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (setting.title && setting.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (setting.description && setting.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setCurrentId(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (userLoading) {
    return <LoadingSpinner />;
  }

  return (
    <AdminLayout>
      <div className="seo-management">
        <div className="header">
          <h1>SEO Management</h1>
          <div className="actions">
            <div className="search">
              <FiSearch />
              <input
                type="text"
                placeholder="Search SEO settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className="btn-add"
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
            >
              {showForm ? 'Cancel' : <><FiPlus /> Add New SEO Setting</>}
            </button>
          </div>
        </div>

        {loading && <LoadingSpinner />}

        {showForm && (
          <div className="form-container">
            <h2>{isEditing ? 'Edit SEO Setting' : 'Add New SEO Setting'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="tabs">
                <button 
                  type="button"
                  className={activeTab === 'general' ? 'active' : ''}
                  onClick={() => setActiveTab('general')}
                >
                  General
                </button>
                <button 
                  type="button"
                  className={activeTab === 'social' ? 'active' : ''}
                  onClick={() => setActiveTab('social')}
                >
                  Social Media
                </button>
                <button 
                  type="button"
                  className={activeTab === 'advanced' ? 'active' : ''}
                  onClick={() => setActiveTab('advanced')}
                >
                  Advanced
                </button>
              </div>
              
              {/* Page settings */}
              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="pageType">Page Type</label>
                  <select
                    id="pageType"
                    name="pageType"
                    value={formData.pageType}
                    onChange={handlePageTypeChange}
                    required
                  >
                    {availablePages?.pageTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                {['category', 'static'].includes(formData.pageType) && (
                  <div className="form-group">
                    <label htmlFor="pageIdentifier">Specific Page</label>
                    <select
                      id="pageIdentifier"
                      name="pageIdentifier"
                      value={formData.pageIdentifier || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Default for all {formData.pageType} pages</option>
                      {getPageIdentifierOptions().map((option: any) => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {activeTab === 'general' && (
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="title">
                      Meta Title
                      <span className="character-count">{formData.title?.length || 0}/70</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      maxLength={70}
                      value={formData.title || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">
                      Meta Description
                      <span className="character-count">{formData.description?.length || 0}/160</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      maxLength={160}
                      value={formData.description || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="keywords">
                      Keywords (comma separated)
                    </label>
                    <input
                      type="text"
                      id="keywords"
                      name="keywords"
                      value={formData.keywords || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="priority">Priority (0-100)</label>
                    <input
                      type="number"
                      id="priority"
                      name="priority"
                      min={0}
                      max={100}
                      value={formData.priority}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="form-section">
                  <div className="social-section">
                    <h3>Open Graph (Facebook, LinkedIn)</h3>
                    
                    <div className="form-group">
                      <label htmlFor="ogTitle">
                        OG Title
                        <span className="character-count">{formData.ogTitle?.length || 0}/70</span>
                      </label>
                      <input
                        type="text"
                        id="ogTitle"
                        name="ogTitle"
                        maxLength={70}
                        value={formData.ogTitle || ''}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="ogDescription">
                        OG Description
                        <span className="character-count">{formData.ogDescription?.length || 0}/200</span>
                      </label>
                      <textarea
                        id="ogDescription"
                        name="ogDescription"
                        maxLength={200}
                        value={formData.ogDescription || ''}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="ogImage">OG Image URL</label>
                      <input
                        type="url"
                        id="ogImage"
                        name="ogImage"
                        value={formData.ogImage || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="social-section">
                    <h3>Twitter Card</h3>
                    
                    <div className="form-group">
                      <label htmlFor="twitterTitle">
                        Twitter Title
                        <span className="character-count">{formData.twitterTitle?.length || 0}/70</span>
                      </label>
                      <input
                        type="text"
                        id="twitterTitle"
                        name="twitterTitle"
                        maxLength={70}
                        value={formData.twitterTitle || ''}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="twitterDescription">
                        Twitter Description
                        <span className="character-count">{formData.twitterDescription?.length || 0}/200</span>
                      </label>
                      <textarea
                        id="twitterDescription"
                        name="twitterDescription"
                        maxLength={200}
                        value={formData.twitterDescription || ''}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="twitterImage">Twitter Image URL</label>
                      <input
                        type="url"
                        id="twitterImage"
                        name="twitterImage"
                        value={formData.twitterImage || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="canonical">Canonical URL</label>
                    <input
                      type="url"
                      id="canonical"
                      name="canonical"
                      value={formData.canonical || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="robotsDirectives">Robots Directives</label>
                    <input
                      type="text"
                      id="robotsDirectives"
                      name="robotsDirectives"
                      placeholder="e.g., index, follow"
                      value={formData.robotsDirectives || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="structuredData">
                      Structured Data (JSON-LD)
                    </label>
                    <textarea
                      id="structuredData"
                      name="structuredData"
                      placeholder="{}"
                      value={formData.structuredData || ''}
                      onChange={handleStructuredDataChange}
                      rows={6}
                    />
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {isEditing ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="seo-settings-list">
          <table>
            <thead>
              <tr>
                <th>Page Type</th>
                <th>Specific Page</th>
                <th>Title</th>
                <th>Description</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data">
                    {searchTerm ? 'No settings match your search' : 'No SEO settings found'}
                  </td>
                </tr>
              ) : (
                filteredSettings.map(setting => (
                  <tr key={setting.id}>
                    <td>
                      {availablePages?.pageTypes.find(pt => pt.id === setting.pageType)?.name || setting.pageType}
                    </td>
                    <td>{getPageIdentifierText(setting)}</td>
                    <td className="truncate-text" title={setting.title || ''}>
                      {setting.title || '—'}
                    </td>
                    <td className="truncate-text" title={setting.description || ''}>
                      {setting.description || '—'}
                    </td>
                    <td>{formatDate(setting.updatedAt)}</td>
                    <td className="actions">
                      <button 
                        className="btn-edit" 
                        onClick={() => handleEdit(setting.id)}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(setting.id)}
                        title="Delete"
                        disabled={setting.pageType === 'global' && !setting.pageIdentifier}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SEOManagement; 