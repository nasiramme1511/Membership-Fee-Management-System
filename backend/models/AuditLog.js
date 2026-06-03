const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  actionType: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  recordCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['actionType'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = AuditLog;
