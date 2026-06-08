const { Sequelize } = require('sequelize');

const isProduction = process.env.NODE_ENV === 'production';
const DEBUG_DB = process.env.DEBUG_DB === 'true';

const sslConfig = process.env.DB_SSL === 'true'
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  : {};

const dialectOptions = {
  ...sslConfig,
  connectTimeout: 60000
};

const sharedOptions = {
  dialect: 'mysql',
  logging: DEBUG_DB ? (msg) => console.log(`[SQL] ${msg}`) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 60000,
    idle: 10000
  },
  retry: {
    max: 5
  },
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true
  },
  dialectOptions
};

const sequelize = new Sequelize(
  process.env.DB_NAME     || 'defaultdb',
  process.env.DB_USER     || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    ...sharedOptions
  }
);

let associationsDefined = false;

const connectDB = async (retries = 5) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (isProduction) {
        const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];
        const missing = required.filter(k => !process.env[k]);
        if (missing.length > 0) {
          throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
      }

      await sequelize.authenticate();
      console.log('Database connected successfully');
      if (DEBUG_DB) console.log(`MySQL connected to: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);

      if (!associationsDefined) {
        associationsDefined = true;
        require('../models/User');
        const SectorType         = require('../models/SectorType');
        const SectorUnit         = require('../models/SectorUnit');
        const MemberCategory     = require('../models/MemberCategory');
        const SectorUnitCategory = require('../models/SectorUnitCategory');
        require('../models/Member');
        require('../models/Contribution');
        require('../models/Payment');
        require('../models/Receipt');
        require('../models/Setting');
        const SectorPayment      = require('../models/SectorPayment');
        const SectorPaymentAuditLog = require('../models/SectorPaymentAuditLog');
        const User               = require('../models/User');

        // New AI Copilot Models
        const Conversation       = require('../models/Conversation');
        const Message            = require('../models/Message');
        const ConversationMetadata = require('../models/ConversationMetadata');
        const Notification       = require('../models/Notification');
        const AIActivityLog      = require('../models/AIActivityLog');
        const UserDashboardPreference = require('../models/UserDashboardPreference');

        SectorType.hasMany(SectorUnit, { foreignKey: 'sectorTypeId', as: 'units' });
        SectorUnit.belongsTo(SectorType, { foreignKey: 'sectorTypeId', as: 'sectorType' });

        SectorUnit.belongsToMany(MemberCategory, {
          through: SectorUnitCategory,
          foreignKey: 'sectorUnitId',
          otherKey: 'memberCategoryId',
          as: 'categories'
        });
        MemberCategory.belongsToMany(SectorUnit, {
          through: SectorUnitCategory,
          foreignKey: 'memberCategoryId',
          otherKey: 'sectorUnitId',
          as: 'sectorUnits'
        });

        // AI Copilot Associations
        User.hasMany(Conversation, { foreignKey: 'userId', as: 'conversations' });
        Conversation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

        Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages', onDelete: 'CASCADE' });
        Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

        Conversation.hasOne(ConversationMetadata, { foreignKey: 'conversationId', as: 'metadata', onDelete: 'CASCADE' });
        ConversationMetadata.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

        User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
        Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

        User.hasMany(AIActivityLog, { foreignKey: 'userId', as: 'aiActivityLogs', onDelete: 'CASCADE' });
        AIActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

        User.hasMany(UserDashboardPreference, { foreignKey: 'userId', as: 'dashboardPreferences', onDelete: 'CASCADE' });
        UserDashboardPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });
      }

      await sequelize.sync({ alter: false });
      if (DEBUG_DB) console.log('DB tables synced');

      return;

    } catch (error) {
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        if (DEBUG_DB) console.log(`DB connection attempt ${attempt}/${retries} failed: ${error.message}. Retrying in ${delay/1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error('');
        console.error('╔═══════════════════════════════════════════════════════════════╗');
        console.error('║         ❌ DATABASE CONNECTION FAILED                       ║');
        console.error('╠═══════════════════════════════════════════════════════════════╣');
        console.error(`║  Error: ${(error.message || '').padEnd(56)}║`);
        console.error('║                                                               ║');
        console.error('║  Check these environment variables in your hosting panel:     ║');
        console.error('║  • DB_HOST     : ' + (process.env.DB_HOST || '(not set)').padEnd(51) + '║');
        console.error('║  • DB_PORT     : ' + (process.env.DB_PORT || '(not set)').padEnd(51) + '║');
        console.error('║  • DB_USER     : ' + (process.env.DB_USER || '(not set)').padEnd(51) + '║');
        console.error('║  • DB_PASSWORD : ' + (process.env.DB_PASSWORD ? '(set)' : '(not set)').padEnd(51) + '║');
        console.error('║  • DB_NAME     : ' + (process.env.DB_NAME || '(not set)').padEnd(51) + '║');
        console.error('║  • DB_SSL      : ' + (process.env.DB_SSL || '(not set)').padEnd(51) + '║');
        console.error('║                                                               ║');
        console.error('║  For TiDB Cloud: DB_PORT=4000, DB_SSL=true                   ║');
        console.error('╚═══════════════════════════════════════════════════════════════╝');
        console.error('');
      }
    }
  }
};

module.exports = { sequelize, connectDB };
