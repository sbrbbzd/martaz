/**
 * Image Server Testing Script
 * 
 * This script helps diagnose issues with the image server.
 * Run with: node image-test.js in your terminal
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Image server configuration (update these values to match your environment)
const IMAGE_SERVER_URL = process.env.VITE_IMAGE_SERVER_URL || 'http://localhost:3001/api/images';

// Test images (update with your actual image UUIDs)
const TEST_IMAGES = [
  '792fbaac-a6e4-47f1-89ea-856f3838d65b.png',
  'c702de7c-27a1-4a5f-84a2-25d5d83bad25.jpg',
  'de6c931c-502b-405e-9651-ef8d0f61bcb4.png',
  'e59c22a6-e5d7-44f7-a823-82ff48509b19.png',
  'a2f3fcb9-6e88-47da-9177-6bc55814bebf.png',
  '34448af3-8a12-4634-9fcc-eb69fdf086e7.png',
  'placeholder.jpg'
];

// Main test function
async function testImageServer() {
  console.log('\n========================================');
  console.log('Image Server Connection Test');
  console.log('========================================\n');
  
  console.log(`Testing server: ${IMAGE_SERVER_URL}\n`);
  
  // Check if server is up
  try {
    console.log('Testing server availability...');
    const response = await fetch(`${IMAGE_SERVER_URL}/placeholder.jpg`, {
      method: 'HEAD'
    });
    
    if (response.ok) {
      console.log('✅ Image server is available');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      // Get headers for debug info
      const headers = {};
      response.headers.forEach((value, name) => {
        headers[name] = value;
      });
      
      console.log('   Content-Type:', headers['content-type'] || 'not specified');
      console.log('   CORS Headers:', headers['access-control-allow-origin'] || 'not specified');
    } else {
      console.error('❌ Image server returned error status');
      console.error(`   Status: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Could not connect to image server');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  console.log('\n========================================');
  console.log('Testing specific images...');
  console.log('========================================\n');
  
  // Test each image
  for (const image of TEST_IMAGES) {
    try {
      const imageUrl = `${IMAGE_SERVER_URL}/${image}`;
      console.log(`Testing image: ${image}`);
      
      const response = await fetch(imageUrl, {
        method: 'HEAD'
      });
      
      if (response.ok) {
        console.log(`✅ Image is accessible: ${imageUrl}`);
        
        // Get content type
        const contentType = response.headers.get('content-type');
        if (contentType) {
          console.log(`   Content-Type: ${contentType}`);
        }
        
        // Get content length if available
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          console.log(`   Size: ${formatBytes(parseInt(contentLength, 10))}`);
        }
      } else {
        console.error(`❌ Image not found: ${imageUrl}`);
        console.error(`   Status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Error testing image: ${image}`);
      console.error(`   Error: ${error.message}`);
    }
    
    console.log('----------------------------------------');
  }
  
  console.log('\n========================================');
  console.log('CORS Testing');
  console.log('========================================\n');
  
  // Test CORS
  try {
    console.log('Testing CORS configuration...');
    const response = await fetch(`${IMAGE_SERVER_URL}/placeholder.jpg`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    
    if (corsHeader) {
      console.log('✅ CORS headers are configured');
      console.log(`   Access-Control-Allow-Origin: ${corsHeader}`);
      
      // Check if CORS is restrictive or permissive
      if (corsHeader === '*') {
        console.log('   CORS is configured to allow all origins (permissive)');
      } else {
        console.log(`   CORS is configured to allow specific origin: ${corsHeader}`);
      }
    } else {
      console.warn('⚠️ CORS headers not found - this might cause issues in the browser');
    }
  } catch (error) {
    console.error('❌ Error testing CORS');
    console.error(`   Error: ${error.message}`);
  }
  
  console.log('\n========================================');
  console.log('Recommendation');
  console.log('========================================\n');
  
  // Provide recommendations based on test results
  console.log('1. Ensure your image server is running and accessible');
  console.log('2. Verify the VITE_IMAGE_SERVER_URL environment variable is set correctly');
  console.log('3. Check that your images have valid UUIDs and extensions');
  console.log('4. Confirm proper CORS configuration in your image server');
  console.log('5. Check that your browser is not blocking requests (ad blockers, etc.)');
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Run the test
testImageServer().catch(console.error); 