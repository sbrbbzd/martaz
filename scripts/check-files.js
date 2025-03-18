/**
 * Pre-start script to check for required files and fallback if needed
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for required files...');

// Define critical paths to check
const criticalPaths = [
  'backend/src/routes',
  'backend/src/controllers',
  'backend/src/models',
  'frontend/dist',
  'services',
  'uploads'
];

// Ensure all critical directories exist
criticalPaths.forEach(dirPath => {
  const fullPath = path.join(__dirname, '..', dirPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Creating missing directory: ${dirPath}`);
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Check and fix route files if needed
const routesDir = path.join(__dirname, '../backend/src/routes');
const routeFiles = [
  { name: 'users.js', fallback: 'user.routes.js' },
  { name: 'categories.js', fallback: 'category.routes.js' },
  { name: 'auth.js', fallback: 'auth.routes.js' },
  { name: 'admin.js', fallback: 'admin.routes.js' },
  { name: 'import.js', fallback: null }
];

routeFiles.forEach(routeFile => {
  const targetPath = path.join(routesDir, routeFile.name);
  
  // If the file doesn't exist but we have a fallback, create a symlink or copy
  if (!fs.existsSync(targetPath) && routeFile.fallback) {
    const fallbackPath = path.join(routesDir, routeFile.fallback);
    
    if (fs.existsSync(fallbackPath)) {
      console.log(`Creating file reference from ${routeFile.fallback} to ${routeFile.name}`);
      
      try {
        // Try to create a symlink first
        fs.symlinkSync(fallbackPath, targetPath);
      } catch (err) {
        // If symlink fails (e.g., on Windows), copy the file
        console.log(`Symlink failed, copying file instead: ${err.message}`);
        fs.copyFileSync(fallbackPath, targetPath);
      }
    } else {
      console.log(`Warning: Neither ${routeFile.name} nor fallback ${routeFile.fallback} exists`);
    }
  }
});

console.log('✅ File check complete'); 