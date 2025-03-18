/**
 * Test script to check if the image server is working
 */

const http = require('http');

console.log('Testing connection to image server at http://localhost:3001...');

// Make a request to the test endpoint
http.get('http://localhost:3001/test', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response headers:', res.headers);
    
    try {
      const parsedData = JSON.parse(data);
      console.log('Response data:', parsedData);
      console.log('✅ Successfully connected to image server!');
    } catch (e) {
      console.error('Error parsing response:', e.message);
      console.log('Raw response:', data);
    }
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err.message);
  console.log('Make sure the image server is running on port 3001');
}); 