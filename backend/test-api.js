const fetch = require('node-fetch');

async function testListingsAPI() {
  try {
    console.log('Making request to listings API...');
    const response = await fetch('http://localhost:3000/api/listings?page=1&limit=12&sort=createdAt&order=DESC');
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', response.headers);
    
    const data = await response.text();
    console.log('Response Body:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testListingsAPI(); 