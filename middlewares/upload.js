const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаём папку uploads в корне проекта, если её ещё нет
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Сохраняем имя с таймстемпом, чтобы файлы не перезаписывали друг друга
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    // Очищаем имя от спецсимволов для безопасности
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 30 * 1024 * 1024 } // ограничение 30 МБ на файл
});

module.exports = upload;