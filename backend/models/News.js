const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const News = sequelize.define('News', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  imageData: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'image_data'
  },
  imageMimeType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'image_mime_type'
  },
  category: {
    type: DataTypes.STRING(100),
    defaultValue: 'news'
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en'
  },
  isActive: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'news',
  timestamps: true,
  underscored: true
});

module.exports = News;
