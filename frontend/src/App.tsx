import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '@components/Layout';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminProtected from '@components/AdminProtected';
import AdminFeaturedListingsPage from './pages/AdminPages/FeaturedListingsPage';
import ImageDebug from './components/common/ImageDebug';

// Theme action creator function (simplified)
const setTheme = (theme: 'light' | 'dark') => ({ type: 'theme/setTheme', payload: theme });

// Lazy-loaded pages for better performance
const HomePage = React.lazy(() => import('@pages/HomePage'));
const ListingsPage = React.lazy(() => import('@pages/ListingsPage'));
const ListingDetailPage = React.lazy(() => import('@pages/ListingDetailPage'));
const CreateListingPage = React.lazy(() => import('@pages/CreateListingPage'));
const EditListingPage = React.lazy(() => import('@pages/EditListingPage'));
const ProfilePage = React.lazy(() => import('@pages/ProfilePage'));
const LoginPage = React.lazy(() => import('@pages/LoginPage'));
const RegisterPage = React.lazy(() => import('@pages/RegisterPage'));
const NotFoundPage = React.lazy(() => import('@pages/NotFoundPage'));
const AdminDashboard = React.lazy(() => import('@pages/Admin/Dashboard'));
const AdminUsers = React.lazy(() => import('@pages/Admin/Users'));
const AdminListings = React.lazy(() => import('@pages/Admin/Listings'));
const AdminReportedListings = React.lazy(() => import('@pages/Admin/Listings/ReportedListingsPage'));
const AdminFeaturedListings = React.lazy(() => import('@pages/Admin/Listings/FeaturedListingsPage'));
const AdminCategories = React.lazy(() => import('@pages/Admin/Categories'));
const AdminSEO = React.lazy(() => import('@pages/Admin/SEO'));
const CategoryPage = React.lazy(() => import('@pages/ListingsPage')); // Reusing ListingsPage for category view
const FavoritesPage = React.lazy(() => import('@pages/Favorites'));
// Remove or comment out the ImageDebugPage import until the module is available
// const ImageDebugPage = React.lazy(() => import('./pages/ImageDebugPage'));

// Declare global type augmentation at the file top level
declare global {
  interface Window {
    __placeholderImage?: string;
  }
}

const App: React.FC = () => {
  const { t } = useTranslation();
  const [hasFailedImages, setHasFailedImages] = useState(false);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const dispatch = useDispatch();
  
  // Get the static placeholder path
  const staticPlaceholder = '/placeholder.jpg';

  useEffect(() => {
    // Check for failed images and show notification if needed
    const checkFailedImages = () => {
      const failedImages = JSON.parse(localStorage.getItem('failedImages') || '[]');
      setHasFailedImages(failedImages.length > 0);
      
      if (failedImages.length > 0) {
        setShowErrorNotification(true);
        
        // Auto-hide the notification after 5 seconds
        const timeoutId = setTimeout(() => {
          setShowErrorNotification(false);
        }, 5000);
        
        return () => clearTimeout(timeoutId);
      }
      
      // Return a default value to ensure all code paths return a value
      return undefined;
    };
    
    // Check for failed images on app load and every minute
    checkFailedImages();
    const intervalId = setInterval(checkFailedImages, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Handle clearing the failed images registry
  const handleClearFailedImages = () => {
    localStorage.removeItem('failedImages');
    setHasFailedImages(false);
    setShowErrorNotification(false);
    
    // Force a reload to clear any stale image states
    window.location.reload();
  };
  
  // Check theme preference and set initial theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      dispatch(setTheme(savedTheme as 'light' | 'dark'));
    } else {
      // Check for system theme preference
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDarkMode);
      dispatch(setTheme(isDarkMode ? 'dark' : 'light'));
    }
  }, [dispatch]);
  
  // Check if the image server is available
  useEffect(() => {
    const checkImageServer = async () => {
      const imageServerUrl = import.meta.env.VITE_IMAGE_SERVER_URL || 'http://localhost:3001/api/images';
      
      // Set a timeout for the check - don't block the app startup
      const timeoutId = setTimeout(() => {
        console.log('Image server check timed out');
        // Use the static placeholder as fallback
        window.__placeholderImage = staticPlaceholder;
      }, 3000);
      
      try {
        const response = await fetch(`${imageServerUrl}/placeholder.jpg`, {
          method: 'HEAD',
          cache: 'no-store',
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('Image server is running correctly');
          // Use the server's placeholder
          window.__placeholderImage = `${imageServerUrl}/placeholder.jpg`;
        } else {
          console.log('Note: Image server check returned status:', response.status);
          console.log('Image server not available - using static placeholder instead');
          // Store the static placeholder for use throughout the app
          window.__placeholderImage = staticPlaceholder;
        }
      } catch (error) {
        // Log as info instead of error to avoid alarming console messages
        // This is just a diagnostic check and doesn't affect core functionality
        console.log('Info: Image server check failed, but this will not affect the app functionality.');
        console.log('Using static placeholder for all placeholder images');
        // Store the static placeholder for use throughout the app  
        window.__placeholderImage = staticPlaceholder;
      }
    };
    
    // Check the image server status
    checkImageServer();
  }, []);

  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        aria-label="notifications"
      />
      
      
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Admin routes - notice these are outside the main Layout */}
          <Route path="/admin" element={<AdminProtected />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="listings/reported" element={<AdminReportedListings />} />
            <Route path="listings/featured" element={<AdminFeaturedListings />} />
            <Route path="listings/edit/:id" element={<EditListingPage />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="seo" element={<AdminSEO />} />
          </Route>
          
          {/* Main site routes with common Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="listings" element={<ListingsPage />} />
            <Route path="listings/create" element={<CreateListingPage />} />
            <Route path="listings/:id/edit" element={<EditListingPage />} />
            <Route path="listings/:idOrSlug" element={<ListingDetailPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            
            {/* Keep existing category routes for backward compatibility */}
            <Route path="categories/:categorySlug" element={<ListingsPage />} />
            <Route path="categories" element={<ListingsPage />} />
            
            {/* Add new direct category route at root level */}
            <Route path=":categorySlug" element={<CategoryPage />} />
            
            <Route path="profile" element={<ProfilePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="debug/images" element={<ImageDebug />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

export default App; 