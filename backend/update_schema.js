const { sequelize } = require('./config/db');
(async () => {
  try {
    await sequelize.query("ALTER TABLE payments MODIFY COLUMN status ENUM('Paid', 'Partial', 'Overpaid', 'Pending', 'Rejected') DEFAULT 'Paid';");
    
    // Add columns conditionally
    const cols = await sequelize.query("SHOW COLUMNS FROM payments");
    const colNames = cols[0].map(c => c.Field);
    
    if (!colNames.includes('transactionId')) {
      await sequelize.query("ALTER TABLE payments ADD COLUMN transactionId VARCHAR(255) NULL;");
    }
    if (!colNames.includes('receiptFile')) {
      await sequelize.query("ALTER TABLE payments ADD COLUMN receiptFile VARCHAR(255) NULL;");
    }
    if (!colNames.includes('bankName')) {
      await sequelize.query("ALTER TABLE payments ADD COLUMN bankName VARCHAR(255) NULL;");
    }
    
    console.log('Database schema updated successfully.');
  } catch (err) {
    console.error('Error updating schema:', err.message);
  }
  process.exit(0);
})();
