const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AIActivityLog = sequelize.define('AIActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' }
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'conversation_id',
    references: { model: 'conversations', key: 'id' }
  },
  agent: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  query: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  responseTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'response_time'
  },
  tokenUsage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'token_usage'
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  exportFormat: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'export_format'
  },
  reportTitle: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'report_title'
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ai_activity_logs',
  timestamps: false
});

module.exports = AIActivityLog;
