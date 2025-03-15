const { Category, Listing, User } = require('../models');
const { ApiError } = require('../utils/errors');
const { Sequelize } = require('sequelize');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'slug', 'icon', 'image', 'parentId'],
      order: [['order', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'subcategories',
          where: { isActive: true },
          required: false
        }
      ]
    });

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const category = await Category.findOne({
      where: {
        [Sequelize.Op.or]: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      },
      include: [
        {
          model: Category,
          as: 'subcategories',
          where: { isActive: true },
          required: false
        }
      ]
    });

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

exports.getSubcategories = async (req, res, next) => {
  try {
    const subcategories = await Category.findAll({
      where: {
        parentId: req.params.id,
        isActive: true
      },
      order: [['order', 'ASC']]
    });

    res.json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryHierarchy = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: {
        parentId: null,
        isActive: true
      },
      include: [
        {
          model: Category,
          as: 'subcategories',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: Category,
              as: 'subcategories',
              where: { isActive: true },
              required: false
            }
          ]
        }
      ],
      order: [
        ['order', 'ASC'],
        [{ model: Category, as: 'subcategories' }, 'order', 'ASC'],
        [{ model: Category, as: 'subcategories' }, { model: Category, as: 'subcategories' }, 'order', 'ASC']
      ]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    await category.update(req.body);

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    // Check if category has subcategories
    const hasSubcategories = await Category.count({
      where: { parentId: category.id }
    });

    if (hasSubcategories) {
      throw new ApiError(400, 'Cannot delete category with subcategories');
    }

    // Check if category has active listings
    const hasListings = await Listing.count({
      where: { categoryId: category.id, status: 'active' }
    });

    if (hasListings) {
      // Soft delete by marking as inactive
      await category.update({ isActive: false });
    } else {
      // Hard delete if no active listings
      await category.destroy();
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { idOrSlug } = req.params;

    const category = await Category.findOne({
      where: {
        [Sequelize.Op.or]: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      }
    });

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    const listings = await Listing.findAndCountAll({
      where: {
        categoryId: category.id,
        status: 'active'
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        category,
        listings: listings.rows,
        total: listings.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(listings.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}; 