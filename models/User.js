// models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'moderator', 'admin'),
    defaultValue: 'user'
  },
  failedAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  // Автоматически исключает хеши и токены из любых выборок по умолчанию
  defaultScope: {
    attributes: { exclude: ['passwordHash', 'refreshToken', 'failedAttempts', 'lockUntil'] }
  },
  scopes: {
    // Спец-скоуп, когда хеш всё-таки нужен (только внутри authController при проверке логина)
    withPassword: {
      attributes: { include: ['passwordHash'] }
    }
  }
});

module.exports = User;