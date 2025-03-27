/**
 * Supabase Service
 * 
 * This service provides functions for working with Supabase as a database backend.
 * It implements methods to mimic Sequelize's interface for easier transition.
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Get configuration from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY || process.env.SUPABASE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

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
 * Map model fields to Supabase table names
 * This handles the conversion from CamelCase to snake_case for table names
 */
const modelToTableMap = {
  User: 'users',
  Listing: 'listings',
  Category: 'categories',
  Favorite: 'favorites',
  ListingReport: 'listing_reports',
  SeoSettings: 'seo_settings',
  Conversation: 'conversations',
  Message: 'messages'
};

/**
 * Convert a model name to a table name
 * @param {string} modelName - The name of the model (e.g., 'User')
 * @returns {string} - The corresponding table name (e.g., 'users')
 */
function getTableName(modelName) {
  return modelToTableMap[modelName] || modelName.toLowerCase() + 's';
}

/**
 * Convert Sequelize-style options to Supabase query parameters
 * @param {Object} options - Sequelize-style query options
 * @returns {Object} - Transformed options for Supabase
 */
function transformOptions(options = {}) {
  const result = {};
  
  // Handle where conditions
  if (options.where) {
    result.where = options.where;
  }
  
  // Handle limit
  if (options.limit) {
    result.limit = options.limit;
  }
  
  // Handle offset for pagination
  if (options.offset) {
    result.offset = options.offset;
  }
  
  // Handle order
  if (options.order && options.order.length) {
    result.order = options.order.map(([column, direction]) => {
      return { column, direction: direction.toLowerCase() };
    });
  }
  
  // Handle includes (relations)
  if (options.include) {
    result.include = options.include;
  }
  
  return result;
}

/**
 * Apply Sequelize-style options to a Supabase query
 * @param {Object} query - Supabase query
 * @param {Object} options - Sequelize-style options
 * @returns {Object} - Modified Supabase query
 */
function applyOptionsToQuery(query, options = {}) {
  const { limit, offset, order, where } = transformOptions(options);
  
  let modifiedQuery = query;
  
  // Apply where conditions
  if (where) {
    Object.entries(where).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle operators like $eq, $gt, etc.
        const operators = Object.keys(value);
        operators.forEach(op => {
          const opValue = value[op];
          switch (op) {
            case '$eq':
              modifiedQuery = modifiedQuery.eq(key, opValue);
              break;
            case '$ne':
              modifiedQuery = modifiedQuery.neq(key, opValue);
              break;
            case '$gt':
              modifiedQuery = modifiedQuery.gt(key, opValue);
              break;
            case '$gte':
              modifiedQuery = modifiedQuery.gte(key, opValue);
              break;
            case '$lt':
              modifiedQuery = modifiedQuery.lt(key, opValue);
              break;
            case '$lte':
              modifiedQuery = modifiedQuery.lte(key, opValue);
              break;
            case '$in':
              modifiedQuery = modifiedQuery.in(key, opValue);
              break;
            case '$like':
              modifiedQuery = modifiedQuery.like(key, opValue);
              break;
            case '$ilike':
              modifiedQuery = modifiedQuery.ilike(key, opValue);
              break;
            default:
              // Default to equals for unknown operators
              modifiedQuery = modifiedQuery.eq(key, opValue);
          }
        });
      } else {
        // Simple equality
        modifiedQuery = modifiedQuery.eq(key, value);
      }
    });
  }
  
  // Apply ordering
  if (order && order.length) {
    order.forEach(({ column, direction }) => {
      modifiedQuery = modifiedQuery.order(column, { ascending: direction === 'asc' });
    });
  }
  
  // Apply pagination
  if (limit) {
    modifiedQuery = modifiedQuery.limit(limit);
  }
  
  if (offset) {
    modifiedQuery = modifiedQuery.range(offset, offset + (limit || 10) - 1);
  }
  
  return modifiedQuery;
}

/**
 * Generic model adapter for Supabase
 * Provides Sequelize-like methods for database operations
 */
class SupabaseModelAdapter {
  constructor(modelName, schema = {}) {
    this.modelName = modelName;
    this.tableName = getTableName(modelName);
    this.schema = schema;
    this.supabase = supabase;
    
    // Create methods that mimic Sequelize's interface
    this.findAll = this.findAll.bind(this);
    this.findOne = this.findOne.bind(this);
    this.findByPk = this.findByPk.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
    this.count = this.count.bind(this);
  }
  
