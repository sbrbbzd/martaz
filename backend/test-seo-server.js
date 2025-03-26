const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');

console.log('Starting test SEO server...');

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// CORS middleware
app.use(cors({
  origin: '*',  // Allow any origin for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add OPTIONS handler for preflight requests
app.options('*', cors());

// JSON middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test routes
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Test SEO server running'
  });
});

// Add a special endpoint to check if the server is running
app.get('/api/seo/status', (req, res) => {
  res.json({
    success: true,
    message: 'SEO test server is running correctly',
    timestamp: new Date().toISOString()
  });
});

// SEO routes - simplified to always return mock data, not using database
app.get('/api/seo', (req, res) => {
  console.log('Test SEO server: Handling /api/seo request');
  
  // Return mock SEO settings without trying to connect to database
  res.json({
    success: true,
    data: [
      {
        id: '1',
        pageType: 'global',
        pageIdentifier: null,
        title: 'Mart.az - Largest Marketplace in Azerbaijan',
        description: 'Buy and sell products across Azerbaijan with the largest online marketplace',
        keywords: 'marketplace, online shopping, azerbaijan, baku, sell items',
        ogTitle: 'Mart.az',
        ogDescription: 'The leading online marketplace in Azerbaijan',
        ogImage: 'https://example.com/images/og-image.jpg',
        twitterTitle: 'Mart.az Online Marketplace',
        twitterDescription: 'Find anything you need on Mart.az',
        twitterImage: 'https://example.com/images/twitter-image.jpg',
        canonical: 'https://mart.az',
        robotsDirectives: 'index, follow',
        structuredData: { "@type": "Organization", "name": "Mart.az" },
        priority: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        pageType: 'home',
        pageIdentifier: null,
        title: 'Mart.az - Home',
        description: 'Welcome to Mart.az - The best marketplace in Azerbaijan',
        keywords: 'home, marketplace, azerbaijan',
        ogTitle: 'Mart.az Homepage',
        ogDescription: null,
        ogImage: null,
        twitterTitle: null,
        twitterDescription: null,
        twitterImage: null,
        canonical: null,
        robotsDirectives: null,
        structuredData: null,
        priority: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  });
});

// Add endpoint for available pages - simplified with mock data only
app.get('/api/seo/available-pages', (req, res) => {
  console.log('Test SEO server: Handling /api/seo/available-pages request');
  
  // Return mock data for available pages
  res.json({
    success: true,
    data: {
      pageTypes: [
        { id: 'global', name: 'Global Settings' },
        { id: 'home', name: 'Homepage' },
        { id: 'listings', name: 'Listings Pages' },
        { id: 'listing_detail', name: 'Listing Detail Pages' },
        { id: 'category', name: 'Category Pages' },
        { id: 'user_profile', name: 'User Profile Pages' },
        { id: 'search', name: 'Search Results Pages' },
        { id: 'static', name: 'Static Pages' }
      ],
      categories: [
        { id: '1', name: 'Electronics', slug: 'electronics' },
        { id: '2', name: 'Vehicles', slug: 'vehicles' },
        { id: '3', name: 'Home & Garden', slug: 'home-garden' }
      ],
      staticPages: [
        { id: 'about', name: 'About Us', path: '/about' },
        { id: 'contact', name: 'Contact Us', path: '/contact' },
        { id: 'terms', name: 'Terms of Service', path: '/terms' },
        { id: 'privacy', name: 'Privacy Policy', path: '/privacy' },
        { id: 'faq', name: 'FAQ', path: '/faq' }
      ]
    }
  });
});

// Start the server
const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Test SEO server running on http://localhost:${PORT}`);
}); 