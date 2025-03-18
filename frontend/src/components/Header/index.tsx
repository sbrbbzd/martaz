import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { selectIsAuthenticated, selectAuthUser, logout } from '@store/slices/authSlice';
import LanguageSwitcher from '@components/LanguageSwitcher';
import { FiUser, FiList, FiLogOut, FiPlus, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
  
  // Animation variants
  const dropdownVariants = {
    closed: { opacity: 0, y: -5, scale: 0.95, transition: { duration: 0.2 } },
    open: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } }
  };

  return (
    <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
      <div className="container">
        <div className="header__content">
          <div className="header__logo">
            <Link to="/" aria-label="Mart.az Home">
              <img src="/assets/icons/logo.svg" alt="Mart.az" width="120" height="40" />
            </Link>
          </div>

          <button 
            className={`header__menu-toggle ${isMenuOpen ? 'header__menu-toggle--active' : ''}`} 
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? t('common.closeMenu') : t('common.openMenu')}
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          <nav className={`header__nav ${isMenuOpen ? 'header__nav--active' : ''}`}>
            <ul className="header__menu">
              <li className="header__menu-item">
                <Link 
                  to="/" 
                  className={`header__menu-link ${location.pathname === '/' ? 'header__menu-link--active' : ''}`}
                >
                  {t('common.home')}
                </Link>
              </li>
              <li className="header__menu-item">
                <Link 
                  to="/listings" 
                  className={`header__menu-link ${location.pathname === '/listings' ? 'header__menu-link--active' : ''}`}
                >
                  {t('common.listings')}
                </Link>
              </li>
            
            </ul>
            
            {/* Mobile language */}
            <div className="header__mobile-features">
              <div className="header__mobile-language">
                <LanguageSwitcher />
              </div>
            </div>
          </nav>

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
                      <img src={currentUser.profileImage} alt={`${currentUser.firstName} ${currentUser.lastName}`} />
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
                            <img src={currentUser.profileImage} alt={`${currentUser.firstName} ${currentUser.lastName}`} />
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
                      <Link to="/my-listings" className="header__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <FiList size={18} />
                        {t('common.myListings')}
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
            
            <Link to="/listings/create" className="header__post-btn">
              <div className="header__post-btn-icon">
                <FiPlus size={18} />
              </div>
              <span>{t('common.postAd')}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 