const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');
const createHttpError = require('http-errors');
const { Listing, Category } = require('../models');
const { validateListingData } = require('../utils/validators');

/**
 * Import a listing from an external URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const importFromUrl = async (req, res, next) => {
  try {
    const { url, categoryId } = req.body;
    
    if (!url) {
      return next(createHttpError(400, 'URL is required'));
    }

    // Get user from request
    const userId = req.user.id;
    
    // Fetch HTML content from URL
    const response = await axios.get(url);
    const html = response.data;
    
    // Parse HTML with cheerio
    const $ = cheerio.load(html);
    
    console.log('Analyzing page for multiple products...');
    
    // Detect if this is a product page or a category/search results page
    // Extended selectors to detect product grids across more websites
    const productSelectors = [
      '.product-item', '.product-card', '.search-result-item', '.item-card',
      '.product', '[class*="product"]', '[class*="item"]', '[class*="result"]',
      '.s-result-item', '.grid-item', '[data-asin]', '[data-product-id]', 
      '.col-sm-4', '.col-md-4', '.col-lg-3', // Common grid layouts
      'article', '.card', // Generic items that might be products
      'li.item', 'div.item'
    ];
    
    let productCount = 0;
    let detectedSelector = '';
    
    // Count products with various selectors
    for (const selector of productSelectors) {
      const count = $(selector).length;
      if (count > 1) {
        productCount = Math.max(productCount, count);
        detectedSelector = selector;
        console.log(`Found ${count} potential products with selector: ${selector}`);
      }
    }
    
    // Also try looking for common grid layouts
    const hasGridLayout = $('ul.products').length > 0 || 
                          $('div.products').length > 0 ||
                          $('div.results').length > 0 ||
                          $('div.grid').length > 0 ||
                          $('div.row:has(div.col)').length > 0;
                          
    console.log(`Grid layout detected: ${hasGridLayout}`);
    
    // Look for product elements with typical attributes
    const itemsWithPriceAndImage = $('div').filter(function() {
      const hasPrice = $(this).find('*:contains($)').length > 0 || 
                       $(this).find('*:contains(₼)').length > 0 || 
                       $(this).find('[class*="price"]').length > 0;
      const hasImage = $(this).find('img').length > 0;
      const hasTitle = $(this).find('h2, h3, h4, [class*="title"]').length > 0;
      
      return hasPrice && hasImage && hasTitle;
    }).length;
    
    console.log(`Found ${itemsWithPriceAndImage} items containing price, image, and title elements`);
    
    const isMultiProductPage = productCount > 1 || 
                               hasGridLayout || 
                               itemsWithPriceAndImage > 1;
    
    console.log(`Is multi-product page: ${isMultiProductPage} (found ${productCount} products)`);
                               
    if (isMultiProductPage) {
      console.log(`Detected multi-product page with ${productCount} items using selector: ${detectedSelector}`);
      // Handle multiple products
      return importMultipleListings($, url, userId, categoryId, res, next, detectedSelector);
    }
    
    console.log('Processing as single product page...');
    // Extract listing data based on common patterns
    // This is a basic implementation - you would need to customize based on target sites
    const title = $('h1').first().text().trim() || $('title').text().trim();
    
    // Try to find price - look for common price patterns
    let price = 0;
    let priceText = '';
    
    // Look for elements with price classes or currency symbols
    $('*:contains(₼), *:contains($), *:contains(€)').each(function() {
      const text = $(this).text().trim();
      if (
        text.includes('₼') || 
        text.includes('AZN') || 
        text.includes('$') || 
        text.includes('€')
      ) {
        priceText = text;
        return false; // break the loop when found
      }
    });
    
    // Extract numeric price from text
    if (priceText) {
      const priceMatch = priceText.match(/(\d+[.,]?\d*)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[0].replace(',', '.'));
      }
    }
    
    // Find description - often in p tags or specific divs
    const description = $('meta[name="description"]').attr('content') || 
                        $('p').first().text().trim();
    
    // Look for images
    const images = [];
    $('img').each(function() {
      const src = $(this).attr('src');
      if (src && !src.includes('logo') && !src.includes('icon')) {
        // Convert relative URLs to absolute
        const imageUrl = src.startsWith('http') ? src : new URL(src, url).href;
        images.push(imageUrl);
      }
    });
    
    // Create listing object
    const listingData = {
      title,
      description,
      price,
      currency: priceText.includes('$') ? 'USD' : (priceText.includes('€') ? 'EUR' : 'AZN'),
      images,
      categoryId: categoryId || null,
      userId,
      source: url,
      status: 'pending', // Changed from 'draft' to 'pending' to match database enum
      location: 'Imported', // Default location
      condition: 'good', // Default condition (changed from 'used' to 'good')
    };
    
    // Generate a slug based on title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .concat('-', uuidv4().substring(0, 8));
    
    listingData.slug = slug;
    
    // Validate the data
    const validation = validateListingData(listingData);
    if (validation.error) {
      return next(createHttpError(400, validation.error.message));
    }
    
    // Create new listing
    const listing = await Listing.create(listingData);
    
    // Fetch the listing with its category (using Sequelize instead of Mongoose populate)
    const listingWithCategory = await Listing.findByPk(listing.id, {
      include: [{
        model: Category,
        as: 'category'
      }]
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Listing imported successfully',
      data: listingWithCategory
    });
    
  } catch (error) {
    console.error('Import error:', error);
    next(createHttpError(500, `Failed to import listing: ${error.message}`));
  }
};

/**
 * Import multiple listings from a category or search results page
 * @param {Object} $ - Cheerio instance with loaded HTML
 * @param {string} sourceUrl - Original URL
 * @param {string} userId - User ID
 * @param {string} categoryId - Category ID (optional)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @param {string} detectedSelector - The selector that detected multiple products
 */
const importMultipleListings = async ($, sourceUrl, userId, categoryId, res, next, detectedSelector = '') => {
  try {
    const listings = [];
    const errors = [];
    
    // Look for common product item selectors
    const productSelectors = [
      '.product-item', '.product-card', '.search-result-item', '.item-card',
      '.product', '[class*="product"]', '[class*="item"]', '[class*="result"]',
      '.s-result-item', '.grid-item', '[data-asin]', '[data-product-id]', 
      '.col-sm-4', '.col-md-4', '.col-lg-3',
      'article', '.card',
      'li.item', 'div.item'
    ];
    
    let productItems = $();
    
    // If we already have a detected selector, use it first
    if (detectedSelector) {
      productItems = $(detectedSelector);
      console.log(`Using detected selector ${detectedSelector}, found ${productItems.length} items`);
    }
    
    // If no items found with detected selector, try others
    if (productItems.length === 0) {
      for (const selector of productSelectors) {
        const items = $(selector);
        if (items.length > 1) {
          productItems = items;
          console.log(`Found ${items.length} items with selector: ${selector}`);
          break;
        }
      }
    }
    
    // If still no items, try a more aggressive approach
    if (productItems.length === 0) {
      console.log('No product items found with standard selectors, trying alternative approach');
      
      // Look for elements that contain both an image and price-like text
      productItems = $('div').filter(function() {
        const hasPrice = $(this).find('*:contains($)').length > 0 || 
                         $(this).find('*:contains(₼)').length > 0 || 
                         $(this).find('[class*="price"]').length > 0;
        const hasImage = $(this).find('img').length > 0;
        const hasTitle = $(this).find('h2, h3, h4, [class*="title"]').length > 0;
        
        return hasPrice && hasImage && hasTitle;
      });
      
      console.log(`Found ${productItems.length} items using content-based detection`);
    }
    
    console.log(`Processing ${Math.min(productItems.length, 20)} items...`);
    
    // Process each product item (up to 20 max)
    productItems.each(function(index) {
      if (index >= 20) return false; // Increased limit to 20 items
      
      const item = $(this);
      console.log(`Processing item ${index + 1}`);
      
      // Extract basic product info - try multiple selectors for title
      const titleSelectors = ['h2', 'h3', 'h4', '.title', '.product-title', '[class*="title"]', '[class*="name"]', 'a[title]'];
      let title = '';
      
      for (const selector of titleSelectors) {
        const titleElement = item.find(selector).first();
        if (titleElement.length) {
          title = titleElement.text().trim() || titleElement.attr('title');
          if (title) {
            console.log(`Found title "${title}" using selector: ${selector}`);
            break;
          }
        }
      }
      
      // If still no title, try the alt attribute of the image
      if (!title) {
        const img = item.find('img').first();
        title = img.attr('alt') || img.attr('title') || '';
        console.log(`Using image alt/title as product title: "${title}"`);
      }
      
      // Skip if no title found
      if (!title) {
        console.log('No title found, skipping item');
        return true; // Continue to next item
      }
      
      // Look for price with multiple approaches
      let price = 0;
      let currency = 'AZN';
      const priceSelectors = ['.price', '.product-price', '[class*="price"]', 'span:contains($)', 'span:contains(₼)', 'span:contains(€)'];
      let priceText = '';
      
      for (const selector of priceSelectors) {
        const priceElement = item.find(selector).first();
        if (priceElement.length) {
          priceText = priceElement.text().trim();
          console.log(`Found price text: "${priceText}" using selector: ${selector}`);
          break;
        }
      }
      
      if (priceText) {
        const priceMatch = priceText.match(/(\d+[.,]?\d*)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[0].replace(',', '.'));
          console.log(`Extracted price: ${price}`);
          
          if (priceText.includes('$')) currency = 'USD';
          else if (priceText.includes('€')) currency = 'EUR';
          else if (priceText.includes('₽')) currency = 'RUB';
          
          console.log(`Detected currency: ${currency}`);
        }
      }
      
      // Find product link
      let productLink = '';
      const anchors = item.find('a');
      
      anchors.each(function() {
        const href = $(this).attr('href');
        if (href && !href.includes('javascript:') && !href.includes('#')) {
          productLink = href;
          return false; // Break the loop
        }
      });
      
      const fullProductLink = productLink ? 
        (productLink.startsWith('http') ? productLink : new URL(productLink, sourceUrl).href) :
        sourceUrl;
        
      console.log(`Product link: ${fullProductLink}`);
        
      // Extract description
      let description = '';
      const descSelectors = ['.description', '.product-description', '[class*="description"]', 'p'];
      
      for (const selector of descSelectors) {
        const descElement = item.find(selector).first();
        if (descElement.length) {
          description = descElement.text().trim();
          if (description) {
            console.log(`Found description: "${description.substring(0, 30)}..."`);
            break;
          }
        }
      }
      
      // If no description found, create one from the title
      if (!description) {
        description = `Imported product: ${title}. View full details at ${fullProductLink}.`;
        console.log('Created default description');
      }
      
      // Find images - first look for high res product images
      const images = [];
      const imageSelectors = ['img.product-image', 'img.primary-image', 'img[class*="product"]', 'img[class*="main"]', 'img'];
      
      for (const selector of imageSelectors) {
        const imgElement = item.find(selector);
        if (imgElement.length) {
          imgElement.each(function() {
            // Try to get high-res version first
            const src = $(this).data('src') || $(this).data('original') || $(this).attr('src');
            if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('placeholder')) {
              // Convert relative URLs to absolute
              const imageUrl = src.startsWith('http') ? src : new URL(src, sourceUrl).href;
              images.push(imageUrl);
              console.log(`Found image: ${imageUrl}`);
            }
          });
          
          if (images.length > 0) break;
        }
      }
      
      // Generate a slug
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .concat('-', uuidv4().substring(0, 8));
      
      // Create listing data
      const listingData = {
        title,
        description,
        price,
        currency,
        images,
        categoryId: categoryId || null,
        userId,
        source: fullProductLink || sourceUrl,
        status: 'pending',
        location: 'Imported',
        condition: 'good',
        slug
      };
      
      console.log(`Created listing data for: "${title}"`);
      
      // Validate data
      const validation = validateListingData(listingData);
      if (validation.error) {
        console.log(`Validation error: ${validation.error.message}`);
        errors.push({ title, error: validation.error.message });
      } else {
        listings.push(listingData);
        console.log(`Added listing to import queue: "${title}"`);
      }
    });
    
    console.log(`Total valid listings found: ${listings.length}`);
    console.log(`Total errors: ${errors.length}`);
    
    if (listings.length === 0) {
      return next(createHttpError(400, 'No valid listings found on the page'));
    }
    
    // Create all listings at once
    console.log('Creating listings in database...');
    const createdListings = await Listing.bulkCreate(listings);
    console.log(`Successfully created ${createdListings.length} listings`);
    
    // Return response
    res.status(201).json({
      status: 'success',
      message: `Successfully imported ${createdListings.length} listings`,
      data: {
        count: createdListings.length,
        listings: createdListings,
        errors: errors.length > 0 ? errors : null
      }
    });
    
  } catch (error) {
    console.error('Multiple import error:', error);
    next(createHttpError(500, `Failed to import multiple listings: ${error.message}`));
  }
};

/**
 * Get available import sources/websites that are supported
 */
const getSupportedSources = (req, res) => {
  // These would be sites you've optimized the scraper for
  const supportedSources = [
    { name: 'Satış saytları', domains: ['example.az', 'satici.az'] },
    { name: 'Elan saytları', domains: ['elanlar.az', 'yerlielanlar.az'] },
    { name: 'Dükan saytları', domains: ['shoppingsite.az', 'store.az'] }
  ];
  
  res.status(200).json({
    status: 'success',
    data: supportedSources
  });
};

module.exports = {
  importFromUrl,
  getSupportedSources
}; 