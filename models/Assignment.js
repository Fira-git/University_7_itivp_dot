const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Выдано', 'Отправлено на оценку', 'Оценено'),
    defaultValue: 'Выдано'
  },
 grade: {
  type: DataTypes.INTEGER,
  allowNull: true,
  validate: {
    min: 0,
    max: 100
  }
},
  // Файлы материалов от преподавателя (условия, методички)
  materials: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Файлы решений от студента
  submissions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Рецензия / комментарий преподавателя к работе
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'Assignments',
  timestamps: true
});

module.exports = Assignment;