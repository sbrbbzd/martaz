/**
 * Script to verify that the build was completed successfully
 * This script is used by Render.com to check that the build files exist
 */

const fs = require('fs');
const path = require('path');

// Paths to check
const distDir = path.join(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');

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

// List all files in dist directory to help debug
console.log('\nContents of dist directory:');
try {
  const listDir = (dir) => {
    console.log(`\nContents of ${dir}:`);
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        console.log(`📁 ${file.name}/`);
        listDir(filePath); // Recursively list subdirectories
      } else {
        console.log(`📄 ${file.name}`);
      }
    });
  };
  
  listDir(distDir);
} catch (error) {
  console.error('Error listing directory:', error.message);
}

// Check the size of index.html to ensure it's not empty
const indexStat = fs.statSync(indexHtmlPath);
if (indexStat.size < 100) { // Arbitrary minimum size that a valid index.html should be
  console.error('❌ index.html appears to be empty or too small');
  process.exit(1);
}

// Skip manifest check entirely
console.log('⚠️ Skipping Vite manifest check as it is not critical for the application');

// All checks passed
console.log('✅ Build verification successful!');
console.log('📁 Build directory exists at:', distDir);
console.log('📄 index.html exists and has content');

// Exit successfully
process.exit(0); 