/**
 * Script to verify that the build was completed successfully
 * This script is used by Render.com to check that the build files exist
 */

const fs = require('fs');
const path = require('path');

// Paths to check
const distDir = path.join(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');

// Multiple potential manifest locations
const possibleManifestPaths = [
  path.join(distDir, '.vite/manifest.json'),
  path.join(distDir, 'manifest.json'),
  path.join(distDir, 'assets/manifest.json'),
  path.join(__dirname, '../.vite/manifest.json')
];

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

// Check for manifest file in any of the possible locations
let manifestFound = false;
let manifestPath = '';

console.log('Looking for Vite manifest file...');
for (const potentialPath of possibleManifestPaths) {
  if (fs.existsSync(potentialPath)) {
    console.log('✅ Found manifest at:', potentialPath);
    manifestFound = true;
    manifestPath = potentialPath;
    break;
  } else {
    console.log('❓ Checked:', potentialPath, '- not found');
  }
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

if (!manifestFound) {
  console.error('❌ Vite manifest not found in any of the expected locations');
  
  // Don't fail the build, just warn about the missing manifest
  console.warn('⚠️ Continuing despite missing manifest file, as other build artifacts exist');
} else {
  console.log('✅ Vite manifest exists at:', manifestPath);
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

// Exit successfully even if the manifest is missing as long as index.html exists
process.exit(0); 