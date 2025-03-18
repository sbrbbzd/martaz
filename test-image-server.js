/**
 * Test script to check if the image server is working
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3000;
const IMAGE_SERVER_URL = `http://localhost:${PORT}/api/images`;

// Run tests
console.log('Testing image server connection...');

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

// Check health endpoint
async function testHealth() {
  try {
    console.log(`Testing health endpoint: ${IMAGE_SERVER_URL}/health`);
    const response = await makeRequest(`${IMAGE_SERVER_URL}/health`);
    
    if (response.statusCode === 200) {
      console.log('✅ Image server health check successful');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Directory: ${response.data.directory}`);
    } else {
      console.error('❌ Image server health check failed');
      console.error(`   Status code: ${response.statusCode}`);
      console.error(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    }
    
    return response.statusCode === 200;
  } catch (error) {
    console.error('❌ Error connecting to image server:');
    console.error(`   ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  const healthStatus = await testHealth();
  
  if (healthStatus) {
    console.log('\n✅ Image server is working correctly');
  } else {
    console.log('\n❌ Image server is not working correctly');
    console.log('Possible issues:');
    console.log(`1. Make sure the application is running (./start-servers.sh)`);
    console.log(`2. Check if port ${PORT} is available`);
    console.log('3. Verify that the uploads directory exists and is writable');
    console.log('4. Check the logs for more detailed error information');
  }
}

runTests(); 