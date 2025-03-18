/**
 * Test script to check if the APIs are working correctly
 */
const http = require('http');

// Configuration
const PORT = process.env.PORT || 3000;
const API_BASE_URL = `http://localhost:${PORT}/api`;

// Endpoints to test
const endpoints = [
  { path: '', description: 'API Root' },
  { path: '/test', description: 'API Test Route' },
  { path: '/categories', description: 'Categories API' },
  { path: '/listings', description: 'Listings API' },
  { path: '/users', description: 'Users API' },
  { path: '/auth', description: 'Auth API' },
  { path: '/images/health', description: 'Image Server Health' },
  { path: '/debug/routes', description: 'Debug Routes Information' }
];

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    console.log(`Making ${method} request to: ${url}`);
    
    const req = http.request(url, { method }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = data ? JSON.parse(data) : { statusCode: res.statusCode };
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Test a specific endpoint
async function testEndpoint(endpoint) {
  try {
    const url = API_BASE_URL + endpoint.path;
    console.log(`\nTesting ${endpoint.description}: ${url}`);
    
    const response = await makeRequest(url);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(`✅ ${endpoint.description} - Status: ${response.statusCode}`);
      
      // Print a brief summary of the response data
      if (typeof response.data === 'object') {
        // Show the keys in the response
        console.log(`   Response keys: ${Object.keys(response.data).join(', ')}`);
        
        // If it's an array, show the count and first few items
        if (Array.isArray(response.data)) {
          console.log(`   Found ${response.data.length} items`);
          if (response.data.length > 0) {
            console.log(`   First item keys: ${Object.keys(response.data[0]).join(', ')}`);
          }
        }
      } else {
        console.log(`   Response: ${response.data.substring(0, 100)}...`);
      }
    } else {
      console.error(`❌ ${endpoint.description} - Status: ${response.statusCode}`);
      console.error(`   Error: ${typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data}`);
    }
    
    return response.statusCode >= 200 && response.statusCode < 300;
  } catch (error) {
    console.error(`❌ Error testing ${endpoint.description}:`);
    console.error(`   ${error.message}`);
    return false;
  }
}

// Run all API tests
async function runTests() {
  console.log(`Testing API endpoints on ${API_BASE_URL}`);
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  console.log('\n=== Test Summary ===');
  console.log(`Total endpoints tested: ${endpoints.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  
  if (failureCount > 0) {
    console.log('\nPossible issues:');
    console.log('1. Make sure the application is running (./start-servers.sh)');
    console.log('2. Check if port 3000 is available');
    console.log('3. Verify that the API routes are correctly registered');
    console.log('4. Look at the server logs for errors');
    console.log('\nDebugging tips:');
    console.log('1. Check /api/debug/routes for route registration info');
    console.log('2. Make sure the backend app.js and index.js route paths align');
    console.log('3. Check for HTTP status errors in the response');
  }
}

// Run the tests
runTests(); 