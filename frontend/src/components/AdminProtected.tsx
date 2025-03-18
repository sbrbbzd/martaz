import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import LoadingSpinner from './common/LoadingSpinner';

const AdminProtected: React.FC = () => {
  const { user, loading, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="admin-loading">
        <LoadingSpinner />
        <p>Loading...</p>
      </div>
    );
  }
  
  // Check if user is authenticated and has admin role
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  
  // User is authenticated and has admin role, render the child routes
  return <Outlet />;
};

export default AdminProtected; 