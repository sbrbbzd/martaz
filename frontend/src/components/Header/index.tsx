import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { selectIsAuthenticated, selectAuthUser, logout } from '@store/slices/authSlice';
import LanguageSwitcher from '@components/LanguageSwitcher';
import { FiUser, FiList, FiLogOut, FiPlus, FiMenu, FiX, FiChevronDown, FiHome, FiShoppingBag, FiHeart } from 'react-icons/fi';
import './Header.scss';

// Define User interface to match what's in authSlice
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  profileImage?: string;
  username?: string;
}

const Header: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectAuthUser) as User;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Toggle body scroll when menu is open
    if (!isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    setUserMenuOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    document.body.style.overflow = '';
  }, [location.pathname]);
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Close menu when clicking outside (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen && 
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.header__menu-toggle')
      ) {
        setIsMenuOpen(false);
        document.body.style.overflow = '';
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);
  
  // Animation variants
  const dropdownVariants = {
    closed: { opacity: 0, y: -5, scale: 0.95, transition: { duration: 0.2 } },
    open: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } }
  };

  // Mobile Nav animation variants
  const mobileNavVariants = {
    closed: { 
      x: '-100%', 
      opacity: 0,
      transition: { duration: 0.3, ease: "easeInOut" } 
    },
    open: { 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" } 
    }
  };

  return (
    <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
      <div className="container">
        <div className="header__content">
          {/* Mobile left section with menu toggle and create button */}
          <div className="header__mobile-left">
            <button 
              className={`header__menu-toggle ${isMenuOpen ? 'header__menu-toggle--active' : ''}`} 
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? t('common.closeMenu') : t('common.openMenu')}
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            
            {/* Create listing button (mobile only) */}
            <Link to="/listings/create" className="header__post-btn-mobile">
              <FiPlus size={20} />
              <span>{t('common.postAd')}</span>
            </Link>
          </div>

          {/* Logo (center aligned on mobile) */}
          <div className="header__logo">
            <Link to="/" aria-label="Mart.az Home">
              <img 
                src="/assets/icons/logo.svg"
                alt="Mart.az"
                className="header__logo-img"
              />
            </Link>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <motion.div 
              ref={menuRef}
              className="header__nav-container"
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileNavVariants}
              style={{ display: 'block' }}
            >
              <nav className="header__nav">
                {/* Mobile User Info */}
                {isAuthenticated && (
                  <div className="header__mobile-user-section">
                    <div className="header__mobile-user">
                      <div className="header__user-avatar header__user-avatar--lg">
                        {currentUser?.profileImage ? (
                          <img 
                            src={currentUser.profileImage} 
                            alt={`${currentUser.firstName} ${currentUser.lastName}`}
                          />
                        ) : (
                          <span>{`${currentUser?.firstName?.charAt(0) || ''}${currentUser?.lastName?.charAt(0) || ''}`}</span>
                        )}
                      </div>
                      <div className="header__mobile-user-info">
                        <h4 className="header__user-name">{currentUser?.firstName} {currentUser?.lastName}</h4>
                        <p className="header__user-email">{currentUser?.email}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mobile Authentication Section - only shown when not logged in */}
                {!isAuthenticated && (
                  <div className="header__mobile-auth-section">
                    <div className="header__mobile-auth-buttons">
                      <Link 
                        to="/login" 
                        className="header__mobile-auth-btn header__mobile-auth-btn--secondary"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t('common.login')}
                      </Link>
                      <Link 
                        to="/register" 
                        className="header__mobile-auth-btn header__mobile-auth-btn--primary"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t('common.register')}
                      </Link>
                    </div>
                  </div>
                )}
                
                {/* Mobile Navigation Section */}
                <div className="header__mobile-nav-section">
                  <h3 className="header__mobile-section-title">{t('common.navigation')}</h3>
                  <ul className="header__menu">
                    <li className="header__menu-item">
                      <Link 
                        to="/listings/create" 
                        className="header__menu-link header__menu-link--highlight"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FiPlus size={20} /> {t('common.postAd')}
                      </Link>
                    </li>
                  </ul>
                </div>
                
                {/* Mobile Account Section - only shown when logged in */}
                {isAuthenticated && (
                  <div className="header__mobile-account-section">
                    <h3 className="header__mobile-section-title">{t('common.account')}</h3>
                    <ul className="header__menu">
                      <li className="header__menu-item">
                        <Link 
                          to="/profile" 
                          className="header__menu-link"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <FiUser size={20} /> {t('common.profile')}
                        </Link>
                      </li>
                      <li className="header__menu-item">
                        <Link 
                          to="/profile?tab=listings" 
                          className="header__menu-link"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <FiList size={20} /> {t('common.myListings')}
                        </Link>
                      </li>
                      <li className="header__menu-item">
                        <Link 
                          to="/profile?tab=favorites" 
                          className="header__menu-link"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <FiHeart size={20} /> {t('common.favorites')}
                        </Link>
                      </li>
                      <li className="header__menu-item">
                        <button 
                          className="header__menu-link header__menu-link--logout"
                          onClick={() => {
                            handleLogout();
                            setIsMenuOpen(false);
                          }}
                        >
                          <FiLogOut size={20} /> {t('common.logout')}
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
                
                {/* Mobile Language Section */}
                <div className="header__mobile-language-section">
                  <h3 className="header__mobile-section-title">{t('common.language')}</h3>
                  <div className="header__mobile-language">
                    <LanguageSwitcher />
                  </div>
                </div>
              </nav>
            </motion.div>
          )}

          {/* Desktop Navigation Menu */}
          <div className="header__navigation">
            <nav className="header__nav header__nav--desktop">
              <ul className="header__menu">
                {/* Post button removed from here */}
              </ul>
            </nav>
          </div>

          <div className="header__actions">
            {/* Language Switcher */}
            <div className="header__language">
              <LanguageSwitcher />
            </div>
            
            {isAuthenticated ? (
              <div className="header__user" ref={userMenuRef}>
                <button 
                  className={`header__user-button ${userMenuOpen ? 'header__user-button--active' : ''}`}  
                  onClick={toggleUserMenu}
                  aria-expanded={userMenuOpen}
                >
                  <div className="header__user-avatar">
                    {currentUser?.profileImage ? (
                      <img 
                        src={currentUser.profileImage} 
                        alt={`${currentUser.firstName} ${currentUser.lastName}`}
                      />
                    ) : (
                      <span>{`${currentUser?.firstName?.charAt(0) || ''}${currentUser?.lastName?.charAt(0) || ''}`}</span>
                    )}
                  </div>
                  <span className="header__username">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </span>
                  <FiChevronDown size={16} className="header__user-arrow" />
                </button>
                
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div 
                      className="header__dropdown"
                      initial="closed"
                      animate="open"
                      exit="closed"
                      variants={dropdownVariants}
                    >
                      <div className="header__dropdown-arrow"></div>
                      <div className="header__user-info">
                        <div className="header__user-avatar header__user-avatar--lg">
                          {currentUser?.profileImage ? (
                            <img 
                              src={currentUser.profileImage} 
                              alt={`${currentUser.firstName} ${currentUser.lastName}`}
                            />
                          ) : (
                            <span>{`${currentUser?.firstName?.charAt(0) || ''}${currentUser?.lastName?.charAt(0) || ''}`}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="header__user-name">{currentUser?.firstName} {currentUser?.lastName}</h4>
                          <p className="header__user-email">{currentUser?.email}</p>
                        </div>
                      </div>
                      <Link to="/profile" className="header__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <FiUser size={18} />
                        {t('common.profile')}
                      </Link>
                      <Link to="/profile?tab=listings" className="header__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <FiList size={18} />
                        {t('common.myListings')}
                      </Link>
                      <Link to="/profile?tab=favorites" className="header__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <FiHeart size={18} />
                        {t('common.favorites')}
                      </Link>
                      <button 
                        className="header__dropdown-item header__logout" 
                        onClick={handleLogout}
                      >
                        <FiLogOut size={18} />
                        {t('common.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="header__auth">
                <Link to="/login" className="header__auth-btn header__auth-btn--secondary">
                  {t('common.login')}
                </Link>
                <Link to="/register" className="header__auth-btn header__auth-btn--primary">
                  {t('common.register')}
                </Link>
              </div>
            )}
            
            {/* Post Ad Button moved to the end */}
            <Link to="/listings/create" className="header__post-btn">
              <FiPlus size={18} />
              <span>{t('common.postAd')}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 