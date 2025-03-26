import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  FiUser,
  FiHeart,
  FiList,
  FiLogOut
} from 'react-icons/fi';

// Import from store
import { RootState, AppDispatch } from '../../store/types';
import { getCurrentUser } from '../../store/slices/authSlice';

// Import components
import UserInfoTab from './components/UserInfoTab';
import FavoritesTab from './components/FavoritesTab';
import MyListingsTab from './components/MyListingsTab';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Container from '../../components/common/Container';

// Import styles
import '../../styles/pages/_profile.scss';

// Tab constants
enum TABS {
  INFO = 'info',
  FAVORITES = 'favorites',
  LISTINGS = 'listings',
}

const ProfilePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get authentication state from Redux store
  const auth = useSelector((state: RootState) => state.auth);
  const { user, isAuthenticated } = auth;
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(true);
  
  const { t } = useTranslation();
  
  // Extract the tab from the URL, default to INFO
  const [activeTab, setActiveTab] = useState<TABS>(
    location.pathname.includes('favorites')
      ? TABS.FAVORITES
      : location.pathname.includes('listings')
        ? TABS.LISTINGS
        : TABS.INFO
  );

  // Listen for profile updates and refresh user data
  useEffect(() => {
    const handleProfileUpdate = () => {
      // Refresh user data from server
      dispatch(getCurrentUser());
    };

    // Add event listener
    window.addEventListener('user-profile-updated', handleProfileUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, [dispatch]);
  
  useEffect(() => {
    // Check authentication status and update loading state
    if (isAuthenticated !== null) {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Debug log when user data changes
  useEffect(() => {
    console.log('ProfilePage: User data changed:', user);
  }, [user]);

  // Handle tab changes
  const handleTabChange = (tab: TABS) => {
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    const newParams = new URLSearchParams(location.search);
    newParams.set('tab', tab);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  };

  // Render appropriate tab based on activeTab
  const renderTab = () => {
    if (!user) return null;
    
    switch (activeTab) {
      case TABS.INFO:
        return <UserInfoTab user={user} key={`user-info-${user.id}-${Date.now()}`} />;
      case TABS.LISTINGS:
        return <MyListingsTab />;
      case TABS.FAVORITES:
        return <FavoritesTab />;
      default:
        return <UserInfoTab user={user} key={`user-info-${user.id}-${Date.now()}`} />;
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page__loading">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Helmet>
        <title>{t('profile.title')} | Mart.az</title>
        <meta name="description" content={t('profile.metaDescription')} />
      </Helmet>
      
      <Container size="xl">
        <div className="profile-page__layout">
          {/* Sidebar (desktop) */}
          <div className="profile-page__sidebar">
            <div className="profile-page__user">
              <div className="profile-page__avatar">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.firstName || ''} />
                ) : (
                  <div className="profile-page__avatar-initials">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                      )}
                    </div>
              <h3 className="profile-page__user-name">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="profile-page__user-email">{user?.email}</p>
                  </div>
                  
            <nav className="profile-page__nav">
              <button
                className={`profile-page__nav-item ${activeTab === TABS.INFO ? 'active' : ''}`}
                onClick={() => handleTabChange(TABS.INFO)}
              >
                <FiUser className="profile-page__nav-icon" />
                <span>{t('profile.tabs.info')}</span>
              </button>
              
                      <button 
                className={`profile-page__nav-item ${activeTab === TABS.LISTINGS ? 'active' : ''}`}
                onClick={() => handleTabChange(TABS.LISTINGS)}
                      >
                <FiList className="profile-page__nav-icon" />
                <span>{t('profile.tabs.listings')}</span>
                      </button>
                      
                      <button 
                className={`profile-page__nav-item ${activeTab === TABS.FAVORITES ? 'active' : ''}`}
                onClick={() => handleTabChange(TABS.FAVORITES)}
                      >
                <FiHeart className="profile-page__nav-icon" />
                <span>{t('profile.tabs.favorites')}</span>
                      </button>
              
              <Link to="/auth/logout" className="profile-page__nav-item profile-page__logout">
                <FiLogOut className="profile-page__nav-icon" />
                <span>{t('profile.logout')}</span>
                  </Link>
            </nav>
                </div>
                
          {/* Main content */}
          <div className="profile-page__content">
            {/* Mobile tabs */}
            <div className="profile-page__mobile-tabs">
                        <button
                className={`profile-page__mobile-tab ${activeTab === TABS.INFO ? 'active' : ''}`}
                onClick={() => handleTabChange(TABS.INFO)}
              >
                <FiUser className="profile-page__tab-icon" />
                <span>{t('profile.tabs.info')}</span>
                        </button>
              
                                <button 
                className={`profile-page__mobile-tab ${activeTab === TABS.LISTINGS ? 'active' : ''}`}
                onClick={() => handleTabChange(TABS.LISTINGS)}
                                >
                <FiList className="profile-page__tab-icon" />
                <span>{t('profile.tabs.listings')}</span>
                                </button>
              
                        <button 
                className={`profile-page__mobile-tab ${activeTab === TABS.FAVORITES ? 'active' : ''}`}
                onClick={() => handleTabChange(TABS.FAVORITES)}
                        >
                <FiHeart className="profile-page__tab-icon" />
                <span>{t('profile.tabs.favorites')}</span>
                        </button>
                      </div>

            {/* Tab content */}
            <div className="profile-page__tab-content">
              {renderTab()}
              </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProfilePage; 