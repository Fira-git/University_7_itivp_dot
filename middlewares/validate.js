const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Введите корректный email',
    'any.required': 'Email обязателен'
  }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('(?=.*[0-9])(?=.*[!@#$%^&*])'))
    .required()
    .messages({
      'string.pattern.base': 'Пароль должен содержать минимум 1 цифру и 1 спецсимвол (!@#$%^&*)',
      'string.min': 'Пароль должен быть не короче 8 символов',
      'any.required': 'Пароль обязателен'
    }),
  role: Joi.string().valid('user', 'moderator', 'admin').optional()
});

// Валидация создания задания
const assignmentCreateSchema = Joi.object({
  title: Joi.string().min(3).max(150).required().messages({
    'string.min': 'Название задания должно быть не короче 3 символов',
    'any.required': 'Название задания обязательно'
  }),
  description: Joi.string().min(5).required().messages({
    'string.min': 'Описание должно быть не короче 5 символов',
    'any.required': 'Описание обязательно'
  }),
  studentId: Joi.number().integer().required().messages({
    'any.required': 'Идентификатор студента обязателен'
  }),
  status: Joi.string().valid('Выдано', 'Сдано').optional(),
  grade: Joi.number().integer().min(0).max(100).optional()
});

// Валидация обновления задания
const assignmentUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(150).optional(),
  description: Joi.string().min(5).optional(),
  status: Joi.string().valid('Выдано', 'Сдано').optional(),
  grade: Joi.number().integer().min(0).max(100).optional()
});

const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateAssignmentCreate = (req, res, next) => {
  const { error } = assignmentCreateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateAssignmentUpdate = (req, res, next) => {
  const { error } = assignmentUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = { 
  validateRegister, 
  validateAssignmentCreate, 
  validateAssignmentUpdate 
};