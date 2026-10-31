const { Op } = require('sequelize');
const Assignment = require('../models/Assignment');
const User = require('../models/User'); // модель пользователей проекта

// 1. Получение списка студентов для формы выдачи заданий
exports.getStudents = async (req, res) => {
  try {
    const students = await User.findAll({
      where: { role: 'user' },
      attributes: ['id', 'email']
    });
    return res.status(200).json(students);
  } catch (error) {
    console.error('Ошибка получения списка студентов:', error);
    return res.status(500).json({ error: 'Ошибка сервера при получении студентов' });
  }
};

// 2. Получение списка заданий (с фильтрацией и разграничением прав)
exports.getAssignments = async (req, res) => {
  try {
    const { status, search, studentId } = req.query;
    const whereClause = {};

    // Если запрос делает обычный студент — он видит ТОЛЬКО свои задания
    if (req.user.role === 'user') {
      whereClause.studentId = req.user.id;
    } else if (studentId) {
      // Преподаватель/админ может отфильтровать по конкретному студенту
      whereClause.studentId = studentId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.title = { [Op.iLike || Op.like]: `%${search}%` };
    }

    const assignments = await Assignment.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(assignments);
  } catch (error) {
    console.error('Ошибка получения заданий:', error);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// 3. Получение одного задания по ID
exports.getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    // Студент не может смотреть чужие задания
    if (req.user.role === 'user' && assignment.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к чужому заданию' });
    }

    return res.status(200).json(assignment);
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// 4. Создание заданий (включая массовую раздачу и материалы от преподавателя)
exports.createAssignment = async (req, res) => {
  try {
    const { title, description } = req.body;
    let { studentIds, studentId } = req.body;

    // Поддержка как массива studentIds, так и одиночного studentId
    let targetStudents = [];
    if (studentIds) {
      if (typeof studentIds === 'string') {
        try {
          targetStudents = JSON.parse(studentIds);
        } catch {
          targetStudents = studentIds.split(',').map(id => id.trim());
        }
      } else if (Array.isArray(studentIds)) {
        targetStudents = studentIds;
      }
    } else if (studentId) {
      targetStudents = [studentId];
    }

    if (!targetStudents || targetStudents.length === 0) {
      return res.status(400).json({ error: 'Укажите хотя бы одного студента (studentIds)' });
    }

    // Обработка загруженных преподавателем файлов материалов
    const materials = (req.files || []).map(file => ({
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size,
      uploadedAt: new Date()
    }));

    // Создаем копию задания для каждого выбранного студента
    const createdAssignments = [];
    for (const sId of targetStudents) {
      const assignment = await Assignment.create({
        title,
        description,
        status: 'Выдано',
        materials,
        submissions: [],
        feedback: null,
        grade: null,
        studentId: Number(sId),
        teacherId: req.user.id
      });
      createdAssignments.push(assignment);
    }

    return res.status(201).json(
      createdAssignments.length === 1 ? createdAssignments[0] : createdAssignments
    );
  } catch (error) {
    console.error('Ошибка создания задания:', error);
    return res.status(500).json({ error: 'Ошибка сервера при создании задания' });
  }
};

// 5. Сдача задания студентом (прикрепление решений)
exports.submitSolution = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    // Проверяем, что сдает именно тот студент, которому назначено
    if (req.user.role === 'user' && assignment.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Вы не можете отправлять решение за другого студента' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Прикрепите хотя бы один файл решения' });
    }

    const newSubmissions = req.files.map(file => ({
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size,
      uploadedAt: new Date()
    }));

    // Сохраняем историю: объединяем старые файлы с новыми
    const currentSubmissions = Array.isArray(assignment.submissions) ? assignment.submissions : [];
    assignment.submissions = [...currentSubmissions, ...newSubmissions];
    assignment.status = 'Сдано';

    await assignment.save();
    return res.status(200).json(assignment);
  } catch (error) {
    console.error('Ошибка отправки решения:', error);
    return res.status(500).json({ error: 'Ошибка сервера при отправке решения' });
  }
};

// 6. Оценивание и комментарий преподавателя (или обновление)
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback, status, title, description } = req.body;

    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    if (grade !== undefined) assignment.grade = grade;
    if (feedback !== undefined) assignment.feedback = feedback;
    if (status !== undefined) assignment.status = status;
    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;

    await assignment.save();
    return res.status(200).json(assignment);
  } catch (error) {
    console.error('Ошибка обновления:', error);
    return res.status(500).json({ error: 'Ошибка сервера при обновлении' });
  }
};

// 7. Удаление задания (администратор)
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    await assignment.destroy();
    return res.status(200).json({ message: 'Задание успешно удалено' });
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка сервера при удалении' });
  }
};