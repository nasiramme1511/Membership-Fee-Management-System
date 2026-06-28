const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VerifyEtPayment = sequelize.define('VerifyEtPayment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paymentMethod: { type: DataTypes.STRING(50), allowNull: false },
  referenceNumber: { type: DataTypes.STRING(255), allowNull: false },
  accountSuffix: { type: DataTypes.STRING(20), allowNull: true },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
  senderName: { type: DataTypes.STRING(255), allowNull: true },
  receiverName: { type: DataTypes.STRING(255), allowNull: true },
  verificationStatus: {
    type: DataTypes.ENUM('PENDING', 'VERIFIED', 'FAILED'),
    defaultValue: 'PENDING',
  },
  requestId: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'verify_et_payments',
  timestamps: true,
  indexes: [
    { fields: ['referenceNumber'] },
    { fields: ['requestId'] },
    { fields: ['verificationStatus'] },
    { fields: ['paymentMethod'] },
  ],
});

module.exports = VerifyEtPayment;
