// models/User.js - User Authentication Model (Sequelize / MySQL)
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    set(val) { this.setDataValue('email', val ? val.toLowerCase().trim() : val); }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'sector_officer', 'expert', 'super_admin'),
    defaultValue: 'sector_officer'
  },
  sectorUnitId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'sector_units', key: 'id' }
  },
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  otpCode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  otpExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  profilePic: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Hash password before create
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Hash password before update if changed
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Instance method: compare password
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const SectorUnit = require('./SectorUnit');
User.belongsTo(SectorUnit, { foreignKey: 'sectorUnitId', as: 'assignedSectorUnit' });

module.exports = User;
