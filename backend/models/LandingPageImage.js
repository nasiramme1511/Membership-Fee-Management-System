const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LandingPageImage = sequelize.define('LandingPageImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('hero', 'leadership', 'gallery', 'event'),
    defaultValue: 'gallery'
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'landing_page_images',
  timestamps: true,
  underscored: true
});

module.exports = LandingPageImage;
