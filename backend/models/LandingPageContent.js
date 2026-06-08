const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LandingPageContent = sequelize.define('LandingPageContent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'landing_page_content',
  timestamps: true,
  underscored: true
});

module.exports = LandingPageContent;
