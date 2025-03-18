const axios = require('axios');

async function debugApiResponse() {
  try {
    // Get a specific listing by ID or slug
    // Use the ID from your previous test response
    const listingId = '159aa9bb-fe0b-42e4-a2c5-cdc81ec4873e';
    const response = await axios.get(`http://localhost:3000/api/listings/${listingId}`);
    
    console.log('API Response Status:', response.status);
    console.log('API Response Structure:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if the response has the structure expected by the frontend
    if (response.data && response.data.success === true) {
      console.log('\nFrontend expected structure check:');
      
      // Check if listing data exists
      if (response.data.data && response.data.data.listing) {
        console.log('✅ Listing data exists');
        
        // Check specific fields
        const listing = response.data.data.listing;
        console.log(`Title: ${listing.title}`);
        console.log(`Price: ${listing.price}`);
        console.log(`Images: ${listing.images ? listing.images.length : 0} images`);
        
        // For debugging the detailed page, check specific nested objects
        console.log('\nUser Info:');
        if (listing.user) {
          console.log(`User ID: ${listing.user.id}`);
          console.log(`User Name: ${listing.user.firstName} ${listing.user.lastName}`);
        } else {
          console.log('❌ User info is missing');
        }
        
        console.log('\nCategory Info:');
        if (listing.category) {
          console.log(`Category ID: ${listing.category.id}`);
          console.log(`Category Name: ${listing.category.name}`);
        } else {
          console.log('❌ Category info is missing');
        }
      } else {
        console.log('❌ Listing data object is missing or has wrong structure');
        console.log('Expected: response.data.data.listing');
        console.log('Actual structure:', Object.keys(response.data));
      }
    } else {
      console.log('❌ Response success flag is missing or false');
    }
  } catch (error) {
    console.error('Error making API request:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

debugApiResponse(); 