/**
 * Supabase Service
 * 
 * This service provides functions for working with Supabase as a database backend.
 * It includes adapters to mimic Sequelize's interface for easier integration.
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Get configuration from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY || process.env.SUPABASE_KEY;

// Create a Supabase client
let supabase;

try {
  supabase = createClient(supabaseUrl, supabaseKey);
  logger.info('Supabase client initialized');
} catch (error) {
  logger.error('Error initializing Supabase client:', error.message);
  throw new Error('Failed to initialize Supabase client');
}

/**
 * Map model names to Supabase table names
 * This handles the conversion from CamelCase to snake_case for table names
 */
const modelToTableMap = {
  'users': 'users',
  'listings': 'listings',
  'categories': 'categories',
  'favorites': 'favorites',
  'listing_reports': 'listing_reports',
  'seo_settings': 'seo_settings',
  'conversations': 'conversations',
  'messages': 'messages'
};

/**
 * Get the table name for a given model name
 * @param {string} modelName - The name of the model
 * @returns {string} The corresponding table name
 */
function getTableName(modelName) {
  return modelToTableMap[modelName] || modelName;
}

/**
 * Apply filtering options to a Supabase query
 * @param {Object} query - The Supabase query
 * @param {Object} options - Query options (where, limit, offset, etc.)
 * @returns {Object} - Modified query with filters applied
 */
function applyFilters(query, options = {}) {
  let filteredQuery = query;
  
  // Apply where conditions
  if (options.where) {
    Object.entries(options.where).forEach(([field, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle operators like $eq, $ne, etc.
        Object.entries(value).forEach(([op, opValue]) => {
          switch (op) {
            case '$eq':
              filteredQuery = filteredQuery.eq(field, opValue);
              break;
            case '$ne':
              filteredQuery = filteredQuery.neq(field, opValue);
              break;
            case '$gt':
              filteredQuery = filteredQuery.gt(field, opValue);
              break;
            case '$gte':
              filteredQuery = filteredQuery.gte(field, opValue);
              break;
            case '$lt':
              filteredQuery = filteredQuery.lt(field, opValue);
              break;
            case '$lte':
              filteredQuery = filteredQuery.lte(field, opValue);
              break;
            case '$in':
              filteredQuery = filteredQuery.in(field, opValue);
              break;
            case '$like':
              filteredQuery = filteredQuery.like(field, `%${opValue}%`);
              break;
            case '$ilike':
              filteredQuery = filteredQuery.ilike(field, `%${opValue}%`);
              break;
            default:
              logger.warn(`Unsupported operator: ${op}, using equals instead`);
              filteredQuery = filteredQuery.eq(field, opValue);
          }
        });
      } else {
        // Simple equals condition
        filteredQuery = filteredQuery.eq(field, value);
      }
    });
  }
  
  // Apply order
  if (options.order && options.order.length) {
    options.order.forEach(([column, direction]) => {
      const ascending = direction.toLowerCase() === 'asc';
      filteredQuery = filteredQuery.order(column, { ascending });
    });
  }
  
  // Apply pagination
  if (options.limit) {
    filteredQuery = filteredQuery.limit(options.limit);
  }
  
  if (options.offset) {
    filteredQuery = filteredQuery.range(options.offset, options.offset + (options.limit || 10) - 1);
  }
  
  return filteredQuery;
}

/**
 * Database adapters that provide Sequelize-like methods
 */
