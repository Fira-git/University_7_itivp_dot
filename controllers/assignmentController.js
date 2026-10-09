const { Assignment, User } = require('../models');

// task creating
const createAssignment = async (req, res) => {
  try {
    const { title, description, studentId } = req.body;
    
    // teacherId taking from token (req.user.id)
    const assignment = await Assignment.create({
      title,
      description,
      studentId,
      teacherId: req.user.id
    });
    
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании задания' });
  }
};

// get assignments based on role
const getAssignments = async (req, res) => {
  try {
    let filter = {};
    
    // if student -> only his tasks
    if (req.user.role === 'user') {
      filter.studentId = req.user.id;
    } 
    // if moderator -> only tasks given by him
    else if (req.user.role === 'moderator') {
      filter.teacherId = req.user.id;
    }
    // if admin -> all tasks, no filter needed

    const assignments = await Assignment.findAll({ where: filter });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении заданий' });
  }
};

// delete assignment
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Assignment.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }
    
    res.json({ message: 'Задание успешно удалено' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении задания' });
  }
};

module.exports = { createAssignment, getAssignments, deleteAssignment };