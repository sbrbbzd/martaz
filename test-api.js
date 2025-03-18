const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const endpoints = [
  '/listings/featured?limit=8',
  '/categories',
  '/listings?limit=8'
];

// Function to make a GET request
function makeGetRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const { statusCode } = res;
      let rawData = '';
      
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve({
            statusCode,
            data: parsedData
          });
        } catch (e) {
          reject(new Error(`Error parsing JSON: ${e.message}, Raw data: ${rawData}`));
        }
      });
    }).on('error', (e) => {
      reject(e);
    });
  });
}

// Test all endpoints
async function testEndpoints() {
  console.log('Testing API endpoints...');
  
  for (const endpoint of endpoints) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`\nTesting: ${url}`);
    
    try {
      const response = await makeGetRequest(url);
      console.log(`Status code: ${response.statusCode}`);
      
      if (response.statusCode === 200) {
        // Log basic info without the full data for brevity
        const { status, data } = response.data;
        console.log(`API status: ${status}`);
        
        if (Array.isArray(data)) {
          console.log(`Data: Array with ${data.length} items`);
          if (data.length > 0) {
            console.log('First item sample:', JSON.stringify(data[0], null, 2).substring(0, 500) + '...');
          }
        } else if (data && data.listings && Array.isArray(data.listings)) {
          console.log(`Data: Paginated with ${data.listings.length} items, total: ${data.total}`);
          if (data.listings.length > 0) {
            console.log('First item sample:', JSON.stringify(data.listings[0], null, 2).substring(0, 500) + '...');
          }
        } else {
          console.log('Data structure:', Object.keys(data || {}));
        }
      } else {
        console.log('Response data:', response.data);
      }
    } catch (error) {
      console.error(`Error testing ${url}:`, error.message);
    }
  }
}

// Run the tests
testEndpoints(); 