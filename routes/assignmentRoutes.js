const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { verifyToken, roleGuard } = require('../middlewares/authMiddleware'); // заменили authMiddleware на verifyToken
const upload = require('../middlewares/upload');

// Все маршруты требуют токена авторизации
router.use(verifyToken); // используем verifyToken

// Список студентов (для преподавателя, чтобы выбрать кому выдать)
router.get('/students', roleGuard(['moderator', 'admin']), assignmentController.getStudents);

// Получить список заданий (с фильтрацией)
router.get('/', assignmentController.getAssignments);

// Получить одно задание по ID
router.get('/:id', assignmentController.getAssignmentById);

// Создание задания (преподаватель/админ) с возможностью загрузки файлов условий
router.post(
  '/',
  roleGuard(['moderator', 'admin']),
  upload.array('materials', 10),
  assignmentController.createAssignment
);

// Сдача задания студентом с прикреплением файлов решений
router.post(
  '/:id/submit',
  upload.array('submissions', 10),
  assignmentController.submitSolution
);

// Оценивание, добавление комментария или редактирование (преподаватель/админ)
router.put('/:id', roleGuard(['moderator', 'admin']), assignmentController.updateAssignment);

// Удаление задания (только администратор)
router.delete('/:id', roleGuard(['admin']), assignmentController.deleteAssignment);

module.exports = router;