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

const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next(); // skip if validation passed
};

module.exports = { validateRegister };