const { User, Listing, Conversation, Message } = require('../models');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * Get all conversations for the authenticated user
 */
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, archived = false } = req.query;
    
    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;
    
    // Find conversations where the user is either user1 or user2
    const { count, rows } = await Conversation.findAndCountAll({
      where: {
        [Op.or]: [
          { 
            user1Id: userId,
            user1Archived: archived === 'true' || archived === true
          },
          { 
            user2Id: userId,
            user2Archived: archived === 'true' || archived === true
          }
        ]
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title', 'slug', 'price', 'currency', 'status', 'images']
        },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          attributes: ['content', 'createdAt', 'senderId']
        }
      ],
      order: [['lastMessageAt', 'DESC']],
      limit: limitNum,
      offset
    });
    
    // Format the conversations to include unread count for the current user
    const formattedConversations = rows.map(conversation => {
      const isUser1 = conversation.user1Id === userId;
      const otherUser = isUser1 ? conversation.user2 : conversation.user1;
      const unreadCount = isUser1 ? conversation.user1UnreadCount : conversation.user2UnreadCount;
      
      return {
        id: conversation.id,
        otherUser: {
          id: otherUser.id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          profileImage: otherUser.profileImage
        },
        listing: conversation.listing,
        lastMessage: conversation.messages[0] || null,
        unreadCount,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt
      };
    });
    
    const totalPages = Math.ceil(count / limitNum);
    
    res.json({
      success: true,
      data: {
        conversations: formattedConversations,
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
    logger.error('Get conversations error:', error);
    next(error);
  }
};

/**
 * Get a specific conversation by ID
 */
exports.getConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the conversation
    const conversation = await Conversation.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title', 'slug', 'price', 'currency', 'status', 'images']
        }
      ]
    });
    
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    
    // Check if the user is part of this conversation
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenError('You are not authorized to view this conversation');
    }
    
    // Get messages for this conversation
    const messages = await Message.findAll({
      where: { conversationId: id },
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        }
      ]
    });
    
    // Mark unread messages as read
    const isUser1 = conversation.user1Id === userId;
    if ((isUser1 && conversation.user1UnreadCount > 0) || (!isUser1 && conversation.user2UnreadCount > 0)) {
      await Message.update(
        { isRead: true, readAt: new Date() },
        { 
          where: { 
            conversationId: id,
            receiverId: userId,
            isRead: false
          } 
        }
      );
      
      // Reset unread counter
      if (isUser1) {
        conversation.user1UnreadCount = 0;
      } else {
        conversation.user2UnreadCount = 0;
      }
      await conversation.save();
    }
    
    // Format the response
    const otherUser = isUser1 ? conversation.user2 : conversation.user1;
    
    res.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          otherUser: {
            id: otherUser.id,
            firstName: otherUser.firstName,
            lastName: otherUser.lastName,
            profileImage: otherUser.profileImage
          },
          listing: conversation.listing,
          createdAt: conversation.createdAt,
          messages
        }
      }
    });
  } catch (error) {
    logger.error('Get conversation error:', error);
    next(error);
  }
};

/**
 * Create a new conversation
 */
exports.createConversation = async (req, res, next) => {
  try {
    const { recipientId, listingId, initialMessage } = req.body;
    const senderId = req.user.id;
    
    // Check if recipient exists
    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      throw new NotFoundError('Recipient not found');
    }
    
    // Check if listing exists
    let listing = null;
    if (listingId) {
      listing = await Listing.findByPk(listingId);
      if (!listing) {
        throw new NotFoundError('Listing not found');
      }
      
      // Check if the listing is active
      if (listing.status !== 'active') {
        throw new ValidationError('Cannot message about an inactive listing');
      }
      
      // Prevent messaging yourself about your own listing
      if (listing.userId === senderId && listing.userId === recipientId) {
        throw new ValidationError('Cannot message yourself about your own listing');
      }
    }
    
    // Prevent messaging yourself
    if (senderId === recipientId) {
      throw new ValidationError('Cannot send a message to yourself');
    }
    
    // Check if a conversation already exists between these users (optional: also check for the same listing)
    const existingConversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { user1Id: senderId, user2Id: recipientId },
          { user1Id: recipientId, user2Id: senderId }
        ],
        ...(listingId ? { listingId } : {})
      }
    });
    
    let conversation;
    
    if (existingConversation) {
      // Use the existing conversation
      conversation = existingConversation;
      
      // Update archived status
      if (conversation.user1Id === senderId && conversation.user1Archived) {
        conversation.user1Archived = false;
      } else if (conversation.user2Id === senderId && conversation.user2Archived) {
        conversation.user2Archived = false;
      }
      
      // Update last message time
      conversation.lastMessageAt = new Date();
      await conversation.save();
    } else {
      // Create a new conversation
      conversation = await Conversation.create({
        user1Id: senderId,
        user2Id: recipientId,
        listingId: listingId || null,
        lastMessageAt: new Date()
      });
    }
    
    // Create the initial message
    const message = await Message.create({
      conversationId: conversation.id,
      senderId,
      receiverId: recipientId,
      content: initialMessage
    });
    
    // Increment unread count for recipient
    if (conversation.user1Id === recipientId) {
      conversation.user1UnreadCount += 1;
    } else {
      conversation.user2UnreadCount += 1;
    }
    
    await conversation.save();
    
    // Get full conversation details for response
    const fullConversation = await Conversation.findByPk(conversation.id, {
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        },
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title', 'slug', 'price', 'currency', 'status', 'images']
        }
      ]
    });
    
    // Format the response
    const otherUser = fullConversation.user1Id === senderId ? fullConversation.user2 : fullConversation.user1;
    
    res.status(201).json({
      success: true,
      message: 'Conversation started successfully',
      data: {
        conversation: {
          id: fullConversation.id,
          otherUser: {
            id: otherUser.id,
            firstName: otherUser.firstName,
            lastName: otherUser.lastName,
            profileImage: otherUser.profileImage
          },
          listing: fullConversation.listing,
          createdAt: fullConversation.createdAt,
          messages: [message]
        }
      }
    });
  } catch (error) {
    logger.error('Create conversation error:', error);
    next(error);
  }
};

/**
 * Send a message to an existing conversation
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;
    
    // Find the conversation
    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    
    // Check if the user is part of this conversation
    if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
      throw new ForbiddenError('You are not authorized to send a message in this conversation');
    }
    
    // Determine the recipient
    const receiverId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id;
    
    // Create the message
    const message = await Message.create({
      conversationId: id,
      senderId,
      receiverId,
      content
    });
    
    // Update conversation
    conversation.lastMessageAt = new Date();
    
    // Increment unread count for recipient
    if (conversation.user1Id === receiverId) {
      conversation.user1UnreadCount += 1;
    } else {
      conversation.user2UnreadCount += 1;
    }
    
    // If sender had archived the conversation, unarchive it
    if (conversation.user1Id === senderId && conversation.user1Archived) {
      conversation.user1Archived = false;
    } else if (conversation.user2Id === senderId && conversation.user2Archived) {
      conversation.user2Archived = false;
    }
    
    await conversation.save();
    
    // Get the user information to include in the response
    const sender = await User.findByPk(senderId, {
      attributes: ['id', 'firstName', 'lastName', 'profileImage']
    });
    
    message.sender = sender;
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message
      }
    });
  } catch (error) {
    logger.error('Send message error:', error);
    next(error);
  }
};

/**
 * Archive a conversation
 */
exports.archiveConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the conversation
    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    
    // Check if the user is part of this conversation
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenError('You are not authorized to archive this conversation');
    }
    
    // Archive the conversation for this user
    if (conversation.user1Id === userId) {
      conversation.user1Archived = true;
    } else {
      conversation.user2Archived = true;
    }
    
    await conversation.save();
    
    res.json({
      success: true,
      message: 'Conversation archived successfully'
    });
  } catch (error) {
    logger.error('Archive conversation error:', error);
    next(error);
  }
};

/**
 * Unarchive a conversation
 */
exports.unarchiveConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the conversation
    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    
    // Check if the user is part of this conversation
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenError('You are not authorized to unarchive this conversation');
    }
    
    // Unarchive the conversation for this user
    if (conversation.user1Id === userId) {
      conversation.user1Archived = false;
    } else {
      conversation.user2Archived = false;
    }
    
    await conversation.save();
    
    res.json({
      success: true,
      message: 'Conversation unarchived successfully'
    });
  } catch (error) {
    logger.error('Unarchive conversation error:', error);
    next(error);
  }
};

/**
 * Mark all messages in a conversation as read
 */
exports.markConversationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the conversation
    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    
    // Check if the user is part of this conversation
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenError('You are not authorized to access this conversation');
    }
    
    // Mark unread messages as read
    await Message.update(
      { isRead: true, readAt: new Date() },
      { 
        where: { 
          conversationId: id,
          receiverId: userId,
          isRead: false
        } 
      }
    );
    
    // Reset unread counter
    if (conversation.user1Id === userId) {
      conversation.user1UnreadCount = 0;
    } else {
      conversation.user2UnreadCount = 0;
    }
    
    await conversation.save();
    
    res.json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    logger.error('Mark conversation as read error:', error);
    next(error);
  }
};

/**
 * Get unread message count for the authenticated user
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get total unread messages
    const totalUnread = await sequelize.query(
      `
      SELECT 
        SUM(CASE WHEN user1_id = :userId THEN user1_unread_count ELSE user2_unread_count END) as total
      FROM conversations
      WHERE (user1_id = :userId OR user2_id = :userId)
      `,
      {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    const unreadCount = parseInt(totalUnread[0].total || 0, 10);
    
    res.json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    next(error);
  }
}; 