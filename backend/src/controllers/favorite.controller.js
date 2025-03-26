const { Favorite, Listing, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all favorites for the current user
 */
exports.getFavorites = async (req, res) => {
  try {
    console.log('GET /favorites request params:', req.query);
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Parse the sort parameter (format: 'field:direction')
    let order = [['createdAt', 'DESC']];
    let listingOrder = null;
    
    if (req.query.sort) {
      try {
        const sortParam = req.query.sort;
        console.log('Sort parameter:', sortParam);
        
        if (sortParam.includes(':')) {
          const [field, direction] = sortParam.split(':');
          const directionUpper = direction.toUpperCase();
          
          // Validate direction
          if (!['ASC', 'DESC'].includes(directionUpper)) {
            console.log(`Invalid sort direction: ${direction}, using DESC`);
          } else {
            // Handle specific fields
            if (field === 'created_at') {
              // For created_at, sort by the favorite's createdAt
              order = [['createdAt', directionUpper]];
              console.log(`Using favorite sort: createdAt ${directionUpper}`);
            } else if (['price', 'title'].includes(field)) {
              // For listing fields, we'll handle in the listing query
              listingOrder = [[field, directionUpper]];
              console.log(`Setting listing sort: ${field} ${directionUpper}`);
            }
          }
        }
      } catch (sortError) {
        console.error('Error parsing sort parameter:', sortError);
        // Continue with default sort if there's an error
      }
    }

    // Count total favorites for pagination info
    const totalCount = await Favorite.count({
      where: { userId }
    });

    console.log(`Found ${totalCount} total favorites for user ${userId}`);

    // Fetch favorites with pagination
    const favorites = await Favorite.findAll({
      where: { userId },
      order,
      limit,
      offset,
    });

    console.log(`Retrieved ${favorites.length} favorites for current page`);

    // Get the listing details for favorites with itemType 'listing'
    const listingIds = favorites
      .filter(fav => fav.itemType === 'listing')
      .map(fav => fav.itemId);

    console.log(`Found ${listingIds.length} listing IDs to fetch`);

    let listings = [];
    if (listingIds.length > 0) {
      // Get listings with specific order if provided
      const listingQuery = {
        where: { id: { [Op.in]: listingIds } },
        attributes: ['id', 'title', 'price', 'description', 'status', 'slug', 'images', 'currency', 'location', 'featuredImage', 'createdAt', 'condition', 'isPromoted'],
      };
      
      // Add order if specified
      if (listingOrder) {
        listingQuery.order = listingOrder;
      }
      
      try {
        listings = await Listing.findAll(listingQuery);
        console.log(`Retrieved ${listings.length} listings`);
      } catch (listingError) {
        console.error('Error fetching listings:', listingError);
        // Continue with empty listings array
      }
    }

    // Create a map for O(1) lookup of listings
    const listingMap = {};
    listings.forEach(listing => {
      listingMap[listing.id] = listing;
    });

    // Combine the data and format it according to expected frontend structure
    const formattedListings = [];
    
    // Process listings based on the order of favorites to preserve sort order
    for (const favorite of favorites) {
      if (favorite.itemType === 'listing') {
        const listing = listingMap[favorite.itemId];
        if (listing) {
          // Safely extract and transform the listing data
          formattedListings.push({
            id: listing.id,
            title: listing.title || '',
            price: listing.price || 0,
            currency: listing.currency || '₼',
            description: listing.description || '',
            status: listing.status || 'active',
            slug: listing.slug || '',
            images: listing.images || [],
            featuredImage: listing.featuredImage || null,
            location: listing.location || '',
            createdAt: listing.createdAt,
            condition: listing.condition || 'used',
            isPromoted: listing.isPromoted || false
          });
        }
      }
    }

    console.log(`Formatted ${formattedListings.length} listings for response`);

    // Return in the format expected by the frontend
    res.status(200).json({
      success: true,
      data: {
        listings: formattedListings,
        total: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error getting favorites:', error);
    // Send more detailed error information
    res.status(500).json({ 
      success: false,
      message: 'Failed to get favorites', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Add a new favorite
 */
exports.addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, itemType } = req.body;

    // Validate input
    if (!itemId || !itemType) {
      return res.status(400).json({ message: 'Item ID and type are required' });
    }

    if (!['product', 'listing'].includes(itemType)) {
      return res.status(400).json({ message: 'Invalid item type' });
    }

    // Check if favorite already exists
    const existingFavorite = await Favorite.findOne({
      where: { userId, itemId, itemType },
    });

    if (existingFavorite) {
      return res.status(409).json({ message: 'Item is already in favorites' });
    }

    // Create new favorite
    const favorite = await Favorite.create({
      userId,
      itemId,
      itemType,
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Failed to add favorite', error: error.message });
  }
};

/**
 * Remove a favorite
 */
exports.removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const favorite = await Favorite.findOne({
      where: { id, userId },
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    await favorite.destroy();
    res.status(200).json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Failed to remove favorite', error: error.message });
  }
};

/**
 * Check if an item is in favorites
 */
exports.checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, itemType } = req.query;

    if (!itemId || !itemType) {
      return res.status(400).json({ message: 'Item ID and type are required' });
    }

    const favorite = await Favorite.findOne({
      where: { userId, itemId, itemType },
    });

    res.status(200).json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ message: 'Failed to check favorite', error: error.message });
  }
};

/**
 * Get a specific favorite by itemId and itemType
 */
exports.getFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, itemType } = req.query;

    if (!itemId || !itemType) {
      return res.status(400).json({ message: 'Item ID and type are required' });
    }

    const favorite = await Favorite.findOne({
      where: { userId, itemId, itemType },
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.status(200).json(favorite);
  } catch (error) {
    console.error('Error getting favorite:', error);
    res.status(500).json({ message: 'Failed to get favorite', error: error.message });
  }
}; 