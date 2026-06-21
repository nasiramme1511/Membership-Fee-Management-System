const { sequelize } = require('../config/db');

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] }
  );
  return rows[0].cnt > 0;
}

module.exports = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT DEFAULT NULL,
        image VARCHAR(500) DEFAULT NULL,
        category VARCHAR(100) DEFAULT 'news',
        is_active TINYINT(1) DEFAULT 1,
        language VARCHAR(10) DEFAULT 'en',
        created_by INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const newColumns = [
      { name: 'image_data', type: 'LONGTEXT DEFAULT NULL' },
      { name: 'image_mime_type', type: 'VARCHAR(50) DEFAULT NULL' },
    ];

    for (const col of newColumns) {
      const exists = await columnExists('news', col.name);
      if (!exists) {
        await sequelize.query(`ALTER TABLE news ADD COLUMN \`${col.name}\` ${col.type}`);
        console.log(`  → Added column: ${col.name}`);
      }
    }

    console.log('✅ News table migration completed');
  } catch (e) {
    console.error('⚠️ News table migration error:', e.message);
  }
};
