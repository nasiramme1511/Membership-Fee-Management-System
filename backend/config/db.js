// config/db.js - Production-grade MySQL / Sequelize Configuration
const { Sequelize } = require('sequelize');

const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

// Base options for both connection methods
const baseOptions = {
  dialect: 'mysql',
  logging: isProduction ? false : console.log, // Only log in dev
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true
  },
  dialectOptions: process.env.DB_SSL === 'true' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false // Required for Aiven/DigitalOcean unless CA cert is provided
    }
  } : {}
};

const sequelize = dbUrl 
  ? new Sequelize(dbUrl, baseOptions)
  : new Sequelize(
      process.env.DB_NAME || 'mcms',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        ...baseOptions
      }
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected Successfully to:', sequelize.config.host);

    // Import models in specific order to register them before sync
    require('../models/User');
    const SectorType = require('../models/SectorType');
    const SectorUnit = require('../models/SectorUnit');
    const MemberCategory = require('../models/MemberCategory');
    const SectorUnitCategory = require('../models/SectorUnitCategory');
    require('../models/Member');
    require('../models/Contribution');
    require('../models/Payment');
    require('../models/Receipt');
    require('../models/Setting');

    // Define Sector Associations
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
      as: 'units'
    });

    // Production-safe Sync Strategy
    // Only sync if DB_SYNC is 'true' or in development
    const shouldSync = process.env.DB_SYNC === 'true' || !isProduction;
    
    if (shouldSync) {
      console.log('🔄 Synchronizing database tables...');
      await sequelize.sync({ alter: !isProduction }); // Use alter in dev, simple sync in prod
      console.log('✅ Database tables synchronized');
    } else {
      console.log('ℹ️ Database sync skipped (Production mode)');
    }

  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
    if (isProduction) {
      console.error('Check your DB_HOST, DB_PORT, and DB_SSL environment variables.');
    }
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
