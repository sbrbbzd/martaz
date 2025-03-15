const { User, Listing, Category } = require('../models');
const { ApiError } = require('../utils/errors');
const { Op } = require('sequelize');

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