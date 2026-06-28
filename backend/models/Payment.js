// models/Payment.js - Payment Model (Sequelize / MySQL)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  receiptId: { type: DataTypes.STRING(100), unique: true, allowNull: false },

  // FK to members table (integer id) + business memberId string
  memberDbId: { type: DataTypes.INTEGER, allowNull: false },
  memberId:   { type: DataTypes.STRING(50), allowNull: false },

  // FK to contributions table (optional)
  contributionDbId: { type: DataTypes.INTEGER, allowNull: true },

  // Payment Details
  amount:   { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  currency: { type: DataTypes.ENUM('ETB', 'USD'), defaultValue: 'ETB' },
  frequency: {
    type: DataTypes.ENUM('Monthly', 'Quarterly', 'Semi-Annual', 'Annual'),
    defaultValue: 'Monthly'
  },
  method: {
    type: DataTypes.ENUM('Cash', 'Bank Transfer', 'Mobile Money', 'Check'),
    allowNull: false
  },
  paymentDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

  // Period covered
  periodMonth: { type: DataTypes.INTEGER, allowNull: false },
  periodYear:  { type: DataTypes.INTEGER, allowNull: false },

  receivedBy: { type: DataTypes.STRING(255), allowNull: false },

  status: {
    type: DataTypes.ENUM('Paid', 'Partial', 'Overpaid', 'Pending', 'Rejected'),
    defaultValue: 'Paid'
  },
  notes:            { type: DataTypes.TEXT, allowNull: true },
  receiptGenerated: { type: DataTypes.BOOLEAN, defaultValue: true },

  transactionId: { type: DataTypes.STRING(255), allowNull: true },
  receiptFile: { type: DataTypes.STRING(255), allowNull: true },
  bankName: { type: DataTypes.STRING(255), allowNull: true }

}, {
  tableName: 'payments',
  timestamps: true,
  indexes: [
    { fields: ['receiptId'] },
    { fields: ['memberId', 'periodYear', 'periodMonth'] },
    { fields: ['paymentDate'] }
  ]
});

// toJSON: reconstruct nested period object for API compatibility
Payment.prototype.toJSON = function () {
  const v = Object.assign({}, this.get());
  v._id = v.id;
  v.period = { month: v.periodMonth, year: v.periodYear };
  // Reconstruct member populate-like object if memberInfo is included
  if (v.memberInfo) {
    v.member = v.memberInfo;
  }
  return v;
};

module.exports = Payment;
