/**
 * Deployment preparation script
 * Creates necessary directories and sets up the environment for deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting deployment preparation...');

// Create uploads directory
const uploadsDir = process.env.IMAGE_STORAGE_PATH || path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log(`📁 Creating uploads directory: ${uploadsDir}`);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create tmp directory if it doesn't exist
const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) {
  console.log(`📁 Creating tmp directory: ${tmpDir}`);
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  console.log(`📁 Creating logs directory: ${logsDir}`);
  fs.mkdirSync(logsDir, { recursive: true });
}

// Set correct permissions
try {
  console.log('🔒 Setting directory permissions...');
  execSync(`chmod -R 755 ${uploadsDir}`);
  execSync(`chmod -R 755 ${tmpDir}`);
  execSync(`chmod -R 755 ${logsDir}`);
} catch (error) {
  console.warn('⚠️ Could not set permissions:', error.message);
}

// Print environment information
console.log('🌎 Environment information:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`PORT: ${process.env.PORT || 'not set'}`);
console.log(`Database host: ${process.env.DB_HOST || 'not set'}`);
console.log(`Image storage: ${uploadsDir}`);

console.log('✅ Deployment preparation complete!'); 