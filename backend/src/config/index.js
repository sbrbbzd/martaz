// Load environment variables from appropriate .env file
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// This utility function will be used before logger is available
const logConfig = (message) => {
  console.log(`[CONFIG] ${message}`);
};

// Get environment
const env = process.env.NODE_ENV || 'development';
logConfig(`Loading configuration for ${env} environment`);

// Load base .env file
dotenv.config();

// Try to load environment-specific .env file
const envFile = path.resolve(process.cwd(), `.env.${env}`);
if (fs.existsSync(envFile)) {
  logConfig(`Found environment file: ${envFile}, loading...`);
  dotenv.config({ path: envFile });
} else {
  logConfig(`No environment file found at ${envFile}`);
}

// Print all environment variables for debugging (excluding sensitive ones)
logConfig('Environment variables loaded:');
Object.keys(process.env).forEach(key => {
  if (!key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('KEY')) {
    logConfig(`${key}=${process.env[key]}`);
  } else {
    logConfig(`${key}=******* (hidden for security)`);
  }
});

// Database config variables can have multiple possible names in different environments
const getEnvVar = (...possibleNames) => {
  for (const name of possibleNames) {
    if (process.env[name] !== undefined) {
      return process.env[name];
    }
  }
  return undefined;
};

// Hard-coded production fallbacks - USE ONLY IN EMERGENCY
const EMERGENCY_FALLBACKS = env === 'production' ? {
  DB_HOST: 'dpg-cvcsk38gph6c739d97cg-a',
  DB_PORT: '5432',
  DB_NAME: 'martaz',
  DB_USER: 'martaz_user',
  DB_PASSWORD: 'EbGHQceGDGNI94ddo08v3c6Ia4TGMtOK'
} : {};

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
    host: getEnvVar('DB_HOST', 'DATABASE_HOST', 'PGHOST') || EMERGENCY_FALLBACKS.DB_HOST,
    port: getEnvVar('DB_PORT', 'DATABASE_PORT', 'PGPORT') || EMERGENCY_FALLBACKS.DB_PORT,
    name: getEnvVar('DB_NAME', 'DATABASE_NAME', 'PGDATABASE') || EMERGENCY_FALLBACKS.DB_NAME,
    user: getEnvVar('DB_USERNAME', 'DATABASE_USER', 'DB_USER', 'PGUSER') || EMERGENCY_FALLBACKS.DB_USER,
    password: getEnvVar('DB_PASSWORD', 'DATABASE_PASSWORD', 'PGPASSWORD') || EMERGENCY_FALLBACKS.DB_PASSWORD
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

// Log database configuration (without showing password)
logConfig('Database configuration:');
logConfig(`Host: ${config.database.host || 'undefined'}`);
logConfig(`Port: ${config.database.port || 'undefined'}`);
logConfig(`Database: ${config.database.name || 'undefined'}`);
logConfig(`User: ${config.database.user || 'undefined'}`);
logConfig(`Password: ${config.database.password ? '******** (set)' : 'undefined'}`);

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