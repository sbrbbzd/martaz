const fs = require('fs');
const path = require('path');
const { Category, Listing, SeoSettings } = require('../models');
const logger = require('../utils/logger');

/**
 * SSR Middleware for Server-Side Rendering
 * Injects dynamic meta tags and initial content into HTML
 */

// Cache the base HTML template
let htmlTemplate = null;

function loadHtmlTemplate() {
    if (!htmlTemplate) {
        const htmlPath = path.join(__dirname, '../../../frontend/dist/index.html');
        if (fs.existsSync(htmlPath)) {
            htmlTemplate = fs.readFileSync(htmlPath, 'utf-8');
            logger.info('✅ HTML template loaded for SSR');
        } else {
            logger.warn('⚠️ HTML template not found, SSR will be limited');
            htmlTemplate = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mart.az - Azerbaijan's Marketplace</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
        }
    }
    return htmlTemplate;
}

/**
 * Generate meta tags for a page
 */
function generateMetaTags(data) {
    const { title, description, image, url, type = 'website' } = data;

    return `
    <title>${title || 'Mart.az - Azerbaijan\'s Marketplace'}</title>
    <meta name="description" content="${description || 'Buy and sell anything in Azerbaijan'}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${url || 'https://mart.az'}" />
    <meta property="og:title" content="${title || 'Mart.az'}" />
    <meta property="og:description" content="${description || 'Buy and sell anything in Azerbaijan'}" />
    ${image ? `<meta property="og:image" content="${image}" />` : ''}
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url || 'https://mart.az'}" />
    <meta property="twitter:title" content="${title || 'Mart.az'}" />
    <meta property="twitter:description" content="${description || 'Buy and sell anything in Azerbaijan'}" />
    ${image ? `<meta property="twitter:image" content="${image}" />` : ''}
  `;
}

/**
 * Generate initial state script
 */
function generateInitialState(data) {
    return `
    <script>
      window.__INITIAL_STATE__ = ${JSON.stringify(data)};
    </script>
  `;
}

/**
 * Generate SEO-friendly content for listings page
 */
function generateListingsContent(listings, category = null) {
    const categoryName = category ? category.name : 'All Listings';

    let content = `
    <div id="root">
      <noscript>
        <div style="padding: 20px; text-align: center;">
          <h1>JavaScript Required</h1>
          <p>Please enable JavaScript to use this application.</p>
        </div>
      </noscript>
      
      <!-- SEO Content (hidden but crawlable) -->
      <div style="display: none;" data-seo-content="true">
        <h1>${categoryName}</h1>
        ${listings.map(listing => `
          <article>
            <h2>${listing.title}</h2>
            <p>${listing.description}</p>
            <span>${listing.price} ${listing.currency}</span>
            <span>${listing.location}</span>
          </article>
        `).join('')}
      </div>
    </div>
  `;

    return content;
}

/**
 * Generate SEO-friendly content for listing detail page
 */
function generateListingDetailContent(listing) {
    return `
    <div id="root">
      <noscript>
        <div style="padding: 20px; text-align: center;">
          <h1>JavaScript Required</h1>
          <p>Please enable JavaScript to use this application.</p>
        </div>
      </noscript>
      
      <!-- SEO Content (hidden but crawlable) -->
      <div style="display: none;" data-seo-content="true">
        <article itemscope itemtype="http://schema.org/Product">
          <h1 itemprop="name">${listing.title}</h1>
          <div itemprop="description">${listing.description}</div>
          <div itemprop="offers" itemscope itemtype="http://schema.org/Offer">
            <span itemprop="price">${listing.price}</span>
            <span itemprop="priceCurrency">${listing.currency}</span>
          </div>
          <span itemprop="location">${listing.location}</span>
        </article>
      </div>
    </div>
  `;
}

/**
 * SSR Middleware for Home Page
 */
async function ssrHomePage(req, res, next) {
    try {
        const html = loadHtmlTemplate();

        // Fetch featured listings
        const listings = await Listing.findAll({
            where: { status: 'active', isFeatured: true },
            limit: 12,
            order: [['createdAt', 'DESC']]
        });

        const categories = await Category.findAll({
            where: { isActive: true },
            limit: 20,
            order: [['order', 'ASC']]
        });

        const metaTags = generateMetaTags({
            title: 'Mart.az - Azerbaijan\'s Online Marketplace',
            description: 'Buy and sell anything in Azerbaijan. Electronics, cars, real estate, and more.',
            url: 'https://mart.az'
        });

        const initialState = generateInitialState({
            listings: listings.map(l => l.toJSON()),
            categories: categories.map(c => c.toJSON())
        });

        const content = generateListingsContent(listings);

        // Inject meta tags and content
        let modifiedHtml = html
            .replace('</head>', `${metaTags}</head>`)
            .replace('<div id="root"></div>', content)
            .replace('</body>', `${initialState}</body>`);

        res.send(modifiedHtml);
    } catch (error) {
        logger.error(`SSR Error on home page: ${error.message}`);
        next(); // Fall back to regular rendering
    }
}

/**
 * SSR Middleware for Category Page
 */
async function ssrCategoryPage(req, res, next) {
    try {
        const { slug } = req.params;
        const html = loadHtmlTemplate();

        const category = await Category.findOne({ where: { slug } });
        if (!category) {
            return next();
        }

        const listings = await Listing.findAll({
            where: { categoryId: category.id, status: 'active' },
            limit: 20,
            order: [['createdAt', 'DESC']]
        });

        const metaTags = generateMetaTags({
            title: `${category.name} - Mart.az`,
            description: category.description || `Browse ${category.name} listings in Azerbaijan`,
            url: `https://mart.az/category/${slug}`
        });

        const initialState = generateInitialState({
            category: category.toJSON(),
            listings: listings.map(l => l.toJSON())
        });

        const content = generateListingsContent(listings, category);

        let modifiedHtml = html
            .replace('</head>', `${metaTags}</head>`)
            .replace('<div id="root"></div>', content)
            .replace('</body>', `${initialState}</body>`);

        res.send(modifiedHtml);
    } catch (error) {
        logger.error(`SSR Error on category page: ${error.message}`);
        next();
    }
}

/**
 * SSR Middleware for Listing Detail Page
 */
async function ssrListingPage(req, res, next) {
    try {
        const { id } = req.params;
        const html = loadHtmlTemplate();

        const listing = await Listing.findByPk(id, {
            include: [{ model: Category, as: 'category' }]
        });

        if (!listing) {
            return next();
        }

        const metaTags = generateMetaTags({
            title: `${listing.title} - Mart.az`,
            description: listing.description.substring(0, 160),
            image: listing.featuredImage || (listing.images && listing.images[0]),
            url: `https://mart.az/listing/${id}`,
            type: 'product'
        });

        const initialState = generateInitialState({
            listing: listing.toJSON()
        });

        const content = generateListingDetailContent(listing);

        let modifiedHtml = html
            .replace('</head>', `${metaTags}</head>`)
            .replace('<div id="root"></div>', content)
            .replace('</body>', `${initialState}</body>`);

        res.send(modifiedHtml);
    } catch (error) {
        logger.error(`SSR Error on listing page: ${error.message}`);
        next();
    }
}

module.exports = {
    ssrHomePage,
    ssrCategoryPage,
    ssrListingPage,
    loadHtmlTemplate
};
