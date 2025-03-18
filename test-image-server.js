const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const IMAGE_SERVER_URL = 'http://localhost:3001';
const TMP_DIR = path.resolve('../tmp');

async function testImageServer() {
  console.log('===== Image Server Test =====');
  
  try {
    // Test 1: Server connectivity
    console.log('\n1. Testing server connectivity');
    try {
      const response = await axios.get(`${IMAGE_SERVER_URL}/test`, { 
        validateStatus: () => true 
      });
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.error('Error accessing image server:', error.message);
    }
    
    // Test 2: Check available images
    console.log('\n2. Checking available images in tmp directory');
    try {
      if (fs.existsSync(TMP_DIR)) {
        const files = fs.readdirSync(TMP_DIR);
        console.log(`Found ${files.length} files in ${TMP_DIR}`);
        console.log(`Sample files: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
      } else {
        console.error(`Directory ${TMP_DIR} does not exist`);
      }
    } catch (error) {
      console.error('Error reading directory:', error.message);
    }
    
    // Test 3: Test a few image URLs
    console.log('\n3. Testing image URLs');
    
    // Test a known image (placeholder)
    try {
      const placeholderUrl = `${IMAGE_SERVER_URL}/images/placeholder.jpg`;
      console.log(`Trying to access: ${placeholderUrl}`);
      const response = await axios.get(placeholderUrl, { 
        responseType: 'arraybuffer',
        validateStatus: () => true 
      });
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers['content-type']}`);
      console.log(`Size: ${response.data.length} bytes`);
    } catch (error) {
      console.error('Error accessing placeholder:', error.message);
    }
    
    // Test a sample file from the tmp directory
    if (fs.existsSync(TMP_DIR)) {
      const files = fs.readdirSync(TMP_DIR);
      if (files.length > 0) {
        const sampleFile = files[0];
        try {
          const sampleUrl = `${IMAGE_SERVER_URL}/images/${sampleFile}`;
          console.log(`Trying to access: ${sampleUrl}`);
          const response = await axios.get(sampleUrl, { 
            responseType: 'arraybuffer',
            validateStatus: () => true 
          });
          console.log(`Status: ${response.status}`);
          console.log(`Content-Type: ${response.headers['content-type']}`);
          console.log(`Size: ${response.data.length} bytes`);
        } catch (error) {
          console.error(`Error accessing sample file ${sampleFile}:`, error.message);
        }
      }
    }
    
    // Test 4: Test URL construction
    console.log('\n4. Testing URL construction');
    const testPaths = [
      '/tmp/test.jpg',
      'tmp/test.jpg',
      'test.jpg',
      '/test.jpg',
      '/images/test.jpg'
    ];
    
    for (const path of testPaths) {
      // Simplified version of the getImageUrl function
      let url = '';
      if (path.startsWith('/tmp/')) {
        const filename = path.substring(5);
        url = `${IMAGE_SERVER_URL}/images/${filename}`;
      } else if (!path.includes('/')) {
        url = `${IMAGE_SERVER_URL}/images/${path}`;
      } else {
        url = `${IMAGE_SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
      }
      
      console.log(`Original path: ${path}`);
      console.log(`Converted URL: ${url}`);
      console.log('---');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  
  console.log('\n===== Test Complete =====');
}

// Run the test
testImageServer().catch(console.error); 