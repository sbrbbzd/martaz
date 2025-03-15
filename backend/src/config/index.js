require('dotenv').config();
const path = require('path');

// This utility function will be used before logger is available
const logConfig = (message) => {
  console.log(`[CONFIG] ${message}`);
};

// Get environment
const env = process.env.NODE_ENV || 'development';
logConfig(`Loading configuration for ${env} environment`);

// Base configuration object
const config = {
  env,
  version: process.env.npm_package_version || '1.0.0',
  port: process.env.PORT || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'eu-central-1',
    bucketName: process.env.AWS_BUCKET_NAME
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    from: process.env.EMAIL_FROM || 'noreply@mart.az'
  }
};

// Log critical configuration issues early
if (!config.jwt.secret) {
  logConfig('⚠️ WARNING: JWT_SECRET is not set. Using a random string for development. DO NOT USE IN PRODUCTION!');
  config.jwt.secret = require('crypto').randomBytes(32).toString('hex');
}

// Debug log to see if JWT secret is being set
logConfig(`JWT_SECRET: ${config.jwt.secret ? 'is set (not showing value for security)' : 'is NOT set'}`);

// Validate database configuration
if (!config.database.password && env === 'production') {
  logConfig('⚠️ WARNING: Database password is not set in production environment!');
}

// Get environment-specific config
try {
  const envConfig = require(`./${env}`);
  Object.assign(config, envConfig);
  logConfig(`Loaded environment-specific configuration for ${env}`);
} catch (error) {
  logConfig(`No environment-specific configuration found for ${env}`);
}

// Final validation
const requiredVars = ['jwt.secret', 'database.name', 'database.user'];
const missingVars = requiredVars.filter(varPath => {
  const parts = varPath.split('.');
  let current = config;
  for (const part of parts) {
    if (current[part] === undefined || current[part] === null || current[part] === '') {
      return true;
    }
    current = current[part];
  }
  return false;
});

if (missingVars.length > 0) {
  logConfig(`⚠️ WARNING: Missing required configuration variables: ${missingVars.join(', ')}`);
}

logConfig('Configuration loaded successfully');

module.exports = config; 