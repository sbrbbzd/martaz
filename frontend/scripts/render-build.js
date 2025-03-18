/**
 * Custom build script for Render.com deployments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Log where we are
console.log('Current working directory:', process.cwd());

// Ensure we're in the frontend directory
const frontendDir = path.resolve(__dirname, '..');
process.chdir(frontendDir);
console.log('Changed to frontend directory:', frontendDir);

try {
  // Run TypeScript compiler
  console.log('Running TypeScript compiler...');
  execSync('npx tsc --project tsconfig.json', { stdio: 'inherit' });
  
  // Run Vite build with clear output directory
  console.log('Running Vite build...');
  execSync('npx vite build --emptyOutDir', { stdio: 'inherit' });
  
  // Add .nojekyll file to dist
  console.log('Adding .nojekyll file...');
  fs.writeFileSync(path.join('dist', '.nojekyll'), '');
  
  // Verify the build
  console.log('Verifying build...');
  require('./verify-build.js');
  
  console.log('✅ Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 