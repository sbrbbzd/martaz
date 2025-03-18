import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import ListingCard from '../../components/ListingCard';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { useGetListingsQuery, useGetCategoriesQuery, Listing } from '../../services/api';
import { selectAuthUser } from '../../store/slices/authSlice';
import { isUserAdmin } from '../../utils/auth';
import ImportDialog from '../../components/ImportDialog';
import Button from '../../components/common/Button';
import { FiDownload } from 'react-icons/fi';
import './styles.scss';

// Skeleton component for loading state
const ListingCardSkeleton = () => (
  <div className="listings-page__skeleton">
    <div className="listings-page__skeleton-image"></div>
    <div className="listings-page__skeleton-content">
      <div className="listings-page__skeleton-title"></div>
      <div className="listings-page__skeleton-price"></div>
      <div className="listings-page__skeleton-meta"></div>
    </div>
  </div>
);

const ListingsPage: React.FC = () => {
  const locationHook = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Extract category slug from URL params - works for both /categories/:categorySlug and /:categorySlug routes
  const { categorySlug: urlCategorySlug } = useParams<{ categorySlug?: string }>();
  
  const filterModalRef = useRef<HTMLDivElement>(null);
  
  // Parse query parameters
  const queryParams = new URLSearchParams(locationHook.search);
  const initialPage = parseInt(queryParams.get('page') || '1', 10);
  const initialLimit = parseInt(queryParams.get('limit') || '12', 10);
  const initialSort = queryParams.get('sort') || 'createdAt';
  const initialOrder = queryParams.get('order') || 'DESC';
  const initialMinPrice = queryParams.get('minPrice') || '';
  const initialMaxPrice = queryParams.get('maxPrice') || '';
  const initialCondition = queryParams.get('condition') || '';
  const initialLocation = queryParams.get('location') || '';
  const initialSearch = queryParams.get('search') || '';
  const initialViewMode = localStorage.getItem('listingsViewMode') || 'grid';
  
  // State
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [sort, setSort] = useState(initialSort);
  const [order, setOrder] = useState(initialOrder);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [condition, setCondition] = useState(initialCondition);
  const [locationFilter, setLocationFilter] = useState(initialLocation);
  const [search, setSearch] = useState(initialSearch);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(urlCategorySlug || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode as 'grid' | 'list');
  
  // State for search input and debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Create a memoized query object to prevent unnecessary API calls
  const queryObject = useMemo(() => {
    // Map UI sort values to API sort values
    let sortField = 'createdAt';
    let orderDirection = 'DESC';
    
    switch(sort) {
      case 'newest':
        sortField = 'createdAt';
        orderDirection = 'DESC';
        break;
      case 'oldest':
        sortField = 'createdAt';
        orderDirection = 'ASC';
        break;
      case 'price-low':
        sortField = 'price';
        orderDirection = 'ASC';
        break;
      case 'price-high':
        sortField = 'price';
        orderDirection = 'DESC';
        break;
      case 'a-z':
        sortField = 'title';
        orderDirection = 'ASC';
        break;
      case 'z-a':
        sortField = 'title';
        orderDirection = 'DESC';
        break;
      default:
        sortField = 'createdAt';
        orderDirection = 'DESC';
    }
    
    return {
      page,
      limit,
      sort: sortField,
      order: orderDirection,
      category: selectedCategory,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      condition: condition || undefined,
      location: locationFilter || undefined,
      search: search || undefined
    };
  }, [page, limit, sort, order, selectedCategory, minPrice, maxPrice, condition, locationFilter, search]);

  // API queries
  const { 
    data: listingsData, 
    isLoading: isLoadingListings, 
    error: listingsError, 
    refetch: refetchListings 
  } = useGetListingsQuery(queryObject, {
    // Only refetch when arguments change, not on component mount
    refetchOnMountOrArgChange: false
  });
  
  const { 
    data: categoriesData,
    isLoading: isLoadingCategories
  } = useGetCategoriesQuery(undefined);
  
  // Get current category if categorySlug is provided
  const currentCategory = selectedCategory && categoriesData ? 
    categoriesData.find(cat => cat.slug === selectedCategory) || null : null;
  
  // Sync URL with filter state
  const syncUrlWithFilters = useCallback(() => {
    const params = new URLSearchParams();
    
    if (page > 1) params.set('page', page.toString());
    if (selectedCategory) params.set('category', selectedCategory);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (condition) params.set('condition', condition);
    if (locationFilter) params.set('location', locationFilter);
    if (search) params.set('search', search);
    if (sort !== 'createdAt') params.set('sort', sort);
    if (order !== 'desc') params.set('order', order);
    if (viewMode !== 'grid') params.set('viewMode', viewMode);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [page, selectedCategory, minPrice, maxPrice, condition, locationFilter, search, sort, order, viewMode]);
  
  // Load filter state from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const pageParam = params.get('page');
    if (pageParam) setPage(parseInt(pageParam, 10));
    
    const categoryParam = params.get('category');
    if (categoryParam) setSelectedCategory(categoryParam);
    
    const minPriceParam = params.get('minPrice');
    if (minPriceParam) setMinPrice(minPriceParam);
    
    const maxPriceParam = params.get('maxPrice');
    if (maxPriceParam) setMaxPrice(maxPriceParam);
    
    const conditionParam = params.get('condition');
    if (conditionParam) setCondition(conditionParam);
    
    const locationParam = params.get('location');
    if (locationParam) setLocationFilter(locationParam);
    
    const searchParam = params.get('search');
    if (searchParam) {
      setSearch(searchParam);
      setDebouncedSearch(searchParam);
    }
    
    const sortParam = params.get('sort');
    if (sortParam) setSort(sortParam);
    
    const orderParam = params.get('order');
    if (orderParam) setOrder(orderParam);
    
    const viewModeParam = params.get('viewMode');
    if (viewModeParam) setViewMode(viewModeParam as 'grid' | 'list');
  }, []);
  
  // Update URL when filters change - but debounce it
  useEffect(() => {
    const timer = setTimeout(() => {
      syncUrlWithFilters();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [syncUrlWithFilters]);
  
  // Reset page when filters change - no need to add refetchListings here
  useEffect(() => {
    setPage(1);
  }, [minPrice, maxPrice, condition, locationFilter, search, selectedCategory]);
  
  // Update selectedCategory when URL param changes, but only when URL actually changes
  useEffect(() => {
    console.log("URL category changed:", urlCategorySlug, "current selectedCategory:", selectedCategory);
    
    // Only update if URL param exists and is different from current state
    // This prevents clearing the category when URL doesn't have a category param
    if (urlCategorySlug && urlCategorySlug !== selectedCategory) {
      console.log("Updating category from URL param to:", urlCategorySlug);
      setSelectedCategory(urlCategorySlug);
      // Reset to page 1 when category changes from URL
      setPage(1);
      // Ensure we refetch with the new category
      setTimeout(() => {
        console.log("Refetching after URL category change to:", urlCategorySlug);
        refetchListings();
      }, 200);
    }
  }, [urlCategorySlug, selectedCategory, refetchListings]);
  
  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('listingsViewMode', viewMode);
  }, [viewMode]);

  // Close filter modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterModalRef.current && !filterModalRef.current.contains(event.target as Node)) {
        setFilterModalOpen(false);
      }
    };

    if (filterModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [filterModalOpen]);
  
  // Close filter modal on window resize if desktop size is reached
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992 && filterModalOpen) {
        setFilterModalOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [filterModalOpen]);
  
  // Handle pagination change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Handle filter change - consolidate the refetching
  const handleFilterChange = () => {
    // Reset to page 1 when filtering
    setPage(1);
    
    console.log('Filter changed:', {
      category: selectedCategory,
      minPrice,
      maxPrice,
      condition,
      location: locationFilter,
      search,
      sort
    });
    
    // Create a new query object with the current filter state to use for refetch
    const currentQueryObj = {
      page: 1,
      limit,
      sort: (() => {
        switch(sort) {
          case 'newest': return 'createdAt';
          case 'oldest': return 'createdAt';
          case 'price-low': return 'price';
          case 'price-high': return 'price';
          case 'a-z': return 'title';
          case 'z-a': return 'title';
          default: return 'createdAt';
        }
      })(),
      order: (() => {
        switch(sort) {
          case 'newest': return 'DESC';
          case 'oldest': return 'ASC';
          case 'price-low': return 'ASC';
          case 'price-high': return 'DESC';
          case 'a-z': return 'ASC';
          case 'z-a': return 'DESC';
          default: return 'DESC';
        }
      })(),
      category: selectedCategory,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      condition: condition || undefined,
      location: locationFilter || undefined,
      search: search || undefined
    };
    
    // Explicitly call refetch to ensure filters are applied
    setTimeout(() => {
      refetchListings();
    }, 50);
    
    // Close filter modal on mobile if open
    if (window.innerWidth < 992) {
      setFilterModalOpen(false);
    }
  };
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== debouncedSearch) {
        console.log("Debounced search updated to:", search);
        setDebouncedSearch(search);
        setPage(1);
        
        // Explicitly trigger a refetch with the new search term
        setTimeout(() => {
          console.log("Refetching with debounced search:", search);
          refetchListings();
        }, 50);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search, debouncedSearch, refetchListings]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Search input changed to:", e.target.value);
    setSearch(e.target.value);
  };
  
  // Get filter chips for active filters
  const getFilterChips = () => {
    const chips = [];
    
    // Category chip
    if (selectedCategory) {
      const categoryName = categoriesData?.find(cat => cat.slug === selectedCategory)?.name || selectedCategory;
      chips.push({
        id: 'category',
        label: `${t('listings.category')}: ${categoryName}`,
        onRemove: () => {
          // For root-level category URLs, navigate to /listings instead of clearing the category param
          if (locationHook.pathname === `/${selectedCategory}` || locationHook.pathname === `/categories/${selectedCategory}`) {
            navigate('/listings');
          } else {
            console.log("Removing category filter chip, was:", selectedCategory);
            setSelectedCategory('');
            // Directly refetch with a small delay
            setTimeout(() => {
              console.log("Refetching after category chip removal");
              refetchListings();
            }, 50);
          }
        }
      });
    }
    
    // Min price chip
    if (minPrice) {
      chips.push({
        id: 'minPrice',
        label: `${t('listings.minPrice')}: ${minPrice}`,
        onRemove: () => {
          setMinPrice('');
          setTimeout(() => handleFilterChange(), 10);
        }
      });
    }
    
    // Max price chip
    if (maxPrice) {
      chips.push({
        id: 'maxPrice',
        label: `${t('listings.maxPrice')}: ${maxPrice}`,
        onRemove: () => {
          setMaxPrice('');
          setTimeout(() => handleFilterChange(), 10);
        }
      });
    }
    
    // Condition chip
    if (condition) {
      chips.push({
        id: 'condition',
        label: `${t('listings.condition')}: ${t(`condition.${condition}`)}`,
        onRemove: () => {
          setCondition('');
          setTimeout(() => handleFilterChange(), 10);
        }
      });
    }
    
    // Location chip
    if (locationFilter) {
      chips.push({
        id: 'location',
        label: `${t('listings.location')}: ${locationFilter}`,
        onRemove: () => {
          setLocationFilter('');
          setTimeout(() => handleFilterChange(), 10);
        }
      });
    }
    
    // Search chip
    if (search) {
      chips.push({
        id: 'search',
        label: `${t('listings.search')}: ${search}`,
        onRemove: () => {
          console.log("Removing search chip, was:", search);
          setSearch('');
          setDebouncedSearch('');
          
          // Directly refetch after clearing search
          setTimeout(() => {
            console.log("Refetching after search removal");
            refetchListings();
          }, 50);
        }
      });
    }
    
    return chips;
  };
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search submitted:", debouncedSearch);
    setSearch(debouncedSearch);
    setPage(1);
    
    // Explicitly trigger a refetch with the search term
    setTimeout(() => {
      console.log("Refetching with search term:", debouncedSearch);
      refetchListings();
    }, 50);
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setCondition('');
    setLocationFilter('');
    setSearch('');
    setSort('newest');
    setOrder('DESC');
    setPage(1);
    
    // If we're in a category page, don't clear the category
    if (!urlCategorySlug) {
      setSelectedCategory('');
    }
    
    // Explicitly refetch to apply the cleared filters
    setTimeout(() => {
      refetchListings();
    }, 50);
  };
  
  // Toggle filter modal for mobile
  const toggleFilterModal = () => {
    setFilterModalOpen(!filterModalOpen);
  };
  
  // Toggle view mode
  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };
  
  // Construct page title
  const pageTitle = currentCategory
    ? t('listings.categoryTitle', { category: currentCategory.name })
    : search
    ? t('listings.searchTitle', { query: search })
    : t('listings.pageTitle');
  
  // Check if any filters are active
  const hasActiveFilters = !!(minPrice || maxPrice || condition || locationFilter || 
    (selectedCategory && !urlCategorySlug) || 
    (sort !== 'createdAt' || order !== 'DESC'));
  
  // Count total active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (minPrice || maxPrice) count++;
    if (condition) count++;
    if (locationFilter) count++;
    if (selectedCategory && !urlCategorySlug) count++;
    if (sort !== 'createdAt' || order !== 'DESC') count++;
    return count;
  };
  
  // Add smooth scroll behavior to the entire page
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);
  
  // Inside the component, add the state for dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Get the current user from auth state
  const currentUser = useSelector(selectAuthUser);
  
  // Check if user is admin
  const isAdmin = useMemo(() => currentUser && isUserAdmin(currentUser), [currentUser]);
  
  return (
    <div className="listings-page">
      <Helmet>
        <title>
          {currentCategory ? 
            `${currentCategory.name} - ${t('app.name', 'Mart.az')}` : 
            t('listings.browseCatalog', 'Browse Listings')}
        </title>
        <meta name="description" content={
          currentCategory ? 
          `${t('seo.browseCategory', 'Browse listings in')} ${currentCategory.name}` : 
          t('seo.browseAllListings', 'Browse all listings available for sale')
        } />
      </Helmet>
      
      <div className="listings-page__banner">
        <div className="listings-page__container">
          <div className="listings-page__banner-content">
            
            <form className="listings-page__search-form" onSubmit={handleSearchSubmit}>
              <div className="listings-page__search-input">
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder={t('listings.searchPlaceholder')}
                  aria-label={t('listings.searchPlaceholder')}
                />
                <button type="submit" aria-label={t('common.search')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <div className="listings-page__container">
        <div className="listings-page__filter-bar">
          <div className="listings-page__filter-left">
            <button 
              className="listings-page__filter-button"
              onClick={toggleFilterModal}
              aria-expanded={filterModalOpen}
              aria-controls="filter-panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <span>{t('listings.filters')}</span>
              {hasActiveFilters && (
                <span className="listings-page__filter-badge">{getActiveFilterCount()}</span>
              )}
            </button>
          </div>
        </div>
        
        <div className="listings-page__content">
          {/* Filter Panel - shown on desktop or when modal is open */}
          <div 
            className={`listings-page__filter-panel ${filterModalOpen ? 'is-open' : ''}`} 
            id="filter-panel"
            ref={filterModalRef}
            aria-hidden={!filterModalOpen}
          >
            <div className="listings-page__filter-header">
              <h2>{t('listings.filters')}</h2>
              <button 
                className="listings-page__filter-close"
                onClick={() => setFilterModalOpen(false)}
                aria-label={t('common.closeMenu')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="listings-page__filter-body">
              {/* Desktop Filters */}
              <div className="listings-page__desktop-filters">
                <div className="listings-page__filter-controls">
                  {/* Category filter */}
                  {categoriesData && categoriesData.length > 0 && (
                    <div className="listings-page__filter-item">
                      <select
                        value={selectedCategory}
                        onChange={(e) => {
                          console.log("Category changed to:", e.target.value);
                          const newCategory = e.target.value;
                          // Update the category in state
                          setSelectedCategory(newCategory);
                          // Reset page to 1
                          setPage(1);
                          
                          // Update the URL with the new category
                          // This prevents URL parameter useEffect from resetting our selection
                          const params = new URLSearchParams(window.location.search);
                          if (newCategory) {
                            params.set('category', newCategory);
                          } else {
                            params.delete('category');
                          }
                          const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
                          window.history.replaceState({}, '', newUrl);
                          
                          // Force immediate update and refetch
                          setTimeout(() => {
                            console.log("About to refetch with category:", newCategory);
                            refetchListings();
                          }, 50);
                        }}
                        className="listings-page__filter-select"
                        aria-label={t('listings.categories')}
                      >
                        <option value="">{t('listings.allCategories')}</option>
                        {categoriesData.map(category => (
                          <option key={category.id} value={category.slug}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Price range filter */}
                  <div className="listings-page__filter-item listings-page__filter-price">
                    <input
                      type="number"
                      placeholder={t('listings.minPrice')}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      onBlur={handleFilterChange}
                      className="listings-page__filter-input"
                      min="0"
                      aria-label={t('listings.minPrice')}
                    />
                    <span className="listings-page__price-separator">-</span>
                    <input
                      type="number"
                      placeholder={t('listings.maxPrice')}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      onBlur={handleFilterChange}
                      className="listings-page__filter-input"
                      min="0"
                      aria-label={t('listings.maxPrice')}
                    />
                  </div>
                  
                  {/* Condition filter */}
                  <div className="listings-page__filter-item">
                    <select
                      value={condition}
                      onChange={(e) => {
                        setCondition(e.target.value);
                        handleFilterChange();
                      }}
                      className="listings-page__filter-select"
                      aria-label={t('listings.condition')}
                    >
                      <option value="">{t('listings.anyCondition')}</option>
                      <option value="new">{t('condition.new')}</option>
                      <option value="like-new">{t('condition.like-new')}</option>
                      <option value="good">{t('condition.good')}</option>
                      <option value="fair">{t('condition.fair')}</option>
                      <option value="poor">{t('condition.poor')}</option>
                    </select>
                  </div>
                  
                  {/* Location filter */}
                  <div className="listings-page__filter-item">
                    <input
                      type="text"
                      placeholder={t('listings.location')}
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      onBlur={handleFilterChange}
                      className="listings-page__filter-input"
                      aria-label={t('listings.location')}
                    />
                  </div>
                  
                  {/* Filter action buttons */}
                  <div className="listings-page__filter-actions-inline">
                    <button 
                      className="listings-page__filter-apply-inline" 
                      onClick={handleFilterChange}
                    >
                      {t('listings.apply')}
                    </button>
                    
                    {hasActiveFilters && (
                      <button 
                        className="listings-page__filter-clear-inline" 
                        onClick={handleClearFilters}
                      >
                        {t('listings.clear')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Active Filter Chips */}
              {hasActiveFilters && (
                <div className="listings-page__filter-chips">
                  {getFilterChips().map(chip => (
                    <div key={chip.id} className="listings-page__filter-chip">
                      <span className="listings-page__filter-chip-label">{chip.label}</span>
                      <button 
                        className="listings-page__filter-chip-remove"
                        onClick={() => {
                          chip.onRemove();
                          setPage(1);
                        }}
                        aria-label={`${t('listings.remove')} ${chip.label}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    className="listings-page__filter-chip listings-page__filter-clear-all"
                    onClick={handleClearFilters}
                  >
                    <span>{t('listings.clearAll')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Main content area */}
          <div className="listings-page__results">
            <div className="listings-page__results-header">
              <div className="listings-page__results-count">
                {isLoadingListings ? (
                  <>{t('listings.loading', 'Loading listings...')}</>
                ) : listingsError ? (
                  <>{t('listings.error', 'Error loading listings')}</>
                ) : listingsData?.data?.listings ? (
                  <>
                    {t('listings.resultsCount', '{{count}} listings found', { 
                      count: listingsData.data.total || listingsData.data.listings.length 
                    })}
                  </>
                ) : (
                  <>{t('listings.noResults', 'No listings found')}</>
                )}
              </div>
              
              <div className="listings-page__results-controls">
                <div className="listings-page__sort-section">
                  <label htmlFor="sort">{t('listings.sortBy', 'Sort by')}:</label>
                  <select
                    id="sort"
                    className="listings-page__sort-select"
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      handleFilterChange();
                    }}
                  >
                    <option value="newest">{t('listings.sortNewest', 'Newest')}</option>
                    <option value="oldest">{t('listings.sortOldest', 'Oldest')}</option>
                    <option value="price-low">{t('listings.sortPriceLow', 'Price: Low to High')}</option>
                    <option value="price-high">{t('listings.sortPriceHigh', 'Price: High to Low')}</option>
                    <option value="a-z">{t('listings.sortAZ', 'A-Z')}</option>
                    <option value="z-a">{t('listings.sortZA', 'Z-A')}</option>
                  </select>
                </div>
                
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setImportDialogOpen(true)}
                    className="listings-page__import-button"
                  >
                    <FiDownload size={16} />
                    {t('listings.import', 'Import')}
                  </Button>
                )}
                
                <div className="listings-page__view-options">
                  <button
                    className={`listings-page__view-button ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => toggleViewMode('grid')}
                    aria-label={t('listings.gridView')}
                    aria-pressed={viewMode === 'grid'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                  </button>
                  <button
                    className={`listings-page__view-button ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => toggleViewMode('list')}
                    aria-label={t('listings.listView')}
                    aria-pressed={viewMode === 'list'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="listings-page__results-list">
              {isLoadingListings ? (
                <div className={`listings-page__${viewMode}`}>
                  {Array(8).fill(0).map((_, index) => (
                    <ListingCardSkeleton key={index} />
                  ))}
                </div>
              ) : listingsError ? (
                <ErrorMessage message={t('listings.error')} />
              ) : listingsData?.data?.listings && listingsData.data.listings.length > 0 ? (
                <div className={`listings-page__${viewMode}`}>
                  {listingsData.data.listings.map((listing: Listing) => (
                    <ListingCard
                      key={listing.id}
                      id={listing.id}
                      title={listing.title}
                      slug={listing.slug}
                      price={listing.price}
                      currency={listing.currency}
                      location={listing.location}
                      condition={listing.condition}
                      featuredImage={listing.featuredImage}
                      images={listing.images}
                      createdAt={listing.createdAt}
                      isPromoted={listing.isPromoted}
                      isFeatured={listing.isFeatured}
                      categoryName={listing.category?.name}
                      categorySlug={listing.category?.slug}
                      userName={listing.user?.firstName}
                      userImage={listing.user?.profileImage}
                    />
                  ))}
                </div>
              ) : (
                <div className="listings-page__empty">
                  <div className="listings-page__empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  <h2 className="listings-page__empty-title">{t('listings.noResults')}</h2>
                  <p className="listings-page__empty-text">{t('listings.tryDifferentFilters')}</p>
                  
                  {hasActiveFilters && (
                    <button 
                      className="listings-page__empty-clear" 
                      onClick={handleClearFilters}
                    >
                      {t('listings.clearFilters')}
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {listingsData?.data?.totalPages && listingsData.data.totalPages > 1 && (
              <div className="listings-page__pagination">
                <Pagination
                  currentPage={page}
                  totalPages={listingsData.data.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile filter */}
      {filterModalOpen && (
        <div 
          className="listings-page__overlay" 
          onClick={() => setFilterModalOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      
      {isAdmin && <ImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} />}
    </div>
  );
};

export default ListingsPage;