const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user1Id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  user2Id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  listingId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'listings',
      key: 'id'
    }
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  user1UnreadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  user2UnreadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  user1Archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  user2Archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'conversations',
  indexes: [
    {
      name: 'conversation_participants_idx',
      fields: ['user1Id', 'user2Id']
    },
    {
      name: 'conversation_listing_idx',
      fields: ['listingId']
    },
    {
      name: 'conversation_last_message_idx',
      fields: ['lastMessageAt']
    }
  ]
});

module.exports = Conversation; 