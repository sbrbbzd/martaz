// Test script to verify CORS headers on the image server
const axios = require('axios');

async function testCORS() {
  try {
    console.log('Testing CORS headers on image server...');
    
    // Test a specific image
    const imageUrl = 'http://localhost:3001/images/1d740ba3-b958-4447-993a-50a47b82f9a1.png';
    console.log(`Testing image URL: ${imageUrl}`);
    
    // Make an OPTIONS request to check CORS headers
    const response = await axios({
      method: 'OPTIONS',
      url: imageUrl,
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    console.log('Response headers:');
    console.log(response.headers);
    
    // Check for key CORS headers
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-allow-credentials'
    ];
    
    const missingHeaders = corsHeaders.filter(header => !response.headers[header]);
    
    if (missingHeaders.length === 0) {
      console.log('✅ All CORS headers are present');
      
      // Check if origin is properly set
      if (response.headers['access-control-allow-origin'] === '*' || 
          response.headers['access-control-allow-origin'] === 'http://localhost:5173') {
        console.log('✅ Origin is properly set');
      } else {
        console.log('❌ Origin is not properly set:', response.headers['access-control-allow-origin']);
      }
    } else {
      console.log('❌ Missing CORS headers:', missingHeaders);
    }
    
    // Now try an actual GET request
    console.log('\nTesting actual GET request...');
    const getResponse = await axios.get(imageUrl, {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    
    console.log('GET response status:', getResponse.status);
    console.log('GET response headers:');
    console.log(getResponse.headers);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing CORS:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response headers:', error.response.headers);
    }
  }
}

testCORS(); 