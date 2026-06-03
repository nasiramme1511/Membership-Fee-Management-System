const { sequelize } = require('../config/db');

module.exports = async () => {
  try {
    // MySQL doesn't allow direct ENUM alteration without dropping and recreating column.
    // The safest approach is to change the column definition using MODIFY.
    await sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('admin','sector_officer','expert','super_admin')
      DEFAULT 'sector_officer';
    `);
    console.log('✅ User.role enum updated to include super_admin');
  } catch (e) {
    console.error('⚠️ Failed to update User.role enum:', e.message);
  }
};
