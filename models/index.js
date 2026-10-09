const User = require('./User');
const Assignment = require('./Assignment');

//student has many assignments
User.hasMany(Assignment, { foreignKey: 'studentId', as: 'tasks' });
Assignment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// teacher has many assignments
User.hasMany(Assignment, { foreignKey: 'teacherId', as: 'givenTasks' });
Assignment.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

module.exports = { User, Assignment };