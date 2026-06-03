const { sequelize } = require('../config/db');
const DEBUG_DB = process.env.DEBUG_DB === 'true';

const createAILogsTable = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NULL,
        question TEXT NOT NULL,
        response TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_userId (userId),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    if (DEBUG_DB) console.log('✅ ai_logs table ready');
  } catch (err) {
    console.error('⚠️ ai_logs table error:', err.message);
  }
};

module.exports = createAILogsTable;
