import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SearchBox from '../../components/common/SearchBox';
import CategoryCard from '../../components/CategoryCard';
import ListingCard from '../../components/ListingCard';
import Container from '../../components/common/Container';
import { Button, LinkButton } from '../../components/common/Button';
import { useGetListingsQuery, useGetCategoriesQuery } from '../../services/api';
import { getCategoryMaterialIcon } from '../../utils/material-icons';
import './HomePage.scss';

// Define Category interface
interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
}

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [forceRender, setForceRender] = useState(0);
  const trendingSearches = ['iPhone', 'Laptop', 'Apartment', 'Toyota', 'Sofa'];

  // Fetch real data from the API - use regular listings instead of featured
  const { data: listingsData, isLoading: isListingsLoading, isError: isListingsError } = 
    useGetListingsQuery({ limit: 8 });
  
  const { data: categoriesData, isLoading: isCategoriesLoading, isError: isCategoriesError, refetch: refetchCategories } = 
    useGetCategoriesQuery(undefined, { 
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
      refetchOnFocus: true
    });
  
  // Use the fetched data or default to empty arrays
  const listings = listingsData?.data?.listings || [];
  const categories = categoriesData || [];

  // Debug logs
  console.log('Listings Data:', listingsData);
  console.log('Listings:', listings);
  console.log('Categories Data:', categoriesData);
  console.log('Categories Loading:', isCategoriesLoading);
  console.log('Force render count:', forceRender);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Force refetch categories on mount
    refetchCategories();
    
    // Force a re-render after a short delay on initial mount
    const timer = setTimeout(() => {
      setForceRender(prev => prev + 1);
    }, 300);

    // Second timer as a backup
    const backupTimer = setTimeout(() => {
      if (!categoriesData && !isCategoriesLoading) {
        console.log('Backup timer triggered - refetching categories');
        refetchCategories();
      }
      setForceRender(prev => prev + 1);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(backupTimer);
    };
  }, [refetchCategories]);
  
  // Effect to handle categories data
  useEffect(() => {
    if (categoriesData) {
      console.log('Categories data loaded:', categoriesData.length);
      // Force a re-render when data arrives
      setForceRender(prev => prev + 1);
    }
  }, [categoriesData]);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // In a real implementation, we could load different data based on the tab
    // For now, we'll just sort the existing data
  };

  const handleCategoryClick = (slug: string) => {
    navigate(`/listings?category=${slug}`);
  };

  // Helper function to get appropriate icon for a category
  const getCategoryIcon = (category: Category) => {
    if (category.icon) return category.icon;
    
    // First check if we have a corresponding material icon
    const materialIcon = getCategoryMaterialIcon(category);
    if (materialIcon !== 'category') {
      return materialIcon;
    }
    
    // If not, try to find an appropriate icon based on the category slug or name
    const slug = category.slug?.toLowerCase() || '';
    const name = category.name?.toLowerCase() || '';
    
    // Common category types
    if (slug.includes('electronics') || name.includes('electronics')) 
      return '/assets/icons/category-electronics.svg';
    if (slug.includes('vehicle') || name.includes('vehicle') || slug.includes('car') || name.includes('car')) 
      return '/assets/icons/category-vehicles.svg';
    if (slug.includes('real') || name.includes('real') || slug.includes('estate') || name.includes('estate') || 
        slug.includes('property') || name.includes('property') || slug.includes('home') || name.includes('home'))
      return '/assets/icons/category-real-estate.svg';
    if (slug.includes('job') || name.includes('job') || slug.includes('work') || name.includes('work'))
      return '/assets/icons/category-jobs.svg';
    if (slug.includes('furniture') || name.includes('furniture'))
      return '/assets/icons/category-furniture.svg';
    if (slug.includes('service') || name.includes('service'))
      return '/assets/icons/category-services.svg';
      
    // Default icon if no matches found
    return '/assets/icons/category-default.svg';
  };

  // For categories display
  const renderCategories = () => {
    console.log('Rendering categories, loading:', isCategoriesLoading, 'forceRender:', forceRender);
    
    // Check localStorage for cached categories if data isn't available
    const useCachedData = !categoriesData && !isCategoriesLoading;
    let cachedCategories: Category[] = [];
    
    if (useCachedData) {
      try {
        const cachedData = localStorage.getItem('cached_categories');
        if (cachedData) {
          cachedCategories = JSON.parse(cachedData);
          console.log('Using cached categories from localStorage:', cachedCategories.length);
        }
      } catch (e) {
        console.error('Failed to parse cached categories:', e);
      }
    }
    
    // If we're loading and don't have cached data, show skeletons
    if (isCategoriesLoading && (!cachedCategories || cachedCategories.length === 0)) {
      return Array(6).fill(0).map((_, index) => (
        <motion.div key={`skeleton-${index}`} variants={fadeIn}>
          <div className="category-skeleton">
            <div className="category-skeleton__icon"></div>
            <div className="category-skeleton__name"></div>
            <div className="category-skeleton__count"></div>
          </div>
        </motion.div>
      ));
    }
    
    // If there's an error and no cached data, show error message
    if (isCategoriesError && (!cachedCategories || cachedCategories.length === 0)) {
      return <div className="error-message">{t('errorLoadingCategories')}</div>;
    }
    
    // Use categories from API or fallback to cached categories
    const categoriesToUse = (categories && categories.length > 0) ? categories : cachedCategories;
    
    if (!categoriesToUse || categoriesToUse.length === 0) {
      console.log('No categories available to display');
      return <div className="info-message">{t('noCategoriesAvailable')}</div>;
    }
    
    // Filter to get only parent categories (those with no parentId)
    const parentCategories = categoriesToUse.filter(category => !category.parentId);
    console.log('Parent Categories:', parentCategories);
    
    if (parentCategories.length === 0) {
      console.log('No parent categories to display');
      return <div className="info-message">{t('noCategoriesAvailable')}</div>;
    }
    
    return parentCategories.slice(0, 6).map((category) => (
      <motion.div key={category.id} variants={fadeIn}>
        <CategoryCard
          id={category.id}
          name={category.name}
          icon={getCategoryIcon(category)}
          count={0} // Default count since API might not provide this
          slug={category.slug}
          onClick={() => handleCategoryClick(category.slug)}
        />
      </motion.div>
    ));
  };

  // For listings display
  const renderListings = () => {
    if (isListingsLoading) {
      return Array(6).fill(0).map((_, index) => (
        <div key={index} className="listing-skeleton"></div>
      ));
    }
    
    if (isListingsError) {
      return <div className="error-message">{t('errorLoadingListings')}</div>;
    }
    
    // Sort the listings based on the active tab
    const sortedListings = [...listings];
    
    if (activeTab === 'latest') {
      sortedListings.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (activeTab === 'popular') {
      sortedListings.sort((a, b) => b.views - a.views);
    } else if (activeTab === 'featured') {
      sortedListings.sort((a, b) => {
        if (a.isPromoted && !b.isPromoted) return -1;
        if (!a.isPromoted && b.isPromoted) return 1;
        return 0;
      });
    }
    
    return sortedListings.map((listing) => (
      <motion.div key={listing.id} variants={fadeIn}>
        <ListingCard 
          id={listing.id}
          slug={listing.slug}
          title={listing.title}
          price={listing.price}
          currency={listing.currency}
          location={listing.location}
          featuredImage={listing.featuredImage}
          categoryName={listing.category?.name}
          categorySlug={listing.category?.slug}
          isFeatured={listing.isFeatured}
          isPromoted={listing.isPromoted}
          createdAt={listing.createdAt}
        />
      </motion.div>
    ));
  };

  return (
    <>
      <Helmet>
        <title>{t('homepage.pageTitle')} | Mart.az</title>
        <meta name="description" content={t('homepage.metaDescription')} />
      </Helmet>

      <div className="home-page">
        {/* Hero Section with Search */}
        <section className="hero">
          <Container>
            <motion.div 
              className="hero__content"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.5 }}
            >
              <h1 className="hero__title">{t('homepage.heroTitle')}</h1>
              <p className="hero__subtitle">{t('homepage.heroSubtitle')}</p>
              
              <div className="hero__search">
                <SearchBox 
                  placeholder={t('homepage.searchPlaceholder')}
                  trendingSearches={trendingSearches}
                  showTrending={true}
                  onSearch={(query) => {
                    console.log("HomePage search triggered with:", query);
                    navigate(`/listings?search=${encodeURIComponent(query)}`);
                  }}
                />
              </div>
            </motion.div>
          </Container>
          <div className="hero__wave">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="#ffffff" fillOpacity="1" d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,208C840,213,960,203,1080,192C1200,181,1320,171,1380,165.3L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
            </svg>
          </div>
        </section>
        
        {/* Categories Section */}
        <section className="categories">
          <Container>
            <div className="section-header">
              <h2 className="section-title">{t('exploreCategories')}</h2>
              <p className="section-subtitle">{t('exploreCategoriesSubtitle')}</p>
            </div>
            
            <motion.div 
              className="categories__grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {renderCategories()}
            </motion.div>
            
            <div className="categories__action">
              <LinkButton 
                to="/categories" 
                variant="outline" 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                }
              >
                {t('viewAllCategories')}
              </LinkButton>
            </div>
          </Container>
        </section>

        {/* Featured Listings Section */}
        <section className="featured-listings">
          <Container>
            <div className="section-header">
              <h2 className="section-title">{t('featuredListings')}</h2>
              <p className="section-subtitle">{t('featuredListingsSubtitle')}</p>
              
              <div className="featured-tabs">
                <button 
                  className={`featured-tab ${activeTab === 'all' ? 'featured-tab--active' : ''}`}
                  onClick={() => handleTabChange('all')}
                >
                  {t('all')}
                </button>
                <button 
                  className={`featured-tab ${activeTab === 'latest' ? 'featured-tab--active' : ''}`}
                  onClick={() => handleTabChange('latest')}
                >
                  {t('latest')}
                </button>
                <button 
                  className={`featured-tab ${activeTab === 'popular' ? 'featured-tab--active' : ''}`}
                  onClick={() => handleTabChange('popular')}
                >
                  {t('popular')}
                </button>
                <button 
                  className={`featured-tab ${activeTab === 'featured' ? 'featured-tab--active' : ''}`}
                  onClick={() => handleTabChange('featured')}
                >
                  {t('featured')}
                </button>
              </div>
            </div>
            
            <motion.div 
              className="featured-listings__grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {renderListings()}
            </motion.div>
            
            <div className="featured-listings__action">
              <LinkButton 
                to="/listings" 
                variant="primary" 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                }
              >
                {t('viewAllListings')}
              </LinkButton>
            </div>
          </Container>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works">
          <Container>
            <div className="section-header">
              <h2 className="section-title">{t('howItWorks')}</h2>
              <p className="section-subtitle">{t('howItWorksSubtitle')}</p>
            </div>
            
            <motion.div 
              className="how-it-works__steps"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.div 
                className="step-card"
                variants={fadeIn}
                transition={{ duration: 0.3 }}
              >
                <div className="step-card__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                </div>
                <h3 className="step-card__title">{t('createAccount')}</h3>
                <p className="step-card__description">
                  {t('createAccountDescription')}
                </p>
              </motion.div>
              
              <div className="step-connector">
                <svg width="40" height="12" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 6L30 0.226497V11.7735L40 6ZM0 7H31V5H0V7Z" fill="currentColor"/>
                </svg>
              </div>
              
              <motion.div 
                className="step-card"
                variants={fadeIn}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="step-card__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                </div>
                <h3 className="step-card__title">{t('common.postAd')}</h3>
                <p className="step-card__description">
                  {t('postAdDescription')}
                </p>
              </motion.div>
              
              <div className="step-connector">
                <svg width="40" height="12" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 6L30 0.226497V11.7735L40 6ZM0 7H31V5H0V7Z" fill="currentColor"/>
                </svg>
              </div>
              
              <motion.div 
                className="step-card"
                variants={fadeIn}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="step-card__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
                    <path d="M12 5.36V8"></path>
                    <path d="M12 12v3"></path>
                    <path d="M12 20v1"></path>
                  </svg>
                </div>
                <h3 className="step-card__title">{t('connectWithBuyers')}</h3>
                <p className="step-card__description">
                  {t('connectWithBuyersDescription')}
                </p>
              </motion.div>
            </motion.div>
          </Container>
        </section>

        {/* Call to Action Section */}
        <section className="cta">
          <Container>
            <motion.div 
              className="cta__content"
              initial="hidden"
              whileInView="visible"
              variants={fadeIn}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="cta__image">
                <img src="/images/cta-illustration.svg" alt="" />
              </div>
              <div className="cta__text">
                <h2 className="cta__title">{t('readyToSell')}</h2>
                <p className="cta__description">{t('readyToSellDescription')}</p>
                <ul className="cta__benefits">
                  <li>
                    <span className="material-icons">check_circle</span>
                    {t('freeListing')}
                  </li>
                  <li>
                    <span className="material-icons">check_circle</span>
                    {t('easyToUse')}
                  </li>
                  <li>
                    <span className="material-icons">check_circle</span>
                    {t('secureCommunication')}
                  </li>
                </ul>
                <LinkButton 
                  to="/create-listing" 
                  variant="accent" 
                  size="lg" 
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  }
                  className="cta__button"
                >
                  {t('postAdNow')}
                </LinkButton>
              </div>
            </motion.div>
          </Container>
        </section>
        
        {/* Testimonials Section */}
        <section className="testimonials">
          <Container>
            <div className="section-header">
              <h2 className="section-title">{t('happyUsers')}</h2>
              <p className="section-subtitle">{t('happyUsersSubtitle')}</p>
            </div>
            
            <div className="testimonials__slider">
              <div className="testimonial-card">
                <div className="testimonial-card__rating">
                  <span className="material-icons">star</span>
                  <span className="material-icons">star</span>
                  <span className="material-icons">star</span>
                  <span className="material-icons">star</span>
                  <span className="material-icons">star</span>
                </div>
                <p className="testimonial-card__text">
                  "I sold my car within 2 days of posting. The process was so simple and I got multiple inquiries right away!"
                </p>
                <div className="testimonial-card__author">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="testimonial-card__avatar" />
                  <div className="testimonial-card__info">
                    <h4 className="testimonial-card__name">Eldar Mammadov</h4>
                    <p className="testimonial-card__location">Baku, Azerbaijan</p>
                  </div>
                </div>
              </div>
              
              <div className="testimonial-card">
                <div className="testimonial-card__rating">
                  <span className="material-icons">star</span>
                  <span className="material-icons">star</span>
                  <span className="material-icons">star</span>
                  <span className="material-icons">star</span>
                  <span className="material-icons">star_half</span>
                </div>
                <p className="testimonial-card__text">
                  "I found my apartment through Mart.az and the whole experience was great. The interface is easy to use and filters really helped narrow down my search."
                </p>
                <div className="testimonial-card__author">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="testimonial-card__avatar" />
                  <div className="testimonial-card__info">
                    <h4 className="testimonial-card__name">Aysel Huseynova</h4>
                    <p className="testimonial-card__location">Ganja, Azerbaijan</p>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>
        
        {/* Download App Section */}
        <section className="download-app">
          <Container>
            <div className="download-app__content">
              <div className="download-app__info">
                <h2 className="download-app__title">{t('downloadOurApp')}</h2>
                <p className="download-app__description">{t('downloadAppDescription')}</p>
                <div className="download-app__buttons">
                  <a href="#" className="app-button">
                    <img src="assets/images/app-store.png" alt="App Store" />
                  </a>
                  <a href="#" className="app-button">
                    <img src="assets/images/google-play.png" alt="Google Play" />
                  </a>
                </div>
              </div>
        
            </div>
          </Container>
        </section>
      </div>
    </>
  );
};

export default HomePage; 