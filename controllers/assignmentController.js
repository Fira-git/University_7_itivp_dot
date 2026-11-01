const { Op } = require('sequelize');
const Assignment = require('../models/Assignment');
const User = require('../models/User');

// Безопасное декодирование имен файлов (Latin-1 / UTF-8)
const decodeFileName = (name) => {
  if (!name || typeof name !== 'string') return name;

  // Если в строке уже содержатся корректные символы Unicode (> 255), не трогаем её
  for (let i = 0; i < name.length; i++) {
    if (name.charCodeAt(i) > 255) return name;
  }

  // Если есть байты 0x80 - 0xFF (UTF-8, считанный busboy/multer как Latin-1)
  const hasLatin1Mojibake = [...name].some((c) => {
    const code = c.charCodeAt(0);
    return code >= 0x80 && code <= 0xff;
  });

  if (hasLatin1Mojibake) {
    try {
      return Buffer.from(name, 'latin1').toString('utf8');
    } catch {
      return name;
    }
  }

  return name;
};

// Хелпер для очистки массивов прикрепленных файлов
const normalizeFileList = (files) => {
  if (!files || !Array.isArray(files)) return [];
  return files.map((file) => ({
    name: decodeFileName(file.name),
    url: file.url
  }));
};

// Приведение полей задания к нормализованному виду
const formatAssignment = (assignmentInstance) => {
  const plain = assignmentInstance.toJSON ? assignmentInstance.toJSON() : assignmentInstance;
  return {
    ...plain,
    materials: normalizeFileList(plain.materials),
    submissions: normalizeFileList(plain.submissions)
  };
};

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

    // Студент видит только свои задания
    if (req.user.role === 'user') {
      whereClause.studentId = req.user.id;
    } else if (studentId) {
      whereClause.studentId = studentId;
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.title = { [Op.iLike || Op.like]: `%${search}%` };
    }

    const assignments = await Assignment.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    const formatted = assignments.map(formatAssignment);
    return res.status(200).json(formatted);
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

    if (req.user.role === 'user' && Number(assignment.studentId) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Нет доступа к чужому заданию' });
    }

    return res.status(200).json(formatAssignment(assignment));
  } catch (error) {
    console.error('Ошибка получения задания по ID:', error);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// 4. Создание заданий (массовая раздача и материалы от преподавателя)
exports.createAssignment = async (req, res) => {
  try {
    const { title, description } = req.body;
    let { studentIds, studentId } = req.body;

    let targetStudents = [];
    if (studentIds) {
      if (typeof studentIds === 'string') {
        try {
          targetStudents = JSON.parse(studentIds);
        } catch {
          targetStudents = studentIds.split(',').map((id) => id.trim());
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

    // Декодируем кириллические имена файлов при загрузке
    const materials = req.files
      ? req.files.map((file) => ({
          name: decodeFileName(file.originalname),
          url: `/uploads/${file.filename}`
        }))
      : [];

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
      createdAssignments.push(formatAssignment(assignment));
    }

    return res.status(201).json(
      createdAssignments.length === 1 ? createdAssignments[0] : createdAssignments
    );
  } catch (error) {
    console.error('Ошибка создания задания:', error);
    return res.status(500).json({ error: 'Ошибка сервера при создании задания' });
  }
};

// 5. Сдача задания студентом
exports.submitSolution = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    if (req.user.role === 'user' && Number(assignment.studentId) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Вы не можете отправлять решение за другого студента' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Прикрепите хотя бы один файл решения' });
    }

    const newSubmissions = req.files.map((file) => ({
      name: decodeFileName(file.originalname),
      url: `/uploads/${file.filename}`
    }));

    const currentSubmissions = Array.isArray(assignment.submissions) ? assignment.submissions : [];
    assignment.submissions = [...currentSubmissions, ...newSubmissions];
    
    // Переводим в статус «Отправлено на оценку» при отправке решения
    assignment.status = 'Отправлено на оценку';

    await assignment.save();
    return res.status(200).json(formatAssignment(assignment));
  } catch (error) {
    console.error('Ошибка отправки решения:', error);
    return res.status(500).json({ error: 'Ошибка сервера при отправке решения' });
  }
};

// 6. Оценивание и комментарий преподавателя
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback, status, title, description } = req.body;

    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    // Если преподаватель выставил балл — статус автоматически становится «Оценено»
    if (grade !== undefined && grade !== null && grade !== '') {
      const numGrade = Number(grade);
      assignment.grade = Math.min(100, Math.max(0, numGrade));
      assignment.status = 'Оценено';
    } else if (grade === null || grade === '') {
      assignment.grade = null;
    }

    if (feedback !== undefined) assignment.feedback = feedback;
    if (status !== undefined) assignment.status = status; // ручное переопределение при необходимости
    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;

    await assignment.save();
    return res.status(200).json(formatAssignment(assignment));
  } catch (error) {
    console.error('Ошибка обновления задания:', error);
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
    console.error('Ошибка удаления:', error);
    return res.status(500).json({ error: 'Ошибка сервера при удалении' });
  }
};