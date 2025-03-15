const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { validateRequest } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations for the authenticated user
 * @access  Private
 */
router.get('/conversations', auth, messageController.getConversations);

/**
 * @route   GET /api/messages/unread
 * @desc    Get unread message count for the authenticated user
 * @access  Private
 */
router.get('/unread', auth, messageController.getUnreadCount);

/**
 * @route   GET /api/messages/conversations/:id
 * @desc    Get a specific conversation by ID
 * @access  Private
 */
router.get('/conversations/:id', auth, messageController.getConversation);

/**
 * @route   POST /api/messages/conversations
 * @desc    Create a new conversation
 * @access  Private
 */
router.post('/conversations', auth, validateRequest({
  body: {
    recipientId: { type: 'string', required: true },
    listingId: { type: 'string' },
    initialMessage: { type: 'string', required: true, minLength: 1 }
  }
}), messageController.createConversation);

/**
 * @route   POST /api/messages/conversations/:id
 * @desc    Send a message to an existing conversation
 * @access  Private
 */
router.post('/conversations/:id', auth, validateRequest({
  body: {
    content: { type: 'string', required: true, minLength: 1 }
  }
}), messageController.sendMessage);

/**
 * @route   PUT /api/messages/conversations/:id/archive
 * @desc    Archive a conversation
 * @access  Private
 */
router.put('/conversations/:id/archive', auth, messageController.archiveConversation);

/**
 * @route   PUT /api/messages/conversations/:id/unarchive
 * @desc    Unarchive a conversation
 * @access  Private
 */
router.put('/conversations/:id/unarchive', auth, messageController.unarchiveConversation);

/**
 * @route   PUT /api/messages/conversations/:id/read
 * @desc    Mark all messages in a conversation as read
 * @access  Private
 */
router.put('/conversations/:id/read', auth, messageController.markConversationAsRead);

module.exports = router; 