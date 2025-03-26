import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import { FiFilter, FiX } from 'react-icons/fi';
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

// Add custom styles to move filter-chips to a new row
const customStyles = `
  .desktop-filters {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  
  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
    width: 100%;
  }
  
  .filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 4px 10px;
    font-size: 13px;
    color: #374151;
  }
  
  .filter-chip-label {
    font-weight: 500;
  }
  
  .filter-chip-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    background: none;
    border: none;
    padding: 0;
    color: #6b7280;
    cursor: pointer;
  }
  
  .filter-chip-remove:hover {
    color: #1f2937;
  }
  
  .filter-chip-remove svg {
    width: 14px;
    height: 14px;
  }
`;

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

// Create a state for query object
type QueryObjectType = {
  page: number;
  limit: number;
  sort: string;
  order: string;
  category: string;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  condition: string | undefined;
  location: string | undefined;
  search: string | undefined;
  status: string;
  promoted?: boolean;
};

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
  const initialLimit = parseInt(queryParams.get('limit') || '30', 10);
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
  
  // Add state for mobile filter panel
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  // Add refs for mobile filter panel and backdrop
  const mobileFilterPanelRef = useRef<HTMLDivElement>(null);
  
  // Create queryObject state inside the component
  const [queryObject, setQueryObject] = useState<QueryObjectType>({
    page: initialPage,
    limit: initialLimit,
    sort: initialSort,
    order: initialOrder,
    category: urlCategorySlug || '',
    minPrice: initialMinPrice ? parseInt(initialMinPrice) : undefined,
    maxPrice: initialMaxPrice ? parseInt(initialMaxPrice) : undefined,
    condition: initialCondition || undefined,
    location: initialLocation || undefined,
    search: initialSearch || undefined,
    status: 'active'
  });
  
  // API queries
  const { 
    data: listingsData, 
    isLoading: isLoadingListings, 
    error: listingsError, 
    refetch: refetchListings 
  } = useGetListingsQuery(queryObject, {
    // Allow refetching when component mounts
    refetchOnMountOrArgChange: true
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
    if (order !== 'DESC') params.set('order', order);
    if (viewMode !== 'grid') params.set('viewMode', viewMode);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [page, selectedCategory, minPrice, maxPrice, condition, locationFilter, search, sort, order, viewMode]);
  
  // Extract query parameters and set initial state
  useEffect(() => {
    const params = new URLSearchParams(locationHook.search);
    
    // Get sorting parameter
    const sortParam = params.get('sort') || 'newest';
    
    // Map UI sort values to API sort values
    let sortField = 'createdAt';
    let orderDirection = 'DESC';
    
    switch(sortParam) {
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
    
    // Check for promoted parameter in URL
    const promotedParam = params.get('promoted');
    
    // Update the query object with current state values
    setQueryObject(prevState => {
      const updatedState = {
        ...prevState,
        page,
        limit,
        sort: sortField,
        order: orderDirection,
        category: selectedCategory,
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        condition: condition || undefined,
        location: locationFilter || undefined,
        search: search || undefined,
        status: 'active', // Explicitly request active listings only
      };
      
      // Only add promoted if it's true
      if (promotedParam === 'true') {
        updatedState.promoted = true;
      } else {
        // Remove the promoted property if it exists but should not
        if ('promoted' in updatedState) {
          delete updatedState.promoted;
        }
      }
      
      return updatedState;
    });
  }, [page, limit, selectedCategory, minPrice, maxPrice, condition, locationFilter, search, locationHook.search]);
  
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
    if (orderParam) {
      try {
        setOrder(orderParam.toUpperCase());
      } catch (error) {
        console.error('Error processing order parameter:', error);
        setOrder('DESC'); // Default to DESC if there's an error
      }
    }
    
    const viewModeParam = params.get('viewMode');
    if (viewModeParam) setViewMode(viewModeParam as 'grid' | 'list');
    
    // Force a data fetch after loading URL parameters
    setTimeout(() => {
      console.log("Initial data fetch triggered");
      refetchListings();
    }, 300);
  }, [refetchListings]);
  
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
    if (urlCategorySlug && urlCategorySlug !== selectedCategory) {
      setSelectedCategory(urlCategorySlug);
      // Reset to page 1 when category changes from URL
      setPage(1);
      // Ensure we refetch with the new category
      setTimeout(() => {
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
  
  // Toggle mobile filter panel
  const toggleMobileFilter = () => {
    setMobileFilterOpen(prev => !prev);
    
    // If opening the filter, prevent body scroll
    if (!mobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };
  
  // Close mobile filter panel
  const closeMobileFilter = () => {
    setMobileFilterOpen(false);
    document.body.style.overflow = '';
  };
  
  // Apply filters from mobile panel
  const applyMobileFilters = () => {
    handleFilterChange();
    closeMobileFilter();
  };
  
  // Clear filters from mobile panel
  const clearMobileFilters = () => {
    handleClearFilters();
    closeMobileFilter();
  };
  
  // Add click outside handler for mobile filter panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileFilterPanelRef.current && 
        !mobileFilterPanelRef.current.contains(event.target as Node) &&
        mobileFilterOpen
      ) {
        closeMobileFilter();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileFilterOpen]);
  
  // Handle filter change - consolidate the refetching
  const handleFilterChange = () => {
    // Reset to page 1 when filtering
    setPage(1);
    
    // Explicitly call refetch to ensure filters are applied
    setTimeout(() => {
      refetchListings();
    }, 50);
  };
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== debouncedSearch) {
        setDebouncedSearch(search);
        setPage(1);
        
        // Explicitly trigger a refetch with the new search term
        setTimeout(() => {
          refetchListings();
        }, 50);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search, debouncedSearch, refetchListings]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  
  // Add focus management for filter modal
  useEffect(() => {
    // Skip if not on mobile
    if (window.innerWidth >= 992) {
      return () => {}; // Return empty cleanup function for this code path
    }
    
    // Reference to the active element before opening modal
    const activeElement = document.activeElement;
    
    if (filterModalOpen) {
      // Focus the first focusable element in the filter
      const closeButton = filterModalRef.current?.querySelector('.listings-page__filter-close');
      if (closeButton && 'focus' in closeButton) {
        setTimeout(() => (closeButton as HTMLElement).focus(), 100);
      }
      
      // Trap focus inside modal
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !filterModalRef.current) return;
        
        // Find all focusable elements in the modal
        const focusableElements = Array.from(
          filterModalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        // Handle tab navigation
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      };
      
      // Handle escape key to close modal
      const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setFilterModalOpen(false);
        }
      };
      
      document.addEventListener('keydown', handleTabKey);
      document.addEventListener('keydown', handleEscapeKey);
      
      return () => {
        document.removeEventListener('keydown', handleTabKey);
        document.removeEventListener('keydown', handleEscapeKey);
        
        // When unmounting, restore focus to the previously active element
        if (!filterModalOpen && activeElement && 'focus' in activeElement) {
          // Small delay to ensure DOM is updated
          setTimeout(() => (activeElement as HTMLElement).focus(), 100);
        }
      };
    }
    
    // Return empty cleanup function when filter modal is not open
    return () => {};
  }, [filterModalOpen]);
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  // Add state for promoted listings
  const [showAllPromoted, setShowAllPromoted] = useState(false);
  
  // Add a separate query for promoted listings with the same filters
  const {
    data: promotedListingsData,
    isLoading: isLoadingPromoted,
  } = useGetListingsQuery({
    ...queryObject,
    promoted: true,
    random: true,
    limit: 200, // Get all promoted listings so we can display random ones
  });

  // Extract and process the promoted listings
  const promotedListings = React.useMemo(() => {
    console.log('Promoted listings data:', promotedListingsData);
    if (!promotedListingsData?.data?.listings) return [];
    console.log('Promoted listings count:', promotedListingsData.data.listings.length);
    // Shuffle the array to get random promoted listings
    return [...promotedListingsData.data.listings].sort(() => 0.5 - Math.random());
  }, [promotedListingsData]);

  // Add styles for the promoted section
  const promotedSectionStyles = `
    .promoted-listings-section {
      margin-bottom: 32px;
      padding: 20px;
      background-color: #f9f9ff;
      border-radius: 8px;
      border: 1px solid #eaeaff;
    }
    
    .promoted-listings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .promoted-listings-title {
      font-size: 18px;
      font-weight: 600;
      color: #4f46e5;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .promoted-listings-title svg {
      color: #6366f1;
    }
    
    .promoted-listings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    
    .see-all-promoted-button {
      background-color: white;
      border: 1px solid #4f46e5;
      color: #4f46e5;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .see-all-promoted-button:hover {
      background-color: #4f46e5;
      color: white;
    }
    
    @media (max-width: 767px) {
      .promoted-listings-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .promoted-listings-header {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }
    }
    
    @media (max-width: 480px) {
      .promoted-listings-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
  
  // Add a click handler for the "See All VIP Listings" button
  const handleSeeAllPromotedClick = () => {
    setShowAllPromoted(true);
  };

  // Add handler to go back to all listings
  const handleBackToAllListings = () => {
    setShowAllPromoted(false);
  };
  
  return (
    <div className="listings-page">
      <style>
        {`
          /* Screen reader only class */
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
          }
          
          .back-to-all-listings {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            padding: 8px 16px;
            background-color: #f3f4f6;
            border: none;
            border-radius: 4px;
            color: #374151;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .back-to-all-listings:hover {
            background-color: #e5e7eb;
          }
        `}
      </style>
      
      <Helmet>
        <title>
          {showAllPromoted ? 
            t('listings.promotedListings', 'VIP Listings') + ' - ' + t('app.name', 'Mart.az') :
            currentCategory ? 
              `${currentCategory.name} - ${t('app.name', 'Mart.az')}` : 
              t('listings.browseCatalog', 'Browse Listings')}
        </title>
        <meta name="description" content={
          showAllPromoted ?
          t('seo.browsePromotedListings', 'Browse all VIP listings available for sale') :
          currentCategory ? 
          `${t('seo.browseCategory', 'Browse listings in')} ${currentCategory.name}` : 
          t('seo.browseAllListings', 'Browse all listings available for sale')
        } />
      </Helmet>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <style dangerouslySetInnerHTML={{ __html: promotedSectionStyles }} />
      
      {/* Show desktop-filters-container regardless of showAllPromoted state */}
      <div className="desktop-filters-container">
        <div className="desktop-filters">
          <div className="filter-controls">
            {/* Category filter */}
            {categoriesData && categoriesData.length > 0 && (
              <div className="filter-item">
                <label className="filter-label" htmlFor="category-filter">{t('listings.categories')}</label>
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    setSelectedCategory(newCategory);
                    setPage(1);
                    
                    // Update URL and trigger refetch
                    const params = new URLSearchParams(window.location.search);
                    if (newCategory) {
                      params.set('category', newCategory);
                    } else {
                      params.delete('category');
                    }
                    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
                    window.history.replaceState({}, '', newUrl);
                    setTimeout(() => refetchListings(), 50);
                  }}
                  className="filter-select"
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
            <div className="filter-item">
              <label className="filter-label" htmlFor="desk-min-price">{t('listings.price')}</label>
              <div className="filter-price">
                <input
                  id="desk-min-price"
                  type="number"
                  placeholder={t('listings.minPrice')}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="filter-input"
                  min="0"
                />
                <span className="price-separator">-</span>
                <input
                  id="desk-max-price"
                  type="number"
                  placeholder={t('listings.maxPrice')}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="filter-input"
                  min="0"
                />
              </div>
            </div>
            
            {/* Condition filter */}
            <div className="filter-item">
              <label className="filter-label" htmlFor="condition-filter">{t('listings.condition')}</label>
              <select
                id="condition-filter"
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value);
                }}
                className="filter-select"
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
            <div className="filter-item">
              <label className="filter-label" htmlFor="location-filter">{t('listings.location')}</label>
              <input
                id="location-filter"
                type="text"
                placeholder={t('listings.location')}
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="filter-input"
                aria-label={t('listings.location')}
              />
            </div>
            
            {/* Filter action buttons */}
            <div className="filter-actions-inline">
              <button 
                className="filter-apply-inline" 
                onClick={handleFilterChange}
              >
                {t('listings.apply')}
              </button>
              
              {hasActiveFilters && (
                <button 
                  className="filter-clear-inline" 
                  onClick={handleClearFilters}
                >
                  {t('listings.clear')}
                </button>
              )}
            </div>
          </div>
          
          {/* Active Filter Chips - Now in a separate row */}
          {hasActiveFilters && (
            <div className="filter-chips">
              {getFilterChips().map(chip => (
                <div key={chip.id} className="filter-chip">
                  <span className="filter-chip-label">{chip.label}</span>
                  <button
                    className="filter-chip-remove"
                    onClick={() => {
                      chip.onRemove();
                      setPage(1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        chip.onRemove();
                        setPage(1);
                      }
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
            </div>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="listings-page__content">        
        <div className="listings-page__results">
          {showAllPromoted && (
            <button 
              className="back-to-all-listings" 
              onClick={handleBackToAllListings}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              {t('listings.backToAllListings', 'Back to All Listings')}
            </button>
          )}
          
          {!showAllPromoted && (
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
          )}

          {/* Promoted Listings Section */}
          {!isLoadingPromoted && promotedListings.length > 0 && (
            <div className="promoted-listings-section">
              <div className="promoted-listings-header">
                <h2 className="promoted-listings-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  {t('listings.promotedListings', 'VIP Listings')}
                </h2>
                
                {!showAllPromoted && (
                  <button 
                    className="see-all-promoted-button"
                    onClick={handleSeeAllPromotedClick}
                  >
                    {t('listings.seeAllPromoted', 'See All VIP Listings')}
                  </button>
                )}
              </div>
              
              <div className="promoted-listings-grid">
                {(showAllPromoted ? promotedListings : promotedListings.slice(0, 8)).map((listing) => (
                  <ListingCard
                    key={`promoted-${listing.id}`}
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
                    isPromoted={true}
                    categoryName={listing.category?.name}
                    categorySlug={listing.category?.slug}
                    userName={listing.user?.firstName}
                    userImage={listing.user?.profileImage}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Regular Listings Section - Only show if not in "show all promoted" mode */}
          {!showAllPromoted && (
            <>
              <div className="listings-header">
                <h1 className="listings-title">{t('listings.allListings', 'All Listings')}</h1>
              </div>
              
              {isLoadingListings ? (
                <div className={`listings-page__${viewMode}`}>
                  {Array(8).fill(0).map((_, index) => (
                    <ListingCardSkeleton key={index} />
                  ))}
                </div>
              ) : listingsError ? (
                <div className="listings-page__error">
                  <ErrorMessage message={t('listings.error')} />
                  <p className="listings-page__error-details">
                    {JSON.stringify(listingsError).substring(0, 150)}...
                  </p>
                  <button 
                    className="listings-page__retry-button"
                    onClick={() => {
                      console.log("Retrying listings fetch...");
                      refetchListings();
                    }}
                  >
                    {t('common.retry', 'Retry')}
                  </button>
                </div>
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
                      categoryName={listing.category?.name}
                      categorySlug={listing.category?.slug}
                      userName={listing.user?.firstName}
                      userImage={listing.user?.profileImage}
                    />
                  ))}
                </div>
              ) : (
                <div className="listings-page__empty" style={{ minHeight: '300px' }}>
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
            </>
          )}
            
          {!showAllPromoted && listingsData?.data?.totalPages && listingsData.data.totalPages > 1 && (
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
      
      {/* Mobile Filter Button (always show) */}
      <button 
        className="mobile-filter-button"
        onClick={toggleMobileFilter}
        aria-label={t('listings.filters')}
      >
        <FiFilter />
        {t('listings.filters')}
      </button>
      
      {/* Mobile Filter Panel (always show, visibility controlled by toggleMobileFilter) */}
      <div 
        ref={mobileFilterPanelRef}
        className={`mobile-filter-panel ${mobileFilterOpen ? 'is-open' : ''}`}
      >
        <div className="filter-header">
          <h2>{t('listings.filters')}</h2>
          <button 
            className="close-button"
            onClick={closeMobileFilter}
            aria-label={t('common.close')}
          >
            <FiX />
          </button>
        </div>
        
        <div className="filter-content">
          {/* Category filter */}
          {categoriesData && categoriesData.length > 0 && (
            <div className="filter-group">
              <label className="filter-label" htmlFor="mobile-category-filter">
                {t('listings.categories')}
              </label>
              <select
                id="mobile-category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
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
          <div className="filter-group">
            <label className="filter-label" htmlFor="mobile-min-price">
              {t('listings.price')}
            </label>
            <div className="filter-price">
              <input
                id="mobile-min-price"
                type="number"
                placeholder={t('listings.minPrice')}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="filter-input"
                min="0"
              />
              <span className="price-separator">-</span>
              <input
                id="mobile-max-price"
                type="number"
                placeholder={t('listings.maxPrice')}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="filter-input"
                min="0"
              />
            </div>
          </div>
          
          {/* Condition filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="mobile-condition-filter">
              {t('listings.condition')}
            </label>
            <select
              id="mobile-condition-filter"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="filter-select"
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
          <div className="filter-group">
            <label className="filter-label" htmlFor="mobile-location-filter">
              {t('listings.location')}
            </label>
            <input
              id="mobile-location-filter"
              type="text"
              placeholder={t('listings.location')}
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="filter-input"
            />
          </div>
          
          {/* Sort options in mobile filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="mobile-sort">
              {t('listings.sortBy')}
            </label>
            <select
              id="mobile-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="filter-select"
            >
              <option value="newest">{t('listings.sortNewest')}</option>
              <option value="oldest">{t('listings.sortOldest')}</option>
              <option value="price-low">{t('listings.sortPriceLow')}</option>
              <option value="price-high">{t('listings.sortPriceHigh')}</option>
              <option value="a-z">{t('listings.sortAZ')}</option>
              <option value="z-a">{t('listings.sortZA')}</option>
            </select>
          </div>
        </div>
        
        <div className="filter-footer">
          <button 
            className="apply-button"
            onClick={applyMobileFilters}
          >
            {t('listings.apply')}
          </button>
          <button 
            className="clear-button"
            onClick={clearMobileFilters}
          >
            {t('listings.clear')}
          </button>
        </div>
      </div>
      
      {isAdmin && <ImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} />}
    </div>
  );
};

export default ListingsPage;