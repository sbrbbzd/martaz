import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../../store';
import LoadingSpinner from '../../common/LoadingSpinner';
import {
  FiHome,
  FiGrid,
  FiUsers,
  FiList,
  FiFolder,
  FiFlag,
  FiMessageSquare,
  FiSettings,
  FiMenu,
  FiLogOut,
  FiChevronDown,
  FiChevronRight,
  FiBarChart2,
  FiPackage,
  FiShoppingBag,
  FiDollarSign,
  FiActivity,
  FiSearch
} from 'react-icons/fi';
import './styles.scss';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuExpanded, setMenuExpanded] = useState<{[key: string]: boolean}>({
    listings: location.pathname.includes('/admin/listings'),
    users: location.pathname.includes('/admin/users'),
    categories: location.pathname.includes('/admin/categories'),
    reports: location.pathname.includes('/admin/reports')
  });
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  
  // Check if user is admin on mount with improved loading handling
  useEffect(() => {
    // Don't redirect if still loading the auth state
    if (authLoading) {
      return;
    }
    
    // If we're authenticated and have user data
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        navigate('/');
      }
    } else if (!authLoading) {
      // Only redirect if we've finished loading and the user is not authenticated
      setAuthorized(false);
      navigate('/login');
    }
  }, [user, authLoading, isAuthenticated, navigate]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleMenu = (menu: string) => {
    setMenuExpanded(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isActiveOrSubActive = (path: string) => {
    return location.pathname.startsWith(path);
  };
  
  // Show loading state until authorization is determined
  if (authLoading || authorized === null) {
    return (
      <div className="admin-loading">
        <LoadingSpinner />
        <p>{t('admin.loading.dashboard', 'Loading Admin Dashboard...')}</p>
      </div>
    );
  }
  
  // Not authorized, don't render anything (redirect will happen in the useEffect)
  if (!authorized) {
    return null;
  }
  
  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="admin-sidebar">
        <div className="sidebar-header">
        
          <button className="toggle-sidebar" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <FiMenu />
          </button>
        </div>
        
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <ul className="nav-list">
              <li className="nav-item">
                <Link to="/" className="nav-link">
                  <FiHome />
                  {sidebarOpen && <span>{t('common.home', 'Home')}</span>}
                </Link>
              </li>
              
              <li className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
                <Link to="/admin" className="nav-link">
                  <FiGrid />
                  {sidebarOpen && <span>{t('admin.dashboard.title', 'Dashboard')}</span>}
                </Link>
              </li>
              
              <li className={`nav-item ${isActiveOrSubActive('/admin/listings') ? 'active' : ''}`}>
                <div 
                  className="nav-link has-submenu"
                  onClick={() => toggleMenu('listings')}
                >
                  <FiPackage />
                  {sidebarOpen && (
                    <>
                      <span>{t('admin.sidebar.listings', 'Listings')}</span>
                      <span className="submenu-icon">
                        {menuExpanded.listings ? <FiChevronDown /> : <FiChevronRight />}
                      </span>
                    </>
                  )}
                </div>
                
                {sidebarOpen && menuExpanded.listings && (
                  <ul className="submenu">
                    <li className={isActive('/admin/listings') ? 'active' : ''}>
                      <Link to="/admin/listings">
                        <span className="submenu-dot"></span>
                        {t('admin.all', 'All Listings')}
                      </Link>
                    </li>
                    <li className={isActive('/admin/listings/reported') ? 'active' : ''}>
                      <Link to="/admin/listings/reported">
                        <span className="submenu-dot"></span>
                        {t('admin.reported_listings', 'Reported Listings')}
                      </Link>
                    </li>
                    <li className={isActive('/admin/listings/featured') ? 'active' : ''}>
                      <Link to="/admin/listings/featured">
                        <span className="submenu-dot"></span>
                        {t('admin.featured_listings', 'Featured Listings')}
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              
              <li className={`nav-item ${isActiveOrSubActive('/admin/users') ? 'active' : ''}`}>
                <div 
                  className="nav-link has-submenu"
                  onClick={() => toggleMenu('users')}
                >
                  <FiUsers />
                  {sidebarOpen && (
                    <>
                      <span>{t('admin.sidebar.users', 'Users')}</span>
                      <span className="submenu-icon">
                        {menuExpanded.users ? <FiChevronDown /> : <FiChevronRight />}
                      </span>
                    </>
                  )}
                </div>
                
                {sidebarOpen && menuExpanded.users && (
                  <ul className="submenu">
                    <li className={isActive('/admin/users') ? 'active' : ''}>
                      <Link to="/admin/users">
                        <span className="submenu-dot"></span>
                        {t('admin.all_users', 'All Users')}
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              
              <li className={`nav-item ${isActiveOrSubActive('/admin/categories') ? 'active' : ''}`}>
                <div 
                  className="nav-link has-submenu"
                  onClick={() => toggleMenu('categories')}
                >
                  <FiFolder />
                  {sidebarOpen && (
                    <>
                      <span>{t('admin.sidebar.categories', 'Categories')}</span>
                      <span className="submenu-icon">
                        {menuExpanded.categories ? <FiChevronDown /> : <FiChevronRight />}
                      </span>
                    </>
                  )}
                </div>
                
                {sidebarOpen && menuExpanded.categories && (
                  <ul className="submenu">
                    <li className={isActive('/admin/categories') ? 'active' : ''}>
                      <Link to="/admin/categories">
                        <span className="submenu-dot"></span>
                        {t('admin.manage_categories', 'Manage Categories')}
                      </Link>
                    </li>
                    <li className={isActive('/admin/categories/attributes') ? 'active' : ''}>
                      <Link to="/admin/categories/attributes">
                        <span className="submenu-dot"></span>
                        {t('admin.category_attributes', 'Category Attributes')}
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              
              <li className={`nav-item ${isActiveOrSubActive('/admin/reports') ? 'active' : ''}`}>
                <div 
                  className="nav-link has-submenu"
                  onClick={() => toggleMenu('reports')}
                >
                  <FiBarChart2 />
                  {sidebarOpen && (
                    <>
                      <span>{t('admin.sidebar.reports', 'Reports')}</span>
                      <span className="submenu-icon">
                        {menuExpanded.reports ? <FiChevronDown /> : <FiChevronRight />}
                      </span>
                    </>
                  )}
                </div>
                
                {sidebarOpen && menuExpanded.reports && (
                  <ul className="submenu">
                    <li className={isActive('/admin/reports/users') ? 'active' : ''}>
                      <Link to="/admin/reports/users">
                        <span className="submenu-dot"></span>
                        {t('admin.user_reports', 'User Reports')}
                      </Link>
                    </li>
                    <li className={isActive('/admin/reports/listings') ? 'active' : ''}>
                      <Link to="/admin/reports/listings">
                        <span className="submenu-dot"></span>
                        {t('admin.listing_reports', 'Listing Reports')}
                      </Link>
                    </li>
                    <li className={isActive('/admin/reports/sales') ? 'active' : ''}>
                      <Link to="/admin/reports/sales">
                        <span className="submenu-dot"></span>
                        {t('admin.sales_reports', 'Sales Reports')}
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              
              <li className={`nav-item ${isActive('/admin/seo') ? 'active' : ''}`}>
                <Link to="/admin/seo" className="nav-link">
                  <FiSearch />
                  {sidebarOpen && <span>{t('admin.sidebar.seo', 'SEO Management')}</span>}
                </Link>
              </li>
              
              <li className={`nav-item ${isActive('/admin/messages') ? 'active' : ''}`}>
                <Link to="/admin/messages" className="nav-link">
                  <FiMessageSquare />
                  {sidebarOpen && <span>{t('admin.sidebar.messages', 'Messages')}</span>}
                </Link>
              </li>
              
              <li className={`nav-item ${isActive('/admin/settings') ? 'active' : ''}`}>
                <Link to="/admin/settings" className="nav-link">
                  <FiSettings />
                  {sidebarOpen && <span>{t('admin.sidebar.settings', 'Settings')}</span>}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="sidebar-footer">
          {user && (
            <div className="admin-info">
              <div className="admin-avatar">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} />
                ) : (
                  <div className="avatar-placeholder">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                )}
              </div>
              {sidebarOpen && (
                <div className="admin-details">
                  <div className="admin-name">{user.firstName} {user.lastName}</div>
                  <div className="admin-role">{t('admin.sidebar.adminRole', 'Administrator')}</div>
                </div>
              )}
            </div>
          )}
          
          <button 
            className="logout-button"
            onClick={() => {
              // In a real implementation, this would dispatch a logout action
              navigate('/login');
            }}
          >
            <FiLogOut />
            {sidebarOpen && <span>{t('admin.sidebar.logout', 'Logout')}</span>}
          </button>
        </div>
      </aside>
      
      <main className="admin-content">
        <header className="admin-header">
          <div className="header-left">
            <button className="mobile-menu-toggle" onClick={toggleSidebar}>
              <FiMenu />
            </button>
            <h1 className="page-title">
              {location.pathname === '/admin' && t('admin.dashboard.title', 'Dashboard')}
              {location.pathname.includes('/admin/listings') && t('admin.sidebar.listings', 'Listings')}
              {location.pathname.includes('/admin/users') && t('admin.sidebar.users', 'Users')}
              {location.pathname.includes('/admin/categories') && t('admin.sidebar.categories', 'Categories')}
              {location.pathname.includes('/admin/reports') && t('admin.sidebar.reports', 'Reports')}
              {location.pathname.includes('/admin/seo') && t('admin.sidebar.seo', 'SEO Management')}
              {location.pathname.includes('/admin/messages') && t('admin.sidebar.messages', 'Messages')}
              {location.pathname.includes('/admin/settings') && t('admin.sidebar.settings', 'Settings')}
            </h1>
          </div>
          <div className="header-right">
            <div className="header-actions">
              {/* Add header actions here if needed */}
            </div>
          </div>
        </header>
        
        <div className="admin-content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 