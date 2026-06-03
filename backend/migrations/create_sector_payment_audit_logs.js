const { sequelize } = require('../config/db');
const DEBUG_DB = process.env.DEBUG_DB === 'true';

module.exports = async () => {
  try {
    // 1. Alter approvalStatus to support new statuses: PENDING, APPROVED, REJECTED, CORRECTION_REQUESTED, REOPENED, FLAGGED
    await sequelize.query(`
      ALTER TABLE sector_payments 
      MODIFY COLUMN approvalStatus ENUM('PENDING', 'APPROVED', 'REJECTED', 'CORRECTION_REQUESTED', 'REOPENED', 'FLAGGED') DEFAULT 'PENDING';
    `);
    if (DEBUG_DB) console.log('✅ Altered sector_payments approvalStatus column successfully');
  } catch (e) {
    console.error('⚠️ sector_payments alter error:', e.message);
  }

  try {
    // 2. Create sector_payment_audit_logs table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sector_payment_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sectorPaymentId INT NOT NULL,
        userId INT NULL,
        actionType VARCHAR(50) NOT NULL,
        oldValues JSON NULL,
        newValues JSON NULL,
        notes TEXT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sectorPaymentId (sectorPaymentId),
        INDEX idx_userId (userId),
        INDEX idx_actionType (actionType)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    if (DEBUG_DB) console.log('✅ sector_payment_audit_logs table ready');

    // 3. Foreign key constraints
    const [fkRows] = await sequelize.query(`
      SELECT COUNT(*) AS cnt FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'sector_payment_audit_logs'
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);
    if (Number(fkRows[0].cnt) === 0) {
      await sequelize.query(`
        ALTER TABLE sector_payment_audit_logs
          ADD CONSTRAINT fk_spal_sectorPayment FOREIGN KEY (sectorPaymentId) REFERENCES sector_payments(id) ON DELETE CASCADE,
          ADD CONSTRAINT fk_spal_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL;
      `);
      if (DEBUG_DB) console.log('✅ sector_payment_audit_logs foreign keys added');
    }
  } catch (e) {
    console.error('⚠️ sector_payment_audit_logs migration error:', e.message);
  }
};
