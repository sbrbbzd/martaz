const fetch = require('node-fetch');

async function testListingDetailAPI() {
  try {
    // Use a specific listing ID or slug from your previous response
    // Here, I'm using one from the previous response
    const listingIdOrSlug = '159aa9bb-fe0b-42e4-a2c5-cdc81ec4873e';

    console.log(`Making request to listing detail API for ID/slug: ${listingIdOrSlug}`);
    const response = await fetch(`http://localhost:3000/api/listings/${listingIdOrSlug}`);
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.text();
    console.log('Response Body:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testListingDetailAPI(); 