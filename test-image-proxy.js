const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:3000/api';
const IMAGE_SERVER_URL = 'http://localhost:3001';
const PLACEHOLDER = '/images/placeholder.jpg';

async function testImageProxy() {
  console.log('===== Image Proxy Test =====');
  
  try {
    // Test 1: Direct image server access
    console.log('\n1. Testing direct image server access');
    try {
      const response = await axios.get(`${IMAGE_SERVER_URL}/test`, { 
        validateStatus: () => true 
      });
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.error('Error accessing image server directly:', error.message);
    }
    
    // Test 2: API proxy for placeholder
    console.log('\n2. Testing API proxy for placeholder image');
    try {
      const response = await axios.get(`${API_URL}/images/placeholder.jpg`, { 
        maxRedirects: 0,
        validateStatus: () => true 
      });
      console.log(`Status: ${response.status}`);
      if (response.status >= 300 && response.status < 400) {
        console.log(`Redirect location: ${response.headers.location}`);
      }
    } catch (error) {
      if (error.response && error.response.headers.location) {
        console.log(`Redirect location: ${error.response.headers.location}`);
      } else {
        console.error('Error accessing placeholder via API:', error.message);
      }
    }
    
    // Test 3: API proxy for tmp path
    console.log('\n3. Testing API proxy for /tmp/ path');
    try {
      const response = await axios.get(`${API_URL}/images/tmp/test.jpg`, { 
        maxRedirects: 0,
        validateStatus: () => true 
      });
      console.log(`Status: ${response.status}`);
      if (response.status >= 300 && response.status < 400) {
        console.log(`Redirect location: ${response.headers.location}`);
      }
    } catch (error) {
      if (error.response && error.response.headers.location) {
        console.log(`Redirect location: ${error.response.headers.location}`);
      } else {
        console.error('Error accessing tmp path via API:', error.message);
      }
    }
    
    // Test 4: API proxy for other image
    console.log('\n4. Testing API proxy for regular image');
    try {
      const response = await axios.get(`${API_URL}/images/test.jpg`, { 
        maxRedirects: 0,
        validateStatus: () => true 
      });
      console.log(`Status: ${response.status}`);
      if (response.status >= 300 && response.status < 400) {
        console.log(`Redirect location: ${response.headers.location}`);
      }
    } catch (error) {
      if (error.response && error.response.headers.location) {
        console.log(`Redirect location: ${error.response.headers.location}`);
      } else {
        console.error('Error accessing regular image via API:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  
  console.log('\n===== Test Complete =====');
}

// Run the test
testImageProxy().catch(console.error); 