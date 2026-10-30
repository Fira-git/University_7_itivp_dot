const { Op } = require('sequelize');
const { Assignment, User } = require('../models');

// Создание задания (POST /api/assignments)
const createAssignment = async (req, res) => {
  try {
    const { title, description, studentId, grade } = req.body;
    
    // teacherId берется из токена (req.user.id)
    const assignment = await Assignment.create({
      title,
      description,
      studentId,
      grade: grade || null,
      teacherId: req.user.id
    });
    
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании задания' });
  }
};

// Получение списка с учетом роли + фильтрация/поиск (GET /api/assignments)
const getAssignments = async (req, res) => {
  try {
    let filter = {};
    
    // Ролевое разграничение
    if (req.user.role === 'user') {
      filter.studentId = req.user.id;
    } else if (req.user.role === 'moderator') {
      filter.teacherId = req.user.id;
    }

    // Дополнительный эндпоинт: фильтрация по статусу (?status=Выдано)
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Дополнительный эндпоинт: поиск по ключевым словам в названии (?search=Лаб)
    if (req.query.search) {
      filter.title = { [Op.iLike]: `%${req.query.search}%` };
    }

    const assignments = await Assignment.findAll({ 
      where: filter,
      order: [['id', 'ASC']]
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении заданий' });
  }
};

// Получение деталей задания по ID (GET /api/assignments/:id)
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByPk(id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'email', 'role'] },
        { model: User, as: 'teacher', attributes: ['id', 'email', 'role'] }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    // Студент может просматривать только свое задание
    if (req.user.role === 'user' && assignment.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому заданию' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении задания' });
  }
};

// Обновление задания (PUT /api/assignments/:id)
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    // Проверка прав: преподаватель, выдавший задание, или admin
    if (req.user.role !== 'admin' && assignment.teacherId !== req.user.id) {
      // Разрешаем студенту только менять статус на "Сдано"
      if (req.user.role === 'user' && assignment.studentId === req.user.id && req.body.status === 'Сдано') {
        await assignment.update({ status: 'Сдано' });
        return res.json(assignment);
      }
      return res.status(403).json({ error: 'Недостаточно прав для изменения задания' });
    }

    await assignment.update(req.body);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении задания' });
  }
};

// Удаление задания (DELETE /api/assignments/:id)
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

module.exports = { 
  createAssignment, 
  getAssignments, 
  getAssignmentById, 
  updateAssignment, 
  deleteAssignment 
};