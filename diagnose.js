const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const UPLOADS_DIR = '/Users/sabirbabazade/Mart.az/tmp';
const IMAGE_SERVER_URL = 'http://localhost:3001';
const BACKEND_URL = 'http://localhost:3000';
const IMAGE_TO_CHECK = 'aa351932-f491-4602-9147-ac6ede85701b.png';

// Utility function for HTTP requests
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const { statusCode } = res;
      let rawData = '';
      
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        resolve({
          statusCode,
          headers: res.headers,
          body: rawData,
          contentLength: res.headers['content-length'] || 'unknown'
        });
      });
    }).on('error', (e) => {
      reject(e);
    });
  });
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('========== IMAGE SERVER DIAGNOSTICS ==========');
  console.log('Started at:', new Date().toISOString());
  
  try {
    // 1. Check if file exists on disk
    console.log('\n--- CHECKING FILE SYSTEM ---');
    const filePath = path.join(UPLOADS_DIR, IMAGE_TO_CHECK);
    const fileExists = fs.existsSync(filePath);
    console.log(`File ${IMAGE_TO_CHECK} exists on disk:`, fileExists);
    
    if (fileExists) {
      const stats = fs.statSync(filePath);
      console.log('File size:', stats.size, 'bytes');
      console.log('Last modified:', stats.mtime);
      console.log('File permissions:', '0' + (stats.mode & 0o777).toString(8));
    }
    
    // 2. Check if image server is running
    console.log('\n--- CHECKING IMAGE SERVER STATUS ---');
    try {
      const testResponse = await httpGet(`${IMAGE_SERVER_URL}/test`);
      console.log('Image server status code:', testResponse.statusCode);
      if (testResponse.statusCode === 200) {
        console.log('Image server response:', testResponse.body);
      }
    } catch (error) {
      console.error('Error connecting to image server:', error.message);
    }
    
    // 3. Check direct image access through image server
    console.log('\n--- CHECKING DIRECT IMAGE ACCESS (IMAGE SERVER) ---');
    try {
      const imageUrl = `${IMAGE_SERVER_URL}/images/${IMAGE_TO_CHECK}`;
      console.log('Testing URL:', imageUrl);
      const imageResponse = await httpGet(imageUrl);
      console.log('Status code:', imageResponse.statusCode);
      console.log('Content-Type:', imageResponse.headers['content-type']);
      console.log('Content-Length:', imageResponse.contentLength);
      if (imageResponse.headers['content-type'] === 'image/png') {
        console.log('✅ Image is accessible through image server');
      } else {
        console.log('❌ Response is not an image');
      }
    } catch (error) {
      console.error('Error accessing image through image server:', error.message);
    }
    
    // 4. Check image access through backend server
    console.log('\n--- CHECKING THROUGH BACKEND SERVER ---');
    try {
      const backendUrl = `${BACKEND_URL}/tmp/${IMAGE_TO_CHECK}`;
      console.log('Testing URL:', backendUrl);
      const backendResponse = await httpGet(backendUrl);
      console.log('Status code:', backendResponse.statusCode);
      console.log('Content-Type:', backendResponse.headers['content-type']);
      console.log('Content-Length:', backendResponse.contentLength);
    } catch (error) {
      console.error('Error accessing image through backend:', error.message);
    }
    
    console.log('\n========== DIAGNOSTICS COMPLETE ==========');
  } catch (error) {
    console.error('Diagnostic error:', error);
  }
}

// Run the diagnostics
runDiagnostics(); 