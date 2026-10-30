const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
} = require('../controllers/assignmentController');

const { verifyToken, roleGuard } = require('../middlewares/authMiddleware');
const {
  validateAssignmentCreate,
  validateAssignmentUpdate
} = require('../middlewares/validate');

// Получение списка (все авторизованные)
router.get('/', verifyToken, getAssignments);

// Получение деталей по ID (все авторизованные)
router.get('/:id', verifyToken, getAssignmentById);

// Создание: только преподаватели (moderator) и администраторы (admin)
router.post(
  '/',
  verifyToken,
  roleGuard(['moderator', 'admin']),
  validateAssignmentCreate,
  createAssignment
);

// Обновление: автор-преподаватель, администратор или студент (сдача)
router.put(
  '/:id',
  verifyToken,
  validateAssignmentUpdate,
  updateAssignment
);

// Удаление: только администратор (admin)
router.delete(
  '/:id',
  verifyToken,
  roleGuard(['admin']),
  deleteAssignment
);

module.exports = router;