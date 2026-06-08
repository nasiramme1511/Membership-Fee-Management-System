const { sequelize } = require('../config/db');

module.exports = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS landing_page_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        image VARCHAR(500) NOT NULL,
        category ENUM('hero','leadership','gallery','event') DEFAULT 'gallery',
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        uploaded_by INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS landing_page_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(100) NOT NULL UNIQUE,
        value TEXT DEFAULT NULL,
        updated_by INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Landing page tables migration completed');
  } catch (e) {
    console.error('⚠️ Landing page tables migration error:', e.message);
  }
};
