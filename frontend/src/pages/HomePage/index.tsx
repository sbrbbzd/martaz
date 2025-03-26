import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
// Material Icons imports
import 'material-icons/iconfont/material-icons.css';
import { useHomeSeo } from '../../services/seoService';
import SearchBox from '../../components/common/SearchBox';
import CategoryCard from '../../components/CategoryCard';
import ListingCard from '../../components/ListingCard';
import Container from '../../components/common/Container';
import { Button, LinkButton } from '../../components/common/Button';
import { useGetListingsQuery, useGetCategoriesQuery } from '../../services/api';
import { getCategoryMaterialIcon, ensureMaterialIconsLoaded } from '../../utils/material-icons';
import './HomePage.scss';

// Define Category interface
interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
  translations?: {
    az?: string | null;
    en?: string | null;
    ru?: string | null;
  };
}

// Add helper function to get localized category name
const getLocalizedCategoryName = (category: Category, currentLanguage: string) => {
  // Log full category object to verify structure
  console.log(`Full category object for ${category.name}:`, category);
  
  if (!category.translations) {
    console.log(`No translations found for category: ${category.name}`);
    return category.name;
  }
  
  // Try to get the translation for the current language
  const translation = category.translations[currentLanguage as keyof typeof category.translations];
  
  // More detailed logging for Azerbaijani
  if (currentLanguage === 'az') {
    console.log(`AZERBAIJANI TRANSLATION CHECK for ${category.name}:`);
    console.log(`- translations object:`, category.translations);
    console.log(`- az translation:`, category.translations.az);
    console.log(`- using:`, translation || category.name);
  }
  
  // Log translation information for debugging
  console.log(`Category translation for ${category.name} [${currentLanguage}]:`, translation || 'Not available');
  
  // If no translation exists for the current language, fallback to the default name
  return translation || category.name;
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [activeTab, setActiveTab] = useState('all');
  const [forceRender, setForceRender] = useState(0);
  const trendingSearches = ['iPhone', 'Laptop', 'Apartment', 'Toyota', 'Sofa'];

  // Ensure Material Icons are loaded
  useEffect(() => {
    ensureMaterialIconsLoaded();
  }, []);

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
  
  // Apply SEO settings
  useEffect(() => {
    // Apply advanced SEO settings for homepage
    useHomeSeo(undefined, {
      title: t('homepage.pageTitle'),
      description: t('homepage.metaDescription')
    });
  }, [t]);
  
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
    
    // Map category names/slugs to their corresponding icons
    if (slug.includes('heyvanlar') || name.includes('animal')) 
      return '/assets/icons/category-animals.svg';
    if (slug.includes('neqliyyat') || name.includes('vehicle') || slug.includes('car') || name.includes('car')) 
      return '/assets/icons/category-vehicles.svg';
    if (slug.includes('dasinmaz-emlak') || name.includes('real') || slug.includes('estate') || name.includes('estate') || 
        slug.includes('property') || name.includes('property') || slug.includes('home') || name.includes('home'))
      return '/assets/icons/category-real-estate.svg';
    if (slug.includes('sexsi-esyalar') || name.includes('Şəxsi əşyalar'))
      return '/assets/icons/category-personal-items.svg';
    if (slug.includes('meiset-texnikasi') || name.includes('household') || slug.includes('appliance') || name.includes('appliance'))
      return '/assets/icons/category-household-appliances.svg';
    if (slug.includes('tibbi-mehsullar') || name.includes('medical') || slug.includes('health') || name.includes('health'))
      return '/assets/icons/category-medical-products.svg';
    if (slug.includes('usaq-alemi') || name.includes('children') || slug.includes('kid') || name.includes('kid') || 
        slug.includes('baby') || name.includes('baby') || slug.includes('toy') || name.includes('toy'))
      return '/assets/icons/category-childrens-world.svg';
    if (slug.includes('xidmetler-ve-biznes') || name.includes('service') || slug.includes('business') || name.includes('business') ||
        slug.includes('job') || name.includes('job') || slug.includes('work') || name.includes('work'))
      return '/assets/icons/category-services.svg';
    if (slug.includes('telefonlar') || name.includes('mobile') || slug.includes('phone') || name.includes('phone'))
      return '/assets/icons/category-mobile-phones.svg';
    if (slug.includes('elektronika') || name.includes('electronic') || slug.includes('tech') || name.includes('tech') ||
        slug.includes('computer') || name.includes('computer') || slug.includes('laptop') || name.includes('laptop'))
      return '/assets/icons/category-electronics.svg';
    if (slug.includes('idman-ve-hobbi') || name.includes('sport') || slug.includes('hobby') || name.includes('hobby') ||
        slug.includes('fitness') || name.includes('fitness') || slug.includes('outdoor') || name.includes('outdoor'))
      return '/assets/icons/category-sports-hobbies.svg';
    if (slug.includes('ev-v-bag-ucun') || name.includes('home') || slug.includes('garden') || name.includes('garden') ||
        slug.includes('furniture') || name.includes('furniture') || slug.includes('decor') || name.includes('decor'))
      return '/assets/icons/category-home-garden.svg';
      
    // Default icon if no matches found
    return '/assets/icons/category-default.svg';
  };

  // For categories display
  const renderCategories = () => {
    console.log('Rendering categories, loading:', isCategoriesLoading, 'forceRender:', forceRender);
    console.log('Current language:', currentLanguage);
    
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
    
    // Log all translations for debugging
    if (parentCategories.length > 0) {
      console.log('Category translations:');
      parentCategories.forEach(category => {
        console.log(`- ${category.name}:`, category.translations || 'No translations');
      });
    }
    
    if (parentCategories.length === 0) {
      console.log('No parent categories to display');
      return <div className="info-message">{t('noCategoriesAvailable')}</div>;
    }
    
    return parentCategories.slice(0, 12).map((category) => (
      <motion.div key={category.id} variants={fadeIn}>
        <CategoryCard
          id={category.id}
          name={getLocalizedCategoryName(category, currentLanguage)}
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
          categoryObj={listing.category}
          isPromoted={listing.isPromoted}
          createdAt={listing.createdAt}
        />
      </motion.div>
    ));
  };

  return (
    <>
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
              <h2 className="section-title">
                <span className="material-icons">category</span>
                {t('exploreCategories')}
              </h2>
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
                  <span className="material-icons">arrow_forward</span>
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
              <h2 className="section-title">
                <span className="material-icons">featured_play_list</span>
                {t('featuredListings')}
              </h2>
              <p className="section-subtitle">{t('featuredListingsSubtitle')}</p>
              
              <div className="featured-tabs">
                <button 
                  className={`featured-tab ${activeTab === 'all' ? 'featured-tab--active' : ''}`}
                  onClick={() => handleTabChange('all')}
                >
                  <span className="material-icons">apps</span>
                  {t('all')}
                </button>
                <button 
                  className={`featured-tab ${activeTab === 'latest' ? 'featured-tab--active' : ''}`}
                  onClick={() => handleTabChange('latest')}
                >
                  <span className="material-icons">schedule</span>
                  {t('latest')}
                </button>
                <button 
                  className={`featured-tab ${activeTab === 'popular' ? 'featured-tab--active' : ''}`}
                  onClick={() => handleTabChange('popular')}
                >
                  <span className="material-icons">trending_up</span>
                  {t('popular')}
                </button>
                <button 
                  className={`featured-tab ${activeTab === 'featured' ? 'featured-tab--active' : ''}`}
                  onClick={() => handleTabChange('featured')}
                >
                  <span className="material-icons">star</span>
                  {t('featured')}
                </button>
              </div>
            </div>
            
            <motion.div 
              className="featured-listings__grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {renderListings()}
            </motion.div>
          </Container>
        </section>
      </div>
    </>
  );
};

export default HomePage;