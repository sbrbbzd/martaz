/**
 * Script to verify that the build was completed successfully
 * This script is used by Render.com to check that the build files exist
 */

const fs = require('fs');
const path = require('path');

// Paths to check
const distDir = path.join(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const manifestPath = path.join(distDir, '.vite/manifest.json');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ Build directory does not exist:', distDir);
  process.exit(1);
}

// Check if index.html exists
if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ index.html not found in build directory');
  process.exit(1);
}

// Check if manifest.json exists
if (!fs.existsSync(manifestPath)) {
  console.error('❌ Vite manifest not found');
  process.exit(1);
}

// Check the size of index.html to ensure it's not empty
const indexStat = fs.statSync(indexHtmlPath);
if (indexStat.size < 100) { // Arbitrary minimum size that a valid index.html should be
  console.error('❌ index.html appears to be empty or too small');
  process.exit(1);
}

// All checks passed
console.log('✅ Build verification successful!');
console.log('📁 Build directory exists at:', distDir);
console.log('📄 index.html exists and has content');
console.log('📄 Vite manifest exists');
process.exit(0); 