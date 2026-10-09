const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('user', 'moderator', 'admin'), 
    defaultValue: 'user' 
  },
  // brute-force protection fields
  failedAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  lockUntil: { type: DataTypes.DATE, allowNull: true },
  // refresh token for JWT
  refreshToken: { type: DataTypes.STRING, allowNull: true }
});

module.exports = User;