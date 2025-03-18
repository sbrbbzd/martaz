
import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/api';
import './styles.css'; // We'll create this file next

// Test images
const TEST_IMAGES = [
  // Direct URLs
  'http://localhost:3001/images/placeholder.jpg',
  // API URLs
  getImageUrl('placeholder.jpg'),
  getImageUrl('/tmp/test.jpg'),
  getImageUrl('/test.jpg'),
  // Path variations
  '/tmp/test.jpg',
  'tmp/test.jpg',
  'test.jpg',
  '/test.jpg'
];

const ImageTest = ({ url, index }: { url: string; index: number }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [finalUrl, setFinalUrl] = useState<string>(url);

  // Error handling
  const handleError = () => {
    console.error(`Image #${index} failed to load:`, url);
    setStatus('error');
  };

  // Success handling
  const handleSuccess = () => {
    console.log(`Image #${index} loaded successfully:`, url);
    setStatus('success');
  };

  return (
    <div className="image-test-item">
      <h3>Test Image #{index + 1}</h3>
      <div className="image-details">
        <p><strong>Original URL:</strong> {url}</p>
        <p><strong>Status:</strong> <span className={status}>{status}</span></p>
      </div>
      <div className="image-container">
        {status === 'loading' && <div className="loading">Loading...</div>}
        <img 
          src={url} 
          alt={`Test ${index + 1}`}
          onLoad={handleSuccess}
          onError={handleError}
          style={{ 
            border: status === 'success' ? '2px solid green' : 
                   status === 'error' ? '2px solid red' : '2px solid gray',
            maxWidth: '200px',
            maxHeight: '200px'
          }}
        />
      </div>
    </div>
  );
};

const TestImagePage = () => {
  useEffect(() => {
    // Log the environment
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_API_URL: process.env.REACT_APP_API_URL
    });
    
    // Log the API base URL
    console.log('API Base URL:', process.env.REACT_APP_API_URL || 'http://localhost:3000/api');
  }, []);

  return (
    <div className="test-image-page">
      <h1>Image Loading Test</h1>
      <div className="test-explanation">
        <p>This page tests various image loading scenarios to help debug issues.</p>
      </div>
      
      <div className="test-grid">
        {TEST_IMAGES.map((url, index) => (
          <ImageTest key={index} url={url} index={index} />
        ))}
      </div>
    </div>
  );
};

export default TestImagePage; 