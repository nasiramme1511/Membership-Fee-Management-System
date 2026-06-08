const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Conversation = sequelize.define('Conversation', {
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  pinned: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  favorite: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Conversation;