const adapters = {
  /**
   * Find all records matching the given criteria
   * @param {string} table - The table name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of records
   */
  async findAll(table, options = {}) {
    try {
      const tableName = getTableName(table);
      let query = supabase.from(tableName).select('*');
      query = applyFilters(query, options);
      
      const { data, error } = await query;
      
      if (error) {
        logger.error(`Error in findAll for ${tableName}:`, error.message);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      logger.error(`Error in findAll adapter:`, error.message);
      throw error;
    }
  },
  
  /**
   * Find a single record matching the given criteria
   * @param {string} table - The table name
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} - Found record or null
   */
  async findOne(table, options = {}) {
    try {
      const tableName = getTableName(table);
      let query = supabase.from(tableName).select('*');
      query = applyFilters(query, options);
      query = query.limit(1).single();
      
      const { data, error } = await query;
      
      if (error) {
        // Not found is not really an error
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error(`Error in findOne for ${tableName}:`, error.message);
        throw error;
      }
      
      return data || null;
    } catch (error) {
      logger.error(`Error in findOne adapter:`, error.message);
      throw error;
    }
  },
  
  /**
   * Create a new record
   * @param {string} table - The table name
   * @param {Object} data - The data to insert
   * @returns {Promise<Object>} - Created record
   */
  async create(table, data) {
    try {
      const tableName = getTableName(table);
      
      // Generate UUID if not provided
      if (!data.id) {
        data.id = uuidv4();
      }
      
      // Add timestamps if not provided
      const now = new Date().toISOString();
      if (!data.createdAt && !data.created_at) {
        data.created_at = now;
      }
      if (!data.updatedAt && !data.updated_at) {
        data.updated_at = now;
      }
      
      // Convert camelCase to snake_case for compatibility
      const snakeCaseData = {};
      Object.entries(data).forEach(([key, value]) => {
        // If the key is camelCase, convert to snake_case
        if (key.match(/[A-Z]/) && !key.includes('_')) {
          const snakeKey = key.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);
          snakeCaseData[snakeKey] = value;
        } else {
          snakeCaseData[key] = value;
        }
      });
      
      const { data: createdData, error } = await supabase
        .from(tableName)
        .insert(snakeCaseData)
        .select()
        .single();
      
      if (error) {
        logger.error(`Error in create for ${tableName}:`, error.message);
        throw error;
      }
      
      return createdData;
    } catch (error) {
      logger.error(`Error in create adapter:`, error.message);
      throw error;
    }
  },
  
  /**
   * Update records matching the given criteria
   * @param {string} table - The table name
   * @param {Object} data - Data to update
   * @param {Object} options - Query options
   * @returns {Promise<number>} - Number of updated records
   */
  async update(table, data, options = {}) {
    try {
      const tableName = getTableName(table);
      
      // Add updated timestamp
      if (!data.updatedAt && !data.updated_at) {
        data.updated_at = new Date().toISOString();
      }
      
      // Convert camelCase to snake_case for compatibility
      const snakeCaseData = {};
      Object.entries(data).forEach(([key, value]) => {
        // If the key is camelCase, convert to snake_case
        if (key.match(/[A-Z]/) && !key.includes('_')) {
          const snakeKey = key.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);
          snakeCaseData[snakeKey] = value;
        } else {
          snakeCaseData[key] = value;
        }
      });
      
      let query = supabase.from(tableName).update(snakeCaseData);
      query = applyFilters(query, options);
      
      const { data: updatedData, error } = await query.select();
      
      if (error) {
        logger.error(`Error in update for ${tableName}:`, error.message);
        throw error;
      }
      
      return updatedData ? updatedData.length : 0;
    } catch (error) {
      logger.error(`Error in update adapter:`, error.message);
      throw error;
    }
  },
  
  /**
   * Delete records matching the given criteria
   * @param {string} table - The table name
   * @param {Object} options - Query options
   * @returns {Promise<number>} - Number of deleted records
   */
  async destroy(table, options = {}) {
    try {
      const tableName = getTableName(table);
      let query = supabase.from(tableName).delete();
      query = applyFilters(query, options);
      
      const { data: deletedData, error } = await query.select();
      
      if (error) {
        logger.error(`Error in destroy for ${tableName}:`, error.message);
        throw error;
      }
      
      return deletedData ? deletedData.length : 0;
    } catch (error) {
      logger.error(`Error in destroy adapter:`, error.message);
      throw error;
    }
  },
  
  /**
   * Count records matching the given criteria
   * @param {string} table - The table name
   * @param {Object} options - Query options
   * @returns {Promise<number>} - Count of matching records
   */
  async count(table, options = {}) {
    try {
      const tableName = getTableName(table);
      let query = supabase.from(tableName).select('*', { count: 'exact', head: true });
      query = applyFilters(query, options);
      
      const { count, error } = await query;
      
      if (error) {
        logger.error(`Error in count for ${tableName}:`, error.message);
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      logger.error(`Error in count adapter:`, error.message);
      throw error;
    }
  }
};

module.exports = {
  supabase,
  adapters,
  getTableName
}; 