const { sequelize } = require('../config/db');
const DEBUG_DB = process.env.DEBUG_DB === 'true';

module.exports = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS verify_et_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        paymentMethod VARCHAR(50) NOT NULL,
        referenceNumber VARCHAR(255) NOT NULL,
        accountSuffix VARCHAR(20) NULL,
        amount DECIMAL(15,2) NULL,
        senderName VARCHAR(255) NULL,
        receiverName VARCHAR(255) NULL,
        verificationStatus ENUM('PENDING','VERIFIED','FAILED') DEFAULT 'PENDING',
        requestId VARCHAR(255) NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_referenceNumber (referenceNumber),
        INDEX idx_requestId (requestId),
        INDEX idx_verificationStatus (verificationStatus),
        INDEX idx_paymentMethod (paymentMethod)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    if (DEBUG_DB) console.log('verify_et_payments table ready');
  } catch (err) {
    console.error('Migration error (verify_et_payments):', err.message);
  }
};
