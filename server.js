require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger'); // Наш файл логгера

const { connectDB, sequelize } = require('./config/db');
require('./models'); 

const authRoutes = require('./routes/authRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');

const app = express();




// security measures block
// helmet middleware for setting various HTTP headers for security
app.use(helmet());

// rate limiting middleware to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // max 100 queries per IP
  message: { error: 'Слишком много запросов, попробуйте позже' }
});
app.use(limiter);

// size limit for incoming JSON payloads to prevent DoS attacks
app.use(express.json({ limit: '10kb' }));





// routes
app.use('/auth', authRoutes);
app.use('/assignments', assignmentRoutes);

// global error handling middleware
app.use((err, req, res, next) => {
  // write error details to log file and console
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  // get error message from err object, or use a generic message
  res.status(err.status || 500).json({
    error: 'Внутренняя ошибка сервера. Обратитесь к администратору.'
  });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    await sequelize.sync({ alter: true }); 
    console.log('Таблицы успешно синхронизированы с базой данных.');
    
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  } catch (error) {
    console.error('Не удалось запустить сервер:', error);
  }
};

startServer();