const { Category, Listing } = require('../models');
const { ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const slugify = require('slugify');
const { Op } = require('sequelize');

/**
 * Get all categories
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const { includeInactive = false, parentId = null } = req.query;
    
    // Build query conditions
    const where = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }
    
    if (parentId === 'null') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }
    
    // Get categories
    const categories = await Category.findAll({ 
      where,
      order: [
        ['order', 'ASC'],
        ['name', 'ASC']
      ],
      include: [{
        model: Category,
        as: 'children',
        where: includeInactive ? {} : { isActive: true },
        required: false
      }]
    });
    
    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    next(error);
  }
};

/**
 * Get category by id or slug
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    
    // Try to find by id first, then by slug
    let category = await Category.findOne({ 
      where: {
        [Op.or]: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      },
      include: [
        {
          model: Category,
          as: 'children',
          where: { isActive: true },
          required: false,
          order: [
            ['order', 'ASC'],
            ['name', 'ASC']
          ]
        },
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    // Get listing count for this category and its children
    const listingCount = await Listing.count({ 
      where: { 
        categoryId: { 
          [Op.in]: [
            category.id, 
            ...(category.children.map(child => child.id))
          ] 
        },
        status: 'active'
      } 
    });
    
    // Add the listing count to the response
    const categoryData = category.toJSON();
    categoryData.listingCount = listingCount;
    
    res.json({
      success: true,
      data: {
        category: categoryData
      }
    });
  } catch (error) {
    logger.error('Get category error:', error);
    next(error);
  }
};

/**
 * Create a new category
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, image, parentId, order, attributes } = req.body;
    
    // Generate slug from name
    let slug = slugify(name, { lower: true, strict: true });
    
    // Check for slug uniqueness
    const existingSlug = await Category.findOne({ where: { slug } });
    if (existingSlug) {
      throw new ValidationError('Category with this name already exists');
    }
    
    // If parentId is provided, check if parent category exists
    if (parentId) {
      const parentCategory = await Category.findByPk(parentId);
      if (!parentCategory) {
        throw new ValidationError('Parent category not found');
      }
    }
    
    // Create category
    const category = await Category.create({
      name,
      slug,
      description,
      icon,
      image,
      parentId: parentId || null,
      order: order || 0,
      isActive: true,
      attributes: attributes || {}
    });
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });
  } catch (error) {
    logger.error('Create category error:', error);
    next(error);
  }
};

/**
 * Update an existing category
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon, image, parentId, order, isActive, attributes } = req.body;
    
    // Find category
    const category = await Category.findByPk(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    // Generate new slug if name is changed
    let slug = category.slug;
    if (name && name !== category.name) {
      slug = slugify(name, { lower: true, strict: true });
      
      // Check for slug uniqueness (excluding current category)
      const existingSlug = await Category.findOne({ 
        where: { 
          slug,
          id: { [Op.ne]: id }
        } 
      });
      
      if (existingSlug) {
        throw new ValidationError('Category with this name already exists');
      }
    }
    
    // Prevent setting own id as parent
    if (parentId && parentId === id) {
      throw new ValidationError('Category cannot be its own parent');
    }
    
    // Prevent setting a child as parent (would create circular reference)
    if (parentId) {
      const childCategories = await Category.findAll({ where: { parentId: id } });
      if (childCategories.some(child => child.id === parentId)) {
        throw new ValidationError('Cannot set a child category as parent');
      }
      
      // Check if parent exists
      const parentCategory = await Category.findByPk(parentId);
      if (!parentCategory) {
        throw new ValidationError('Parent category not found');
      }
    }
    
    // Update category
    await category.update({
      name: name || category.name,
      slug,
      description: description !== undefined ? description : category.description,
      icon: icon !== undefined ? icon : category.icon,
      image: image !== undefined ? image : category.image,
      parentId: parentId !== undefined ? (parentId || null) : category.parentId,
      order: order !== undefined ? order : category.order,
      isActive: isActive !== undefined ? isActive : category.isActive,
      attributes: attributes !== undefined ? attributes : category.attributes
    });
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category
      }
    });
  } catch (error) {
    logger.error('Update category error:', error);
    next(error);
  }
};

/**
 * Delete a category
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find category
    const category = await Category.findByPk(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    // Check if category has children
    const childCount = await Category.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new ValidationError('Cannot delete category with subcategories. Remove or reassign subcategories first.');
    }
    
    // Check if category has listings
    const listingCount = await Listing.count({ where: { categoryId: id } });
    if (listingCount > 0) {
      throw new ValidationError('Cannot delete category with listings. Remove or reassign listings first.');
    }
    
    // Delete category
    await category.destroy();
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    logger.error('Delete category error:', error);
    next(error);
  }
};

/**
 * Get category hierarchy
 */
exports.getCategoryHierarchy = async (req, res, next) => {
  try {
    // Get all root categories (those with no parent)
    const rootCategories = await Category.findAll({
      where: { 
        parentId: null,
        isActive: true
      },
      order: [
        ['order', 'ASC'],
        ['name', 'ASC']
      ],
      include: [{
        model: Category,
        as: 'children',
        where: { isActive: true },
        required: false,
        order: [
          ['order', 'ASC'],
          ['name', 'ASC']
        ]
      }]
    });
    
    res.json({
      success: true,
      data: {
        categories: rootCategories
      }
    });
  } catch (error) {
    logger.error('Get category hierarchy error:', error);
    next(error);
  }
};

/**
 * Get listings by category
 */
exports.getCategoryListings = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const { page = 1, limit = 12, sort = 'createdAt', order = 'DESC' } = req.query;
    
    // Find category by id or slug
    const category = await Category.findOne({
      where: {
        [Op.or]: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      },
      include: [{
        model: Category,
        as: 'children',
        attributes: ['id'],
        where: { isActive: true },
        required: false
      }]
    });
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    // Get category IDs to include (category and its children)
    const categoryIds = [category.id, ...category.children.map(child => child.id)];
    
    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;
    
    // Get listings in this category and its subcategories
    const { count, rows } = await Listing.findAndCountAll({
      where: {
        categoryId: { [Op.in]: categoryIds },
        status: 'active'
      },
      order: [[sort, order]],
      limit: limitNum,
      offset
    });
    
    const totalPages = Math.ceil(count / limitNum);
    
    res.json({
      success: true,
      data: {
        category,
        listings: rows,
        pagination: {
          total: count,
          page: pageNum,
          totalPages,
          limit: limitNum,
          hasMore: pageNum < totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Get category listings error:', error);
    next(error);
  }
}; 