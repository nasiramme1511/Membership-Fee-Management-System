// Fix payments table - add missing columns and update status enum
const { sequelize } = require('../config/db');

module.exports = async () => {
  try {
    // Add transactionId column if it doesn't exist
    await sequelize.query(
      "ALTER TABLE payments ADD COLUMN transactionId VARCHAR(255) DEFAULT NULL AFTER receiptGenerated"
    );
    console.log('✅ Added transactionId column to payments');
  } catch (e) {
    if (e.message.includes('Duplicate column') || e.message.includes('already exists')) {
      console.log('→ transactionId column already exists');
    } else {
      console.error('⚠️  Error adding transactionId:', e.message);
    }
  }

  try {
    // Add bankName column if it doesn't exist
    await sequelize.query(
      "ALTER TABLE payments ADD COLUMN bankName VARCHAR(255) DEFAULT NULL AFTER transactionId"
    );
    console.log('✅ Added bankName column to payments');
  } catch (e) {
    if (e.message.includes('Duplicate column') || e.message.includes('already exists')) {
      console.log('→ bankName column already exists');
    } else {
      console.error('⚠️  Error adding bankName:', e.message);
    }
  }

  try {
    // Add receiptFile column if it doesn't exist
    await sequelize.query(
      "ALTER TABLE payments ADD COLUMN receiptFile VARCHAR(255) DEFAULT NULL AFTER bankName"
    );
    console.log('✅ Added receiptFile column to payments');
  } catch (e) {
    if (e.message.includes('Duplicate column') || e.message.includes('already exists')) {
      console.log('→ receiptFile column already exists');
    } else {
      console.error('⚠️  Error adding receiptFile:', e.message);
    }
  }

  try {
    // Update status enum to include 'Pending' and 'Rejected'
    await sequelize.query(
      "ALTER TABLE payments MODIFY COLUMN status ENUM('Paid','Partial','Overpaid','Pending','Rejected') NOT NULL DEFAULT 'Paid'"
    );
    console.log('✅ Updated payments.status enum');
  } catch (e) {
    console.error('⚠️  Error updating status enum:', e.message);
  }
};
