/**
 * Post-build verification script
 * Ensures all required files are present for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build...');

// Critical files to verify
const requiredFiles = [
  'frontend/dist/index.html',
  'frontend/dist/assets',
  'backend/src/routes/index.js',
  'services/image-server.js',
  'index.js'
];

// Check each required file
let allFilesExist = true;
requiredFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing required file: ${filePath}`);
    allFilesExist = false;
  } else {
    console.log(`✅ Found: ${filePath}`);
  }
});

// Check for route files with different naming conventions
const routesDir = path.join(__dirname, '../backend/src/routes');
const routeChecks = [
  { original: 'users.js', alternatives: ['user.routes.js', 'userRoutes.js'] },
  { original: 'categories.js', alternatives: ['category.routes.js', 'categoryRoutes.js'] },
  { original: 'auth.js', alternatives: ['auth.routes.js', 'authRoutes.js'] },
  { original: 'admin.js', alternatives: ['admin.routes.js', 'adminRoutes.js'] }
];

routeChecks.forEach(check => {
  const originalPath = path.join(routesDir, check.original);
  
  if (!fs.existsSync(originalPath)) {
    let alternativeFound = false;
    
    // Try to find an alternative
    for (const alt of check.alternatives) {
      const altPath = path.join(routesDir, alt);
      
      if (fs.existsSync(altPath)) {
        console.log(`ℹ️ Found alternative for ${check.original}: ${alt}`);
        
        // Create a copy of the file with the expected name
        try {
          fs.copyFileSync(altPath, originalPath);
          console.log(`✅ Created copy of ${alt} as ${check.original}`);
          alternativeFound = true;
          break;
        } catch (err) {
          console.error(`❌ Failed to copy ${alt} to ${check.original}: ${err.message}`);
        }
      }
    }
    
    if (!alternativeFound) {
      console.error(`❌ Missing route file: ${check.original} and no alternatives found`);
      allFilesExist = false;
    }
  }
});

// Notify if verification succeeded or failed
if (allFilesExist) {
  console.log('✅ Build verification successful! All required files are present.');
  process.exit(0);
} else {
  console.error('❌ Build verification failed! Some required files are missing.');
  process.exit(1);
} 