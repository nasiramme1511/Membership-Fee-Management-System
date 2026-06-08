const { sequelize } = require('../config/db');

const createExportLogColumns = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE ai_activity_logs 
      ADD COLUMN action VARCHAR(50) DEFAULT NULL AFTER token_usage,
      ADD COLUMN export_format VARCHAR(10) DEFAULT NULL AFTER action,
      ADD COLUMN report_title VARCHAR(255) DEFAULT NULL AFTER export_format
    `);
    if (process.env.DEBUG_DB === 'true') console.log('✅ Export log columns added to ai_activity_logs');
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      // Columns already exist — migration is idempotent
    } else {
      console.error('⚠️ Export log migration error:', err.message);
    }
  }
};

module.exports = createExportLogColumns;
