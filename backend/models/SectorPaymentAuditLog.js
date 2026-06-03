const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SectorPaymentAuditLog = sequelize.define('SectorPaymentAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sectorPaymentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'sector_payments', key: 'id' }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  actionType: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  oldValues: {
    type: DataTypes.JSON,
    allowNull: true
  },
  newValues: {
    type: DataTypes.JSON,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'sector_payment_audit_logs',
  timestamps: true,
  indexes: [
    { fields: ['sectorPaymentId'] },
    { fields: ['userId'] },
    { fields: ['actionType'] }
  ]
});

SectorPaymentAuditLog.prototype.toJSON = function () {
  const v = Object.assign({}, this.get());
  v._id = v.id;
  return v;
};

module.exports = SectorPaymentAuditLog;