  /**
   * Find all records matching the given criteria
   * @param {Object} options - Query options (where, limit, offset, etc.)
   * @returns {Promise<Array>} - Array of records
   */
  async findAll(options = {}) {
    try {
      let query = this.supabase.from(this.tableName).select('*');
      query = applyOptionsToQuery(query, options);
      
      const { data, error } = await query;
      
      if (error) {
        logger.error(`Error in ${this.modelName}.findAll:`, error.message);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      logger.error(`Error in ${this.modelName}.findAll:`, error.message);
      throw error;
    }
  }
  
  /**
   * Find a single record matching the given criteria
   * @param {Object} options - Query options (where, etc.)
   * @returns {Promise<Object|null>} - Found record or null
   */
  async findOne(options = {}) {
    try {
      let query = this.supabase.from(this.tableName).select('*');
      query = applyOptionsToQuery(query, options);
      query = query.limit(1).single();
      
      const { data, error } = await query;
      
      if (error) {
        // Not found is not really an error
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error(`Error in ${this.modelName}.findOne:`, error.message);
        throw error;
      }
      
      return data || null;
    } catch (error) {
      logger.error(`Error in ${this.modelName}.findOne:`, error.message);
      throw error;
    }
  }
  
  /**
   * Find a record by its primary key
   * @param {string|number} id - Primary key value
   * @returns {Promise<Object|null>} - Found record or null
   */
  async findByPk(id) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        // Not found is not really an error
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error(`Error in ${this.modelName}.findByPk:`, error.message);
        throw error;
      }
      
      return data || null;
    } catch (error) {
      logger.error(`Error in ${this.modelName}.findByPk:`, error.message);
      throw error;
    }
  }
  
  /**
   * Create a new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>} - Created record
   */
  async create(data) {
    try {
      // Ensure UUID is generated if not provided and schema has UUID primary key
      if (!data.id && this.schema.id && this.schema.id.type === 'UUID') {
        data.id = crypto.randomUUID();
      }
      
      // Add timestamps if not provided
      const now = new Date().toISOString();
      if (!data.createdAt && !data.created_at) {
        data.created_at = now;
      }
      if (!data.updatedAt && !data.updated_at) {
        data.updated_at = now;
      }
      
      const { data: createdData, error } = await this.supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();
      
      if (error) {
        logger.error(`Error in ${this.modelName}.create:`, error.message);
        throw error;
      }
      
      return createdData;
    } catch (error) {
      logger.error(`Error in ${this.modelName}.create:`, error.message);
      throw error;
    }
  }
  
  /**
   * Update records matching the given criteria
   * @param {Object} data - New data
   * @param {Object} options - Query options (where, etc.)
   * @returns {Promise<number>} - Number of updated records
   */
  async update(data, options = {}) {
    try {
      // Add updated timestamp
      if (!data.updatedAt && !data.updated_at) {
        data.updated_at = new Date().toISOString();
      }
      
      let query = this.supabase.from(this.tableName).update(data);
      
      // Apply where conditions
      if (options.where) {
        query = applyOptionsToQuery(query, options);
      }
      
      const { data: result, error } = await query.select();
      
      if (error) {
        logger.error(`Error in ${this.modelName}.update:`, error.message);
        throw error;
      }
      
      return result ? result.length : 0;
    } catch (error) {
      logger.error(`Error in ${this.modelName}.update:`, error.message);
      throw error;
    }
  }
  
  /**
   * Delete records matching the given criteria
   * @param {Object} options - Query options (where, etc.)
   * @returns {Promise<number>} - Number of deleted records
   */
  async destroy(options = {}) {
    try {
      let query = this.supabase.from(this.tableName).delete();
      
      // Apply where conditions
      if (options.where) {
        query = applyOptionsToQuery(query, options);
      }
      
      const { data: result, error } = await query.select();
      
      if (error) {
        logger.error(`Error in ${this.modelName}.destroy:`, error.message);
        throw error;
      }
      
      return result ? result.length : 0;
    } catch (error) {
      logger.error(`Error in ${this.modelName}.destroy:`, error.message);
      throw error;
    }
  }
  
  /**
   * Count records matching the given criteria
   * @param {Object} options - Query options (where, etc.)
   * @returns {Promise<number>} - Count of matching records
   */
  async count(options = {}) {
    try {
      let query = this.supabase.from(this.tableName).select('*', { count: 'exact', head: true });
      
      // Apply where conditions
      if (options.where) {
        query = applyOptionsToQuery(query, options);
      }
      
      const { count, error } = await query;
      
      if (error) {
        logger.error(`Error in ${this.modelName}.count:`, error.message);
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      logger.error(`Error in ${this.modelName}.count:`, error.message);
      throw error;
    }
  }
}

/**
 * Create model classes that implement Sequelize-like interface but use Supabase
 * @param {Object} models - Object mapping model names to schemas
 * @returns {Object} - Object with model classes
 */
function createModels(models) {
  const result = {};
  
  Object.entries(models).forEach(([name, schema]) => {
    result[name] = new SupabaseModelAdapter(name, schema);
  });
  
  return result;
}

module.exports = {
  supabase,
  SupabaseModelAdapter,
  createModels
}; 