const { sequelize } = require('../config/db');

module.exports = async () => {
  try {
    const [results] = await sequelize.query("SHOW COLUMNS FROM `users` LIKE 'isVerified'");
    if (results.length === 0) {
      console.log('Adding isVerified to users table...');
      await sequelize.query("ALTER TABLE `users` ADD COLUMN `isVerified` TINYINT(1) DEFAULT 1;");
    }

    const [results2] = await sequelize.query("SHOW COLUMNS FROM `users` LIKE 'otpCode'");
    if (results2.length === 0) {
      console.log('Adding otpCode to users table...');
      await sequelize.query("ALTER TABLE `users` ADD COLUMN `otpCode` VARCHAR(10) DEFAULT NULL;");
    }

    const [results3] = await sequelize.query("SHOW COLUMNS FROM `users` LIKE 'otpExpiresAt'");
    if (results3.length === 0) {
      console.log('Adding otpExpiresAt to users table...');
      await sequelize.query("ALTER TABLE `users` ADD COLUMN `otpExpiresAt` DATETIME DEFAULT NULL;");
    }
  } catch (error) {
    console.error('Migration error alter_user_otp:', error);
  }
};
