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
  
  // Create a temporary vite.config.js if needed to force manifest generation
  const viteConfigPath = path.join(frontendDir, 'vite.config.ts');
  let configUpdated = false;
  
  if (fs.existsSync(viteConfigPath)) {
    console.log('Reading existing Vite config...');
    let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    // Check if manifest is already configured
    if (!viteConfig.includes('manifest: true')) {
      console.log('Adding manifest generation to Vite config...');
      // Simple string replacement approach - not perfect but should work for most configs
      if (viteConfig.includes('build: {')) {
        // Config already has a build section
        viteConfig = viteConfig.replace('build: {', 'build: {\n    manifest: true,');
      } else if (viteConfig.includes('export default defineConfig({')) {
        // Add build section
        viteConfig = viteConfig.replace(
          'export default defineConfig({', 
          'export default defineConfig({\n  build: {\n    manifest: true,\n  },'
        );
      }
      
      // Backup original config
      fs.writeFileSync(`${viteConfigPath}.bak`, fs.readFileSync(viteConfigPath));
      // Write updated config
      fs.writeFileSync(viteConfigPath, viteConfig);
      configUpdated = true;
    }
  }
  
  // Run Vite build with explicit manifest flag
  console.log('Running Vite build with manifest generation...');
  execSync('npx vite build --emptyOutDir', { stdio: 'inherit', env: { ...process.env, VITE_MANIFEST: 'true' } });
  
  // Restore original config if modified
  if (configUpdated && fs.existsSync(`${viteConfigPath}.bak`)) {
    console.log('Restoring original Vite config...');
    fs.copyFileSync(`${viteConfigPath}.bak`, viteConfigPath);
    fs.unlinkSync(`${viteConfigPath}.bak`);
  }
  
  // Add .nojekyll file to dist
  console.log('Adding .nojekyll file...');
  fs.writeFileSync(path.join('dist', '.nojekyll'), '');
  
  // Check if the manifest was generated properly
  const expectedManifestPath = path.join('dist', '.vite', 'manifest.json');
  if (!fs.existsSync(expectedManifestPath)) {
    console.log('⚠️ Vite did not generate a manifest file. Creating one manually...');
    // Run the manifest creation script
    require('./create-manifest.js');
  } else {
    console.log('✅ Vite manifest generated successfully at', expectedManifestPath);
  }
  
  // Verify the build
  console.log('Verifying build...');
  require('./verify-build.js');
  
  console.log('✅ Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 