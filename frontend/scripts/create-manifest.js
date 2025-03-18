/**
 * Script to manually create a Vite manifest file if it doesn't exist
 * This helps when the build process fails to generate one automatically
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const manifestDir = path.join(distDir, '.vite');
const manifestPath = path.join(manifestDir, 'manifest.json');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ Build directory does not exist:', distDir);
  process.exit(1);
}

// Create .vite directory if it doesn't exist
if (!fs.existsSync(manifestDir)) {
  console.log('Creating .vite directory...');
  fs.mkdirSync(manifestDir, { recursive: true });
}

// Check if manifest already exists
if (fs.existsSync(manifestPath)) {
  console.log('✅ Manifest already exists at:', manifestPath);
  process.exit(0);
}

// Find JS files in the dist directory to create a simple manifest
const assetsDir = path.join(distDir, 'assets');
let assets = {};

if (fs.existsSync(assetsDir)) {
  console.log('Scanning assets directory...');
  const files = fs.readdirSync(assetsDir, { withFileTypes: true });
  
  // Create an entry for each JS, CSS, and image file
  files.forEach(file => {
    if (!file.isDirectory()) {
      const fileName = file.name;
      const filePath = `assets/${fileName}`;
      const fileExt = path.extname(fileName).toLowerCase();
      
      if (['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.gif'].includes(fileExt)) {
        const fileKey = `src/${fileName.split('.')[0]}${fileExt}`;
        
        assets[fileKey] = {
          file: filePath,
          src: `src/${fileName}`,
          isEntry: fileExt === '.js',
          css: fileExt === '.css' ? [filePath] : undefined
        };
      }
    }
  });
}

// Create a basic manifest with found assets
const manifest = {
  ...assets,
  "index.html": {
    file: "index.html",
    src: "index.html",
    isEntry: true
  }
};

// Write the manifest file
console.log('Creating manifest file with entries:', Object.keys(manifest).length);
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✅ Created manifest file at:', manifestPath);

process.exit(0); 