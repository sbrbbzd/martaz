import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SearchBox from '../../components/common/SearchBox';
import CategoryCard from '../../components/CategoryCard';
import ListingCard from '../../components/ListingCard';
import Container from '../../components/common/Container';
import { Button, LinkButton } from '../../components/common/Button';
import './HomePage.scss';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([
    { 
      id: 'electronics', 
      name: t('electronics'), 
      icon: '/assets/icons/category-electronics.svg',
      count: 134 
    },
    { 
      id: 'vehicles', 
      name: t('vehicles'), 
      icon: '/assets/icons/category-vehicles.svg', 
      count: 87 
    },
    { 
      id: 'real-estate', 
      name: t('realEstate'), 
      icon: '/assets/icons/category-real-estate.svg', 
      count: 56 
    },
    { 
      id: 'jobs', 
      name: t('jobs'), 
      icon: '/assets/icons/category-jobs.svg', 
      count: 42 
    },
    { 
      id: 'furniture', 
      name: t('furniture'), 
      icon: '/assets/icons/category-furniture.svg', 
      count: 78 
    },
    { 
      id: 'services', 
      name: t('services'), 
      icon: '/assets/icons/category-services.svg', 
      count: 63 
    }
  ]);
  
  const [featuredListings, setFeaturedListings] = useState([
    {
      id: 1,
      title: 'iPhone 13 Pro Max 256GB',
      price: 1700,
      location: 'Baku, Azerbaijan',
      imageUrl: 'https://source.unsplash.com/random/300x200?iphone',
      category: t('electronics'),
      categoryIcon: 'smartphone',
      isFeatured: true,
      createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: 2,
      title: 'Modern Apartment in City Center',
      price: 1200,
      location: 'Baku, Azerbaijan',
      imageUrl: 'https://source.unsplash.com/random/300x200?apartment',
      category: t('realEstate'),
      categoryIcon: 'apartment',
      isFeatured: true,
      createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    },
    {
      id: 3,
      title: 'Brand New Gaming Laptop',
      price: 2500,
      location: 'Ganja, Azerbaijan',
      imageUrl: 'https://source.unsplash.com/random/300x200?laptop',
      category: t('electronics'),
      categoryIcon: 'laptop',
      isFeatured: true,
      isNew: true,
      createdAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
    },
    {
      id: 4,
      title: 'Toyota Camry 2020',
      price: 35000,
      location: 'Baku, Azerbaijan',
      imageUrl: 'https://source.unsplash.com/random/300x200?toyota',
      category: t('vehicles'),
      categoryIcon: 'directions_car',
      isFeatured: true,
      createdAt: new Date(Date.now() - 345600000).toISOString() // 4 days ago
    },
    {
      id: 5,
      title: 'Luxury Sofa Set',
      price: 1500,
      location: 'Sumgait, Azerbaijan',
      imageUrl: 'https://source.unsplash.com/random/300x200?sofa',
      category: t('furniture'),
      categoryIcon: 'chair',
      isFeatured: true,
      createdAt: new Date(Date.now() - 432000000).toISOString() // 5 days ago
    },
    {
      id: 6,
      title: 'Professional Photography Services',
      price: 200,
      location: 'Baku, Azerbaijan',
      imageUrl: 'https://source.unsplash.com/random/300x200?photography',
      category: t('services'),
      categoryIcon: 'camera',
      isFeatured: true,
      createdAt: new Date(Date.now() - 518400000).toISOString() // 6 days ago
    }
  ]);
  
  const [activeTab, setActiveTab] = useState('all');
  const trendingSearches = ['iPhone', 'Laptop', 'Apartment', 'Toyota', 'Sofa'];

  useEffect(() => {
    // Fetch featured listings or other data needed for the home page
    window.scrollTo(0, 0);
  }, []);

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
    
    // In a real app, you would fetch different listings based on the tab
    // For now, we'll just simulate it
    if (tab === 'latest') {
      setFeaturedListings(prev => [...prev].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } else if (tab === 'popular') {
      setFeaturedListings(prev => [...prev].sort((a, b) => b.price - a.price));
    }
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
              {categories.map((category) => (
                <motion.div 
                  key={category.id}
                  variants={fadeIn}
                  transition={{ duration: 0.3 }}
                >
                  <CategoryCard
                    id={category.id}
                    name={category.name}
                    icon={category.icon}
                    count={category.count}
                  />
                </motion.div>
              ))}
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
              {featuredListings.map((listing) => (
                <motion.div 
                  key={listing.id}
                  variants={fadeIn}
                  transition={{ duration: 0.3 }}
                >
                  <ListingCard
                    id={listing.id}
                    title={listing.title}
                    price={listing.price}
                    location={listing.location}
                    imageUrl={listing.imageUrl}
                    category={listing.category}
                    categoryIcon={listing.categoryIcon}
                    isFeatured={listing.isFeatured}
                    isNew={listing.isNew}
                    createdAt={listing.createdAt}
                  />
                </motion.div>
              ))}
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
                <div className="step-card__number">1</div>
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
                <div className="step-card__number">2</div>
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
                <div className="step-card__number">3</div>
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