const { sequelize } = require('../config/db');
const DEBUG_DB = process.env.DEBUG_DB === 'true';

const createChatTables = async () => {
  try {
    // 1. conversations table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        pinned TINYINT(1) DEFAULT 0,
        favorite TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (user_id),
        INDEX idx_pinned (pinned)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    if (DEBUG_DB) console.log('✅ conversations table ready');

    // 2. messages table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        role ENUM('user', 'assistant', 'system') NOT NULL,
        content TEXT NOT NULL,
        metadata JSON NULL,
        reaction VARCHAR(50) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        INDEX idx_conversationId (conversation_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    if (DEBUG_DB) console.log('✅ messages table ready');

    // 3. conversation_metadata table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS conversation_metadata (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        summary TEXT NULL,
        last_agent VARCHAR(100) NULL,
        last_topic VARCHAR(100) NULL,
        total_messages INT DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        INDEX idx_convMetadata (conversation_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    if (DEBUG_DB) console.log('✅ conversation_metadata table ready');

    // 4. notifications table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        \`read\` TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userNotifications (user_id, \`read\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    if (DEBUG_DB) console.log('✅ notifications table ready');

    // 5. ai_activity_logs table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        conversation_id INT NULL,
        agent VARCHAR(100) NOT NULL,
        query TEXT NOT NULL,
        response_time INT DEFAULT 0,
        token_usage INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
        INDEX idx_userLogs (user_id),
        INDEX idx_agent (agent)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    if (DEBUG_DB) console.log('✅ ai_activity_logs table ready');

    // 6. user_dashboard_preferences table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        widget_name VARCHAR(100) NOT NULL,
        position INT NOT NULL,
        visible TINYINT(1) DEFAULT 1,
        UNIQUE KEY uq_user_widget (user_id, widget_name),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    if (DEBUG_DB) console.log('✅ user_dashboard_preferences table ready');

  } catch (err) {
    console.error('⚠️ createChatTables migration error:', err.message);
  }
};

module.exports = createChatTables;
