import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import ListingCard from '../../components/ListingCard';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { useGetListingsQuery, useGetCategoriesQuery, Listing } from '../../services/api';
import './styles.scss';

const ListingsPage: React.FC = () => {
  const locationHook = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  
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
  
  // State for filter values
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [sort, setSort] = useState(initialSort);
  const [order, setOrder] = useState(initialOrder);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [condition, setCondition] = useState(initialCondition);
  const [locationFilter, setLocationFilter] = useState(initialLocation);
  const [search, setSearch] = useState(initialSearch);
  const [showFilters, setShowFilters] = useState(false);
  
  // API queries
  const { 
    data: listingsData, 
    isLoading: isLoadingListings, 
    error: listingsError, 
    refetch: refetchListings 
  } = useGetListingsQuery({
    page,
    limit,
    sort,
    order,
    category: categorySlug,
    minPrice: minPrice ? parseInt(minPrice) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    condition: condition || undefined,
    location: locationFilter || undefined,
    search: search || undefined
  });
  
  const { 
    data: categoriesData,
    isLoading: isLoadingCategories
  } = useGetCategoriesQuery(undefined);
  
  // Get current category if categorySlug is provided
  const currentCategory = categorySlug && categoriesData ? 
    categoriesData.find(cat => cat.slug === categorySlug) || null : null;
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (page !== 1) params.set('page', page.toString());
    if (limit !== 12) params.set('limit', limit.toString());
    if (sort !== 'createdAt') params.set('sort', sort);
    if (order !== 'DESC') params.set('order', order);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (condition) params.set('condition', condition);
    if (locationFilter) params.set('location', locationFilter);
    if (search) params.set('search', search);
    
    navigate(`${locationHook.pathname}?${params.toString()}`, { replace: true });
  }, [page, limit, sort, order, minPrice, maxPrice, condition, locationFilter, search, navigate, locationHook.pathname]);
  
  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [minPrice, maxPrice, condition, locationFilter, search, categorySlug]);
  
  // Handle pagination change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };
  
  // Handle filter change
  const handleFilterChange = (filterValues: any) => {
    setMinPrice(filterValues.minPrice || '');
    setMaxPrice(filterValues.maxPrice || '');
    setCondition(filterValues.condition || '');
    setLocationFilter(filterValues.location || '');
    setSort(filterValues.sort || 'createdAt');
    setOrder(filterValues.order || 'DESC');
  };
  
  // Handle search submit
  const handleSearchSubmit = (searchQuery: string) => {
    setSearch(searchQuery);
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setCondition('');
    setLocationFilter('');
    setSearch('');
    setSort('createdAt');
    setOrder('DESC');
  };
  
  // Toggle filters on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Construct page title
  const pageTitle = currentCategory
    ? t('listings.categoryTitle', { category: currentCategory.name })
    : search
    ? t('listings.searchTitle', { query: search })
    : t('listings.title');
  
  return (
    <div className="listings-page">
      <Helmet>
        <title>{pageTitle} | Mart.az</title>
        <meta name="description" content={t('listings.description')} />
      </Helmet>
      
      <div className="listings-page__container">
        <div className="listings-page__header">
          <div className="listings-page__title-wrapper">
            <h1 className="listings-page__title">{pageTitle}</h1>
          </div>
          
          <div className="listings-page__search-container">
            <h3>{t('listings.search')}</h3>
            <div className="listings-page__search">
              <input
                type="text"
                placeholder={t('listings.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit(search)}
              />
              <button onClick={() => handleSearchSubmit(search)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>
          </div>
          
          {categoriesData && categoriesData.length > 0 && (
            <div className="listings-page__categories-container">
              <h3>{t('listings.categories')}</h3>
              <div className="listings-page__categories">
                <ul>
                  <li>
                    <a href="/listings" className={!categorySlug ? 'active' : ''}>
                      {t('listings.allCategories')}
                    </a>
                  </li>
                  {categoriesData.map(category => (
                    <li key={category.id}>
                      <a 
                        href={`/categories/${category.slug}`} 
                        className={categorySlug === category.slug ? 'active' : ''}
                      >
                        {category.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <button 
            className="listings-page__filter-toggle"
            onClick={toggleFilters}
          >
            {showFilters ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                {t('listings.hideFilters')}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                {t('listings.showFilters')}
              </>
            )}
          </button>
        </div>
        
        <div className="listings-page__content">
          {(showFilters || window.innerWidth >= 992) && (
            <div className="listings-page__sidebar">
              <h3>
                {t('listings.filters')}
                <button onClick={handleClearFilters}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                  </svg>
                </button>
              </h3>
              
              <div className="listings-page__sidebar-price">
                <h4>{t('listings.price')}</h4>
                <div className="listings-page__sidebar-price-inputs">
                  <input
                    type="number"
                    placeholder={t('listings.minPrice')}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder={t('listings.maxPrice')}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="listings-page__sidebar-condition">
                <h4>{t('listings.condition')}</h4>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="">{t('listings.anyCondition')}</option>
                  <option value="new">{t('condition.new')}</option>
                  <option value="likeNew">{t('condition.likeNew')}</option>
                  <option value="good">{t('condition.good')}</option>
                  <option value="fair">{t('condition.fair')}</option>
                  <option value="poor">{t('condition.poor')}</option>
                </select>
              </div>
              
              <div className="listings-page__sidebar-location">
                <h4>{t('listings.location')}</h4>
                <input
                  type="text"
                  placeholder={t('listings.enterLocation')}
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              
              <div className="listings-page__sidebar-buttons">
                <button className="apply" onClick={() => {
                  handleFilterChange({
                    minPrice,
                    maxPrice,
                    condition,
                    location: locationFilter,
                    sort,
                    order
                  });
                  if (window.innerWidth < 992) {
                    toggleFilters();
                  }
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                  {t('listings.applyFilters')}
                </button>
                
                <button className="clear" onClick={handleClearFilters}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  {t('listings.clearFilters')}
                </button>
              </div>
            </div>
          )}
          
          <div className="listings-page__main">
            {isLoadingListings || isLoadingCategories ? (
              <LoadingSpinner />
            ) : listingsError ? (
              <ErrorMessage 
                message={t('common.errorOccurred')}
                onRetry={refetchListings}
              />
            ) : (
              <>
                {listingsData && listingsData.data && listingsData.data.listings && listingsData.data.listings.length > 0 ? (
                  <>
                    <div className="listings-page__sort">
                      <div className="listings-page__results">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        {t('listings.resultsCount', { count: listingsData.data.total })}
                      </div>
                      
                      <div className="listings-page__sort-options">
                        <select
                          value={`${sort}-${order}`}
                          onChange={(e) => {
                            const [newSort, newOrder] = e.target.value.split('-');
                            setSort(newSort);
                            setOrder(newOrder);
                          }}
                        >
                          <option value="createdAt-DESC">{t('listings.sortNewest')}</option>
                          <option value="createdAt-ASC">{t('listings.sortOldest')}</option>
                          <option value="price-ASC">{t('listings.sortPriceLow')}</option>
                          <option value="price-DESC">{t('listings.sortPriceHigh')}</option>
                          <option value="title-ASC">{t('listings.sortTitleAZ')}</option>
                          <option value="title-DESC">{t('listings.sortTitleZA')}</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="listings-page__grid">
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
                    
                    {listingsData.data.totalPages > 1 && (
                      <div className="listings-page__pagination">
                        <Pagination
                          currentPage={page}
                          totalPages={listingsData.data.totalPages}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="listings-page__empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3>{t('listings.noResults')}</h3>
                    <p>{t('listings.tryDifferentFilters')}</p>
                    <button onClick={handleClearFilters}>
                      {t('listings.clearFilters')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingsPage; 