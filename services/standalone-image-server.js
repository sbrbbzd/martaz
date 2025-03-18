/**
 * Standalone Image Server for Mart.az
 * Used in development to run the image server separately
 */

require('dotenv').config(); // Load environment variables
const path = require('path');
const initImageServer = require('./image-server');

// Start the image server in standalone mode
const imageServer = initImageServer({
  uploadsDir: process.env.IMAGE_STORAGE_PATH || path.join(__dirname, '../uploads'),
  standalone: true,
  port: process.env.IMAGE_SERVER_PORT || 3001
});

// Start the standalone server
imageServer.startStandalone();

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                 MART.AZ STANDALONE IMAGE SERVER               ║
╚═══════════════════════════════════════════════════════════════╝
`); 