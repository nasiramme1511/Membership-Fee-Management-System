const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ConversationMetadata = sequelize.define('ConversationMetadata', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'conversation_id',
    references: { model: 'conversations', key: 'id' }
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lastAgent: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'last_agent'
  },
  lastTopic: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'last_topic'
  },
  totalMessages: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_messages'
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'conversation_metadata',
  timestamps: true,
  createdAt: false, // Only use updatedAt
  updatedAt: 'updatedAt'
});

module.exports = ConversationMetadata;
