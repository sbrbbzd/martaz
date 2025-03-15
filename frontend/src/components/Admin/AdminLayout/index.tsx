import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../../store';
import LoadingSpinner from '../../common/LoadingSpinner';
import {
  FaHome,
  FaTachometerAlt,
  FaUsers,
  FaList,
  FaFolderOpen,
  FaFlag,
  FaComments,
  FaCog,
  FaBars,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronRight
} from 'react-icons/fa';

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
    categories: location.pathname.includes('/admin/categories')
  });
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  
  // Check if user is admin on mount with improved loading handling
  useEffect(() => {
    console.log('AdminLayout - Auth state:', { user, authLoading, isAuthenticated });
    
    // Don't redirect if still loading the auth state
    if (authLoading) {
      console.log('AdminLayout - Auth is still loading, waiting...');
      return;
    }
    
    // If we're authenticated and have user data
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        console.log('AdminLayout - User is admin, allowing access');
        setAuthorized(true);
      } else {
        console.log('AdminLayout - User is not admin, redirecting to home');
        setAuthorized(false);
        navigate('/');
      }
    } else if (!authLoading) {
      // Only redirect if we've finished loading and the user is not authenticated
      console.log('AdminLayout - User is not authenticated, redirecting to login');
      setAuthorized(false);
      navigate('/login');
    }
  }, [user, authLoading, isAuthenticated, navigate]);
  
  const toggleSidebarFunction = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleMenuFunction = (menu: string) => {
    setMenuExpanded(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Show loading state until authorization is determined
  if (authLoading || authorized === null) {
    return (
      <div className="admin-loading">
        <LoadingSpinner />
        <p>Loading Admin Dashboard...</p>
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
          <Link to="/admin" className="admin-logo">
            <img src="/logo.png" alt="Mart.az" />
            {sidebarOpen && <span>Admin Panel</span>}
          </Link>
          <button className="toggle-sidebar" onClick={toggleSidebarFunction}>
            <FaBars />
          </button>
        </div>
        
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <ul className="nav-list">
              <li className="nav-item">
                <Link to="/" className="nav-link">
                  <FaHome />
                  {sidebarOpen && <span>{t('admin.sidebar.mainSite')}</span>}
                </Link>
              </li>
              
              <li className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
                <Link to="/admin" className="nav-link">
                  <FaTachometerAlt />
                  {sidebarOpen && <span>{t('admin.sidebar.dashboard')}</span>}
                </Link>
              </li>
              
              <li className={`nav-item ${location.pathname.includes('/admin/listings') ? 'active' : ''}`}>
                <div 
                  className="nav-link has-submenu"
                  onClick={() => toggleMenuFunction('listings')}
                >
                  <FaList />
                  {sidebarOpen && (
                    <>
                      <span>{t('admin.sidebar.listings')}</span>
                      {menuExpanded.listings ? <FaChevronDown /> : <FaChevronRight />}
                    </>
                  )}
                </div>
                
                {sidebarOpen && menuExpanded.listings && (
                  <ul className="submenu">
                    <li className={isActive('/admin/listings') ? 'active' : ''}>
                      <Link to="/admin/listings">{t('admin.sidebar.allListings')}</Link>
                    </li>
                    <li className={isActive('/admin/listings/pending') ? 'active' : ''}>
                      <Link to="/admin/listings/pending">{t('admin.sidebar.pendingListings')}</Link>
                    </li>
                    <li className={isActive('/admin/listings/reported') ? 'active' : ''}>
                      <Link to="/admin/listings/reported">{t('admin.sidebar.reportedListings')}</Link>
                    </li>
                  </ul>
                )}
              </li>
              
              <li className={`nav-item ${location.pathname.includes('/admin/users') ? 'active' : ''}`}>
                <div 
                  className="nav-link has-submenu"
                  onClick={() => toggleMenuFunction('users')}
                >
                  <FaUsers />
                  {sidebarOpen && (
                    <>
                      <span>{t('admin.sidebar.users')}</span>
                      {menuExpanded.users ? <FaChevronDown /> : <FaChevronRight />}
                    </>
                  )}
                </div>
                
                {sidebarOpen && menuExpanded.users && (
                  <ul className="submenu">
                    <li className={isActive('/admin/users') ? 'active' : ''}>
                      <Link to="/admin/users">{t('admin.sidebar.allUsers')}</Link>
                    </li>
                    <li className={isActive('/admin/users/admins') ? 'active' : ''}>
                      <Link to="/admin/users/admins">{t('admin.sidebar.admins')}</Link>
                    </li>
                  </ul>
                )}
              </li>
              
              <li className={`nav-item ${location.pathname.includes('/admin/categories') ? 'active' : ''}`}>
                <div 
                  className="nav-link has-submenu"
                  onClick={() => toggleMenuFunction('categories')}
                >
                  <FaFolderOpen />
                  {sidebarOpen && (
                    <>
                      <span>{t('admin.sidebar.categories')}</span>
                      {menuExpanded.categories ? <FaChevronDown /> : <FaChevronRight />}
                    </>
                  )}
                </div>
                
                {sidebarOpen && menuExpanded.categories && (
                  <ul className="submenu">
                    <li className={isActive('/admin/categories') ? 'active' : ''}>
                      <Link to="/admin/categories">{t('admin.sidebar.manageCategories')}</Link>
                    </li>
                    <li className={isActive('/admin/categories/attributes') ? 'active' : ''}>
                      <Link to="/admin/categories/attributes">{t('admin.sidebar.categoryAttributes')}</Link>
                    </li>
                  </ul>
                )}
              </li>
              
              <li className={`nav-item ${isActive('/admin/reports') ? 'active' : ''}`}>
                <Link to="/admin/reports" className="nav-link">
                  <FaFlag />
                  {sidebarOpen && <span>{t('admin.sidebar.reports')}</span>}
                </Link>
              </li>
              
              <li className={`nav-item ${isActive('/admin/messages') ? 'active' : ''}`}>
                <Link to="/admin/messages" className="nav-link">
                  <FaComments />
                  {sidebarOpen && <span>{t('admin.sidebar.messages')}</span>}
                </Link>
              </li>
              
              <li className={`nav-item ${isActive('/admin/settings') ? 'active' : ''}`}>
                <Link to="/admin/settings" className="nav-link">
                  <FaCog />
                  {sidebarOpen && <span>{t('admin.sidebar.settings')}</span>}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="sidebar-footer">
          <div className="admin-info">
            {sidebarOpen && (
              <div className="admin-details">
                <div className="admin-name">{user?.firstName} {user?.lastName}</div>
                <div className="admin-role">{t('admin.sidebar.adminRole')}</div>
              </div>
            )}
          </div>
          
          <button 
            className="logout-button"
            onClick={() => {
              // In a real implementation, this would dispatch a logout action
              navigate('/login');
            }}
          >
            <FaSignOutAlt />
            {sidebarOpen && <span>{t('admin.sidebar.logout')}</span>}
          </button>
        </div>
      </aside>
      
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout; 