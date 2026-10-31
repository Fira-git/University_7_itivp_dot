require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Sentry = require('@sentry/node');
const logger = require('./utils/logger');

const { connectDB, sequelize } = require('./config/db');
require('./models'); 

const authRoutes = require('./routes/authRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Инициализация Sentry (при наличии DSN ключа)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development'
  });
}

// 2. CORS для взаимодействия с React/Vite
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// 3. Безопасность: helmet с разрешением отдачи статических файлов на фронтенд
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 4. Ограничение частоты запросов (защита от брутфорса и DoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Слишком много запросов, попробуйте позже' }
});
app.use(limiter);

// 5. Парсинг входящих данных
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Раздача загруженных методичек и решений студента
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 7. Подсчет запросов для эндпоинта метрик
let totalRequestsCount = 0;
app.use((req, res, next) => {
  totalRequestsCount++;
  next();
});

// --- DevOps эндпоинты ---

// Проверка доступности для UptimeRobot
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    });
  } catch (err) {
    res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      error: err.message
    });
  }
});

// Сбор базовых метрик процесса
app.get('/metrics', (req, res) => {
  const memory = process.memoryUsage();
  res.status(200).json({
    uptime: `${Math.floor(process.uptime())}s`,
    totalRequests: totalRequestsCount,
    nodeVersion: process.version,
    memory: {
      rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`
    }
  });
});

// Контрольный вызов сбоя для дашборда Sentry
app.get('/test-error', (req, res) => {
  const err = new Error('Тестовая ошибка для фиксации в Sentry');
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  throw err;
});

// --- Основные маршруты приложения ---
app.use('/auth', authRoutes);
app.use('/assignments', assignmentRoutes);

// Централизованная обработка ошибок с логированием и отправкой в Sentry
app.use((err, req, res, next) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  
  if (logger && logger.error) {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  }
  console.error('Ошибка сервера:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера. Обратитесь к администратору.'
  });
});

// Запуск сервера и синхронизация структуры таблиц
const startServer = async () => {
  try {
    await connectDB();
    await sequelize.sync({ alter: true }); 
    console.log('Таблицы успешно синхронизированы с базой данных.');
    
    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Не удалось запустить сервер:', error);
  }
};

startServer();