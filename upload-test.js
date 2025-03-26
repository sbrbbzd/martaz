const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:3000/api';
const IMAGE_PATH = './test-image.png'; // Test image in root directory

// Login credentials - Gerçek giriş bilgileriniz
const LOGIN_CREDENTIALS = {
  email: 'Hiko@mart.az',
  password: 'Admin123!'
};

// Helper to log with timestamps
const log = (message) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${message}`);
};

// Generate a unique timestamp for the slug
const timestamp = Date.now();

// Test listing data
const TEST_LISTING = {
  title: `Test Listing for Image Upload ${timestamp}`,
  description: 'This is a test listing created via API to test image uploads',
  price: 455,
  currency: 'AZN',
  condition: 'new',
  location: 'Baku',
  categoryId: "93ffb0ea-96c5-44ae-b5f6-15c07a4e069d", // Geçerli bir kategori ID ekleyin
  contactPhone: '+994501234567',
  contactEmail: 'Hiko@mart.az',
  slug: `test-listing-image-upload-${timestamp}`
};

// Helper to get data debug
const debugBody = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log("Raw response body:", text);
    return { error: "Invalid JSON", text };
  }
};

// Main testing function
async function runTest() {
  try {
    log('Starting image upload test');
    
    // Test with login first to get fresh token
    log('Logging in to get auth token...');
    let AUTH_TOKEN;
    try {
      const loginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(LOGIN_CREDENTIALS)
      });
      
      if (!loginResponse.ok) {
        const errorData = await debugBody(loginResponse);
        throw new Error(`Login failed: ${JSON.stringify(errorData)}`);
      }
      
      const loginData = await loginResponse.json();
      log(`Full login response: ${JSON.stringify(loginData)}`);
      
      // Get token from nested structure
      AUTH_TOKEN = loginData.data.token;
      if (!AUTH_TOKEN) {
        AUTH_TOKEN = loginData.data.user.token;
      }
      
      // Final check
      if (!AUTH_TOKEN && loginData.token) {
        AUTH_TOKEN = loginData.token;
      }
      
      if (!AUTH_TOKEN) {
        throw new Error("Could not extract token from login response: " + JSON.stringify(loginData));
      }
      
      log(`JWT Token received: ${AUTH_TOKEN}`);
      log(`JWT Token parts: ${AUTH_TOKEN.split('.').length}`);
      log('Successfully logged in and got token');
    } catch (error) {
      log(`❌ ERROR: ${error.message}`);
      console.error(error);
      return;
    }
    
    // Step 1: Create a new listing
    log('Creating a new test listing...');
    const createListingResponse = await fetch(
      `${BACKEND_URL}/listings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify(TEST_LISTING)
      }
    );
    
    if (!createListingResponse.ok) {
      const errorData = await debugBody(createListingResponse);
      throw new Error(`Failed to create listing: ${JSON.stringify(errorData)}`);
    }
    
    const listingData = await createListingResponse.json();
    log(`Created new listing: ${JSON.stringify(listingData, null, 2)}`);
    
    // Use the newly created listing ID
    const LISTING_ID = listingData.data.id;
    log(`Using new listing ID: ${LISTING_ID}`);
    
    // Get token from localStorage directly
    log('Directly updating listing with image URL from test data...');
    
    // Create test image URL that will work with your system
    const imageUrl = '/api/images/cbe8819f-1e20-429e-a3d3-79d9e028fc8f.png';
    log(`Using test image URL: ${imageUrl}`);
    
    // Update the listing with image URL
    log('Updating listing with image URL...');
    
    const updateResponse = await fetch(
      `${BACKEND_URL}/listings/${LISTING_ID}/images`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({
          images: [imageUrl]
        })
      }
    );
    
    if (!updateResponse.ok) {
      const errorData = await debugBody(updateResponse);
      throw new Error(`Failed to update listing with image: ${JSON.stringify(errorData)}`);
    }
    
    const updateData = await updateResponse.json();
    log(`Update response: ${JSON.stringify(updateData, null, 2)}`);
    
    if (updateResponse.ok && updateData.success) {
      log('✅ TEST PASSED: Successfully updated listing with image');
    } else {
      log('❌ TEST FAILED: Could not update listing with image');
    }
    
  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    console.error(error);
  }
}

// Run the test
runTest(); 