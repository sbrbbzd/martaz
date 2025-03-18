const { User, Listing, Category } = require('../models');
const { ApiError } = require('../utils/errors');
const { Op } = require('sequelize');
const sequelize = require('../config/sequelize');

// Dashboard Statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalListings,
      activeListings,
      totalCategories,
      recentListings,
      userStats
    ] = await Promise.all([
      User.count(),
      Listing.count(),
      Listing.count({ where: { status: 'active' } }),
      Category.count({ where: { isActive: true } }),
      Listing.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [
          { model: User, as: 'user', attributes: ['firstName', 'lastName'] },
          { model: Category, as: 'category', attributes: ['name'] }
        ]
      }),
      User.count({
        group: ['role']
      })
    ]);

    // Get listings created in the last 7 days
    const lastWeekListings = await Listing.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          byRole: userStats
        },
        listings: {
          total: totalListings,
          active: activeListings,
          lastWeek: lastWeekListings
        },
        categories: totalCategories,
        recentListings
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Dashboard Data for Admin UI
exports.getAdminDashboardData = async (req, res, next) => {
  try {
    // Get total users count
    const totalUsers = await User.count();
    
    // Get total listings count
    const totalListings = await Listing.count();
    
    // Get pending listings
    const pendingListings = await Listing.findAll({
      where: { status: 'pending' },
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['firstName', 'lastName'] 
        },
        { 
          model: Category, 
          as: 'category', 
          attributes: ['name', 'slug'] 
        }
      ],
      attributes: ['id', 'title', 'createdAt']
    });
    
    // Get active categories
    const activeCategories = await Category.findAll({
      where: { isActive: true },
      attributes: ['name', 'slug'],
      order: [['name', 'ASC']]
    });
    
    // Calculate user growth (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const [recentUsers, previousUsers] = await Promise.all([
      User.count({
        where: {
          createdAt: {
            [Op.gte]: thirtyDaysAgo
          }
        }
      }),
      User.count({
        where: {
          createdAt: {
            [Op.gte]: sixtyDaysAgo,
            [Op.lt]: thirtyDaysAgo
          }
        }
      })
    ]);
    
    const userGrowth = previousUsers === 0 
      ? 100 
      : ((recentUsers - previousUsers) / previousUsers) * 100;
    
    // Calculate listing growth (last 30 days vs previous 30 days)
    const [recentListings, previousListings] = await Promise.all([
      Listing.count({
        where: {
          createdAt: {
            [Op.gte]: thirtyDaysAgo
          }
        }
      }),
      Listing.count({
        where: {
          createdAt: {
            [Op.gte]: sixtyDaysAgo,
            [Op.lt]: thirtyDaysAgo
          }
        }
      })
    ]);
    
    const listingGrowth = previousListings === 0 
      ? 100 
      : ((recentListings - previousListings) / previousListings) * 100;
    
    // Get recent activity (new users and new listings)
    const recentActivity = [];
    
    // Get recent user registrations
    const recentUserRegistrations = await User.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'firstName', 'lastName', 'createdAt']
    });
    
    recentUserRegistrations.forEach(user => {
      recentActivity.push({
        id: `user-${user.id}`,
        type: 'user-registered',
        user: `${user.firstName} ${user.lastName}`,
        timestamp: user.createdAt
      });
    });
    
    // Get recent listing creations
    const recentListingCreations = await Listing.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['firstName', 'lastName'] 
        }
      ],
      attributes: ['id', 'title', 'createdAt']
    });
    
    recentListingCreations.forEach(listing => {
      recentActivity.push({
        id: `listing-${listing.id}`,
        type: 'listing-created',
        user: `${listing.user.firstName} ${listing.user.lastName}`,
        title: listing.title,
        timestamp: listing.createdAt
      });
    });
    
    // Sort all activity by timestamp (most recent first)
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit to 10 most recent activities
    const limitedActivity = recentActivity.slice(0, 10);
    
    res.json({
      success: true,
      data: {
        totalUsers: { count: totalUsers },
        totalListings: { count: totalListings },
        pendingListings: pendingListings.map(listing => ({
          id: listing.id,
          title: listing.title,
          user: `${listing.user.firstName} ${listing.user.lastName}`,
          category: listing.category.name,
          createdAt: listing.createdAt
        })),
        activeCategories: {
          count: activeCategories.length,
          list: activeCategories.map(cat => cat.name)
        },
        userGrowth: parseFloat(userGrowth.toFixed(1)),
        listingGrowth: parseFloat(listingGrowth.toFixed(1)),
        recentActivity: limitedActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// Approve a pending listing
exports.approveListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }
    
    if (listing.status !== 'pending') {
      throw new ApiError(400, 'Listing is not in pending status');
    }
    
    await listing.update({ status: 'active' });
    
    res.json({
      success: true,
      message: 'Listing approved successfully',
      data: { id: listing.id }
    });
  } catch (error) {
    next(error);
  }
};

// Reject a pending listing
exports.rejectListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const listing = await Listing.findByPk(id);
    
    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }
    
    if (listing.status !== 'pending') {
      throw new ApiError(400, 'Listing is not in pending status');
    }
    
    await listing.update({ 
      status: 'rejected',
      rejectionReason: reason || 'Rejected by administrator'
    });
    
    res.json({
      success: true,
      message: 'Listing rejected successfully',
      data: { id: listing.id }
    });
  } catch (error) {
    next(error);
  }
};

// User Management
exports.getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role,
      status
    } = req.query;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (role) whereClause.role = role;
    if (status) whereClause.status = status;

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        total: users.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(users.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Listing,
          as: 'listings',
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Prevent updating sensitive fields
    delete req.body.password;
    delete req.body.email;

    await user.update(req.body);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Soft delete user and their listings
    await Promise.all([
      user.update({ status: 'inactive' }),
      Listing.update(
        { status: 'deleted' },
        { where: { userId: user.id } }
      )
    ]);

    res.json({
      success: true,
      message: 'User and associated listings deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Reports and Analytics
exports.getUsersReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {};

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const [
      usersByRole,
      usersByStatus,
      newUsers,
      userActivity
    ] = await Promise.all([
      User.count({ group: ['role'], where: whereClause }),
      User.count({ group: ['status'], where: whereClause }),
      User.count({
        where: {
          ...whereClause,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        group: [sequelize.fn('date', sequelize.col('createdAt'))]
      }),
      Listing.count({
        where: whereClause,
        group: ['userId'],
        having: sequelize.literal('count(*) > 0')
      })
    ]);

    res.json({
      success: true,
      data: {
        usersByRole,
        usersByStatus,
        newUsers,
        userActivity: {
          total: userActivity.length,
          activeUsers: userActivity
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getListingsReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {};

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const [
      listingsByStatus,
      listingsByCategory,
      listingTrends,
      popularListings
    ] = await Promise.all([
      Listing.count({ group: ['status'], where: whereClause }),
      Listing.count({ group: ['categoryId'], where: whereClause }),
      Listing.count({
        where: {
          ...whereClause,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        group: [sequelize.fn('date', sequelize.col('createdAt'))]
      }),
      Listing.findAll({
        where: whereClause,
        order: [['views', 'DESC']],
        limit: 10,
        include: [
          { model: Category, as: 'category', attributes: ['name'] },
          { model: User, as: 'user', attributes: ['firstName', 'lastName'] }
        ]
      })
    ]);

    res.json({
      success: true,
      data: {
        listingsByStatus,
        listingsByCategory,
        listingTrends,
        popularListings
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategoriesReport = async (req, res, next) => {
  try {
    const [
      categoryCounts,
      categoryListings,
      categoryViews
    ] = await Promise.all([
      Category.count({ where: { isActive: true } }),
      Listing.count({
        where: { status: 'active' },
        group: ['categoryId'],
        include: [{ model: Category, as: 'category', attributes: ['name'] }]
      }),
      Listing.sum('views', {
        group: ['categoryId'],
        include: [{ model: Category, as: 'category', attributes: ['name'] }]
      })
    ]);

    res.json({
      success: true,
      data: {
        totalCategories: categoryCounts,
        listingsPerCategory: categoryListings,
        viewsPerCategory: categoryViews
      }
    });
  } catch (error) {
    next(error);
  }
};

// Listing Management
exports.getListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      category,
      sort = 'createdAt',
      order = 'DESC'
    } = req.query;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (status) whereClause.status = status;
    
    // Include category filter if provided
    const includeOptions = [
      { 
        model: User, 
        as: 'user', 
        attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage'] 
      },
      { 
        model: Category, 
        as: 'category', 
        attributes: ['id', 'name', 'slug'] 
      }
    ];
    
    if (category) {
      includeOptions[1].where = { slug: category };
    }

    const listings = await Listing.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [[sort, order]]
    });

    res.json({
      success: true,
      data: {
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

exports.getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id, {
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage'] 
        },
        { 
          model: Category, 
          as: 'category', 
          attributes: ['id', 'name', 'slug', 'parentId'] 
        }
      ]
    });

    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    next(error);
  }
};

exports.updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id);

    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }

    await listing.update(req.body);

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id);

    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }

    // Soft delete
    await listing.update({ status: 'deleted' });

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Category Management
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
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
    const { name, slug, parentId, description, isActive } = req.body;
    
    // Check if category with same slug already exists
    const existingCategory = await Category.findOne({ where: { slug } });
    if (existingCategory) {
      throw new ApiError(400, 'Category with this slug already exists');
    }
    
    const category = await Category.create({
      name,
      slug,
      parentId: parentId || null,
      description,
      isActive: isActive !== undefined ? isActive : true
    });
    
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
    const { id } = req.params;
    const { name, slug, parentId, description, isActive } = req.body;
    
    const category = await Category.findByPk(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    
    // Check if slug is being changed and if new slug already exists
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({ where: { slug } });
      if (existingCategory) {
        throw new ApiError(400, 'Category with this slug already exists');
      }
    }
    
    await category.update({
      name: name || category.name,
      slug: slug || category.slug,
      parentId: parentId === null ? null : (parentId || category.parentId),
      description: description || category.description,
      isActive: isActive !== undefined ? isActive : category.isActive
    });
    
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
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    
    // Check if category has child categories
    const childCategories = await Category.count({ where: { parentId: id } });
    if (childCategories > 0) {
      throw new ApiError(400, 'Cannot delete category with child categories');
    }
    
    // Check if category has listings
    const categoryListings = await Listing.count({ where: { categoryId: id } });
    if (categoryListings > 0) {
      throw new ApiError(400, 'Cannot delete category with listings');
    }
    
    await category.destroy();
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}; 