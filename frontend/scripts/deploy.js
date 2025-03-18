const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const distPath = path.resolve(__dirname, '../dist');
const ghPagesBranch = 'gh-pages';
const repoUrl = 'https://github.com/sbrbbzd/martaz.git';

// Ensure dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('Error: dist directory does not exist. Run npm run build first.');
  process.exit(1);
}

// Deployment Process
console.log('Starting deployment process...');

try {
  // Create a temporary directory for the deployment
  const tempDir = path.join(__dirname, '../.deploy-temp');
  
  // Clean up any existing temp directory
  if (fs.existsSync(tempDir)) {
    console.log('Cleaning up existing temp directory...');
    execSync(`rm -rf "${tempDir}"`);
  }
  
  // Create the temp directory
  fs.mkdirSync(tempDir, { recursive: true });
  
  console.log('Initializing git repository in temp directory...');
  execSync(`cd "${tempDir}" && git init`);
  
  console.log('Copying build files to temp directory...');
  execSync(`cp -R "${distPath}"/* "${tempDir}"/`);
  execSync(`cp "${distPath}/.nojekyll" "${tempDir}"/`);
  
  console.log('Configuring git...');
  execSync(`cd "${tempDir}" && git config user.name "GitHub Pages Deploy"`);
  execSync(`cd "${tempDir}" && git config user.email "deploy@example.com"`);
  
  console.log('Committing files...');
  execSync(`cd "${tempDir}" && git add .`);
  execSync(`cd "${tempDir}" && git commit -m "Deploy to GitHub Pages"`);
  
  console.log('Pushing to GitHub Pages...');
  execSync(`cd "${tempDir}" && git push --force "${repoUrl}" HEAD:${ghPagesBranch}`);
  
  console.log('Cleaning up...');
  execSync(`rm -rf "${tempDir}"`);
  
  console.log('Deployment successful!');
  console.log('Visit: https://sbrbbzd.github.io/martaz/');
} catch (error) {
  console.error('Deployment error:', error.message);
  console.error('Command output:', error.stderr ? error.stderr.toString() : 'No output');
  process.exit(1);
} 