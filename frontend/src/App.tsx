import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '@components/Layout';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminProtected from '@components/AdminProtected';
import AdminFeaturedListingsPage from './pages/AdminPages/FeaturedListingsPage';
import { clearFailedImageCache } from './utils/helpers';

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
const AdminCategories = React.lazy(() => import('@pages/Admin/Categories'));
const CategoryPage = React.lazy(() => import('@pages/ListingsPage')); // Reusing ListingsPage for category view
const TestImagePage = React.lazy(() => import('./pages/TestImagePage'));

const App: React.FC = () => {
  const { t } = useTranslation();
  const [hasFailedImages, setHasFailedImages] = useState(false);

  // Check if there are failed images in localStorage
  useEffect(() => {
    const checkFailedImages = () => {
      try {
        const failedImagesCache = localStorage.getItem('failedImageCache');
        if (failedImagesCache) {
          const parsedCache = JSON.parse(failedImagesCache);
          const hasImages = Object.keys(parsedCache).length > 0;
          setHasFailedImages(hasImages);
        } else {
          setHasFailedImages(false);
        }
      } catch (e) {
        console.error('Error checking failed images cache:', e);
        setHasFailedImages(false);
      }
    };
    
    checkFailedImages();
    
    // Check again when storage changes
    window.addEventListener('storage', checkFailedImages);
    return () => window.removeEventListener('storage', checkFailedImages);
  }, []);

  // Handle clearing the failed images cache
  const handleClearFailedImages = () => {
    clearFailedImageCache();
    setHasFailedImages(false);
    
    // Force a hard reload to clear browser cache
    window.location.href = window.location.href + '?cache=' + Date.now();
  };

  // Add global image error handler
  useEffect(() => {
    // Clear failed images cache on first load
    clearFailedImageCache();
    console.log('Cleared failed images cache on initial page load');
    
    const originalAddEventListener = window.EventTarget.prototype.addEventListener;
    window.EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === 'error' && this instanceof HTMLImageElement) {
        console.error('[DEBUG IMAGE ERROR]', {
          url: this.src || 'unknown',
          element: this.outerHTML,
          target: this
        });
      }
      originalAddEventListener.call(this, type, listener, options);
    };
    
    return () => {
      window.EventTarget.prototype.addEventListener = originalAddEventListener;
    };
  }, []);

  // Check if image server is running
  useEffect(() => {
    const checkImageServer = async () => {
      try {
        // Try to fetch the test endpoint
        const response = await fetch('http://localhost:3001/test', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('Image server is running correctly');
        } else {
          console.error('Image server returned an error:', response.status);
          alert('Warning: Image server is not responding correctly. Images may not load.');
        }
      } catch (error) {
        console.error('Failed to connect to image server:', error);
        alert('Warning: Cannot connect to image server. Images may not load.');
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
      
      {/* Image reload banner */}
      {hasFailedImages && (
        <div className="image-reload-banner">
          <p>Some images failed to load. Click to retry loading all images.</p>
          <button 
            className="image-reload-button"
            onClick={handleClearFailedImages}
          >
            Reload Images
          </button>
        </div>
      )}
      
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Admin routes - notice these are outside the main Layout */}
          <Route path="/admin" element={<AdminProtected />}>
            <Route index element={<AdminFeaturedListingsPage />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="featured" element={<AdminFeaturedListingsPage />} />
          </Route>
          
          {/* Main site routes with common Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="listings" element={<ListingsPage />} />
            <Route path="listings/create" element={<CreateListingPage />} />
            <Route path="listings/:id/edit" element={<EditListingPage />} />
            <Route path="listings/:idOrSlug" element={<ListingDetailPage />} />
            
            {/* Keep existing category routes for backward compatibility */}
            <Route path="categories/:categorySlug" element={<ListingsPage />} />
            <Route path="categories" element={<ListingsPage />} />
            
            {/* Add new direct category route at root level */}
            <Route path=":categorySlug" element={<CategoryPage />} />
            
            <Route path="profile" element={<ProfilePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="test/images" element={<TestImagePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

export default App; 