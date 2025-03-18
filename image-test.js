// Image server test script
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const IMAGE_SERVER_URL = 'http://localhost:3001';
const TMP_PATH = path.resolve(__dirname, 'tmp');

async function testImageServer() {
  console.log('Testing image server connectivity...');
  
  try {
    // Test 1: Check if image server is running
    console.log('\n1. Testing server connectivity:');
    const serverResponse = await axios.get(`${IMAGE_SERVER_URL}/test`);
    console.log('✅ Image server is running!');
    console.log(`Server response: ${JSON.stringify(serverResponse.data, null, 2)}`);
    
    // Test 2: Check a few sample images
    console.log('\n2. Testing image access:');
    const testImages = [
      'placeholder.jpg',
      '1d740ba3-b958-4447-993a-50a47b82f9a1.png',
      '63e61a84-9beb-44ed-9412-83759a125d4f.JPG'
    ];
    
    for (const image of testImages) {
      try {
        const imageUrl = `${IMAGE_SERVER_URL}/images/${image}`;
        console.log(`Testing image: ${imageUrl}`);
        const response = await axios.head(imageUrl);
        
        if (response.status === 200) {
          const contentType = response.headers['content-type'];
          const contentLength = response.headers['content-length'];
          console.log(`✅ Image accessible - Type: ${contentType}, Size: ${contentLength} bytes`);
        } else {
          console.log(`❌ Image returned status: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Failed to access image: ${error.message}`);
      }
    }
    
    // Test 3: Test CORS headers
    console.log('\n3. Testing CORS headers:');
    const corsResponse = await axios.head(`${IMAGE_SERVER_URL}/images/placeholder.jpg`);
    const corsHeaders = corsResponse.headers;
    
    if (corsHeaders['access-control-allow-origin'] === '*') {
      console.log('✅ CORS headers are properly set');
      console.log(`Access-Control-Allow-Origin: ${corsHeaders['access-control-allow-origin']}`);
    } else {
      console.log('❌ CORS headers are not set correctly:');
      console.log(corsHeaders);
    }
    
    // Test 4: Test image file existence
    console.log('\n4. Checking for image files in tmp directory:');
    if (fs.existsSync(TMP_PATH)) {
      const files = fs.readdirSync(TMP_PATH);
      const imageFiles = files.filter(file => 
        ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].some(ext => 
          file.toLowerCase().endsWith(ext)
        )
      );
      
      console.log(`Found ${imageFiles.length} image files out of ${files.length} total files`);
      console.log('Sample image files:', imageFiles.slice(0, 5));
    } else {
      console.log(`❌ Directory not found: ${TMP_PATH}`);
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testImageServer(); 