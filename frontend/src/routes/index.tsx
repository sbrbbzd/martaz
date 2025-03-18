import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TestImagePage from '../pages/TestImagePage';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/test/images" element={<TestImagePage />} />
        {/* Other routes go here */}
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes; 