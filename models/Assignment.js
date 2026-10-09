const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Assignment = sequelize.define('Assignment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: { 
    type: DataTypes.ENUM('Выдано', 'Сдано'), 
    defaultValue: 'Выдано' 
  },
  grade: { type: DataTypes.INTEGER, allowNull: true },
  // identifiers for relationships
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  teacherId: { type: DataTypes.INTEGER, allowNull: false }
});

module.exports = Assignment;