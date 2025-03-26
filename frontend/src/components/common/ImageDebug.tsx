import React, { useState, useEffect } from 'react';
import { getImageUrl, getImageServerBaseUrl, getPlaceholderImageUrl } from '../../utils/helpers';

const ImageDebug: React.FC = () => {
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    url: string;
    success: boolean;
    message: string;
  }>>([]);
  
  const [loading, setLoading] = useState(true);
  const imageServerBaseUrl = getImageServerBaseUrl();
  const placeholderImage = getPlaceholderImageUrl();
  
  // Test cases to diagnose the issue
  const testCases = [
    {
      name: "UUID Image Direct",
      url: "792fbaac-a6e4-47f1-89ea-856f3838d65b.png",
    },
    {
      name: "UUID Image with Curly Braces",
      url: "{792fbaac-a6e4-47f1-89ea-856f3838d65b.png}",
    },
    {
      name: "UUID Image with Full Path",
      url: `${imageServerBaseUrl}/792fbaac-a6e4-47f1-89ea-856f3838d65b.png`,
    },
    {
      name: "UUID Image with Leading Slash",
      url: "/792fbaac-a6e4-47f1-89ea-856f3838d65b.png",
    },
    {
      name: "Placeholder Image",
      url: placeholderImage,
    },
    {
      name: "External Image",
      url: "https://picsum.photos/200/300",
    }
  ];
  
  const testImageLoad = (imageUrl: string): Promise<{success: boolean, message: string}> => {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          success: true,
          message: `Loaded successfully (${img.naturalWidth}x${img.naturalHeight})`
        });
      };
      
      img.onerror = (error) => {
        resolve({
          success: false,
          message: `Failed to load: ${error}`
        });
      };
      
      // Set crossOrigin to handle CORS issues
      img.crossOrigin = "anonymous";
      
      // Set the src to trigger loading
      img.src = imageUrl;
      
      // Set a timeout just in case
      setTimeout(() => {
        if (!img.complete) {
          resolve({
            success: false,
            message: "Timed out after 5 seconds"
          });
        }
      }, 5000);
    });
  };
  
  useEffect(() => {
    const runTests = async () => {
      const results = [];
      
      console.log("Starting image diagnostic tests...");
      console.log("Image server base URL:", imageServerBaseUrl);
      
      for (const test of testCases) {
        const processedUrl = getImageUrl(test.url);
        console.log(`Testing ${test.name}:`, {
          original: test.url,
          processed: processedUrl
        });
        
        const result = await testImageLoad(processedUrl);
        
        results.push({
          name: test.name,
          url: processedUrl,
          success: result.success,
          message: result.message
        });
      }
      
      setTestResults(results);
      setLoading(false);
    };
    
    runTests();
  }, []);
  
  return (
    <div className="image-debug" style={{ padding: '20px' }}>
      <h2>Image Loading Diagnostic</h2>
      <p>Image Server Base URL: {imageServerBaseUrl}</p>
      <p>Placeholder Image URL: {placeholderImage}</p>
      
      {loading ? (
        <p>Running diagnostics...</p>
      ) : (
        <div className="test-results">
          <h3>Test Results</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Test</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>URL</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Message</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map((test, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{test.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{test.url}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', color: test.success ? 'green' : 'red' }}>
                    {test.success ? 'Success' : 'Failed'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{test.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <h3>Live Image Tests</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {testCases.map((test, index) => (
              <div key={index} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                <h4>{test.name}</h4>
                <p style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{getImageUrl(test.url)}</p>
                <img 
                  src={getImageUrl(test.url)} 
                  alt={test.name}
                  style={{ maxWidth: '100%', height: 'auto' }}
                  crossOrigin="anonymous"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDebug; 