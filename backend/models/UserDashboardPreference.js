const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserDashboardPreference = sequelize.define('UserDashboardPreference', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' }
  },
  widgetName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'widget_name'
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  visible: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  }
}, {
  tableName: 'user_dashboard_preferences',
  timestamps: false
});

module.exports = UserDashboardPreference;
