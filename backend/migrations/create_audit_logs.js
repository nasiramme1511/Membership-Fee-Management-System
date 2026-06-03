// migrations/create_audit_logs.js - Create audit_logs table if not exists
const { sequelize } = require('../config/db');

module.exports = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        username VARCHAR(100) NOT NULL,
        actionType VARCHAR(50) NOT NULL,
        recordCount INT NOT NULL DEFAULT 0,
        ipAddress VARCHAR(45) DEFAULT NULL,
        details JSON DEFAULT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_userId (userId),
        INDEX idx_actionType (actionType),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ audit_logs table ensured');
  } catch (err) {
    console.error('❌ Failed to create audit_logs table:', err.message);
  }
};
