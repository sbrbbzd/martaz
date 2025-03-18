const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const LISTING_ID = '0b789016-8a6d-47b6-9e24-0a8f655459f7';
const IMAGE_SERVER_URL = 'http://localhost:3001';
const BACKEND_URL = 'http://localhost:3000/api';
const TEST_IMAGE_PATH = path.join(__dirname, 'tmp', '9a86f26c-3582-4fea-a2cb-218ccad64740.jpg');

// Token for authentication (replace with your actual token)
// You can get this from your browser's localStorage after logging in
// Open browser dev tools -> Application tab -> Local Storage -> http://localhost:3000 -> authToken
const TOKEN = 'your_auth_token_here'; 

async function uploadImage() {
  try {
    console.log('Starting image upload test...');
    console.log('Image path:', TEST_IMAGE_PATH);
    
    // Check if image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error('Error: Test image does not exist at path:', TEST_IMAGE_PATH);
      console.log('Available files in tmp directory:');
      const tmpFiles = fs.readdirSync(path.join(__dirname, 'tmp'));
      console.log(tmpFiles);
      return;
    }
    
    // 1. First, upload the image to the image server
    console.log('Step 1: Uploading image to image server');
    
    const imageFormData = new FormData();
    imageFormData.append('images', fs.createReadStream(TEST_IMAGE_PATH));
    
    const imageServerResponse = await axios.post(`${IMAGE_SERVER_URL}/upload`, imageFormData, {
      headers: {
        ...imageFormData.getHeaders()
      }
    });
    
    console.log('Image server response:', JSON.stringify(imageServerResponse.data, null, 2));
    
    if (!imageServerResponse.data.success || !imageServerResponse.data.files) {
      throw new Error('Failed to upload image to image server');
    }
    
    // 2. Get the image paths from the response
    const imagePaths = imageServerResponse.data.files.map(file => file.path);
    console.log('Image paths:', imagePaths);
    
    // 3. Update the listing with the image paths
    console.log(`Step 2: Updating listing ${LISTING_ID} with image paths`);
    
    // IMPORTANT: Make sure we're sending the correct format
    // The backend expects { images: ['/tmp/file1.jpg', '/tmp/file2.jpg'] }
    const updateData = {
      images: imagePaths
    };
    
    console.log('Sending data to backend:', JSON.stringify(updateData, null, 2));
    
    try {
      const listingUpdateResponse = await axios.post(
        `${BACKEND_URL}/listings/${LISTING_ID}/images`, 
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
          }
        }
      );
      
      console.log('Listing update response:', JSON.stringify(listingUpdateResponse.data, null, 2));
      console.log('Test completed successfully!');
    } catch (error) {
      console.error('Error updating listing:');
      console.error('Status:', error.response?.status);
      console.error('Response:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  } catch (error) {
    console.error('Error during test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
uploadImage(); 