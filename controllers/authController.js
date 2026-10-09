const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Hashing pswrd for db
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ email, passwordHash, role });

    res.status(201).json({ message: 'Пользователь успешно зарегистрирован', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(403).json({ error: 'Аккаунт заблокирован. Попробуйте позже.' });
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Блокируем на 15 минут
      }
      await user.save();
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // if clear, reset failed attempts and lockUntil
    user.failedAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // generate access token (JWT)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ message: 'Успешный вход', token });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
};
// endpoint to get current user info
const getMe = async (req, res) => {
  try {
    // req.user.id taken from token 
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash', 'refreshToken'] } // hide sensitive info
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
module.exports = { register, login, getMe };