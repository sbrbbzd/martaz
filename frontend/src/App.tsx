import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '@components/Layout';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy-loaded pages for better performance
const HomePage = React.lazy(() => import('@pages/HomePage'));
const ListingsPage = React.lazy(() => import('@pages/ListingsPage'));
const ListingDetailPage = React.lazy(() => import('@pages/ListingDetailPage'));
const CreateListingPage = React.lazy(() => import('@pages/CreateListingPage'));
const ProfilePage = React.lazy(() => import('@pages/ProfilePage'));
const LoginPage = React.lazy(() => import('@pages/LoginPage'));
const RegisterPage = React.lazy(() => import('@pages/RegisterPage'));
const NotFoundPage = React.lazy(() => import('@pages/NotFoundPage'));
const AdminDashboard = React.lazy(() => import('@pages/Admin/Dashboard'));

const App: React.FC = () => {
  const { t } = useTranslation();

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
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Main site routes with common Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="listings" element={<ListingsPage />} />
            <Route path="listings/create" element={<CreateListingPage />} />
            <Route path="listings/:id" element={<ListingDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

export default App; 