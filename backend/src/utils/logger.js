const winston = require('winston');
const config = require('../config');

// Custom format with colors and timestamps
const customFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    // Console transport with colorization
    new winston.transports.Console({
      format: customFormat
    }),
    // You can add file transports here if needed
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false
});

// Store the original methods before we override them
const originalInfo = logger.info;
const originalWarn = logger.warn;
const originalError = logger.error;
const originalDebug = logger.debug;

// Helper methods for consistent logging
logger.success = (message) => {
  originalInfo.call(logger, `✅ ${message}`);
};

logger.warn = (message) => {
  originalWarn.call(logger, `⚠️ ${message}`);
};

logger.error = (message, error) => {
  if (error) {
    originalError.call(logger, `❌ ${message}`, { error: error.stack || error.toString() });
  } else {
    originalError.call(logger, `❌ ${message}`);
  }
};

logger.debug = (message, data) => {
  if (data) {
    originalDebug.call(logger, `🔍 ${message}`, { data });
  } else {
    originalDebug.call(logger, `🔍 ${message}`);
  }
};

// Replace info with a version that doesn't have emoji by default
const originalInfoWithoutEmoji = logger.info;
logger.info = (message, meta) => {
  originalInfoWithoutEmoji.call(logger, message, meta);
};

module.exports = logger; 