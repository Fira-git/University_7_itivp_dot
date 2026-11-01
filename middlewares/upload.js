const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Безопасное уникальное имя файла на диске
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Белый список допустимых расширений
const allowedExtensions = /pdf|docx|doc|zip|txt/;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Недопустимый формат файла .${ext}. Разрешены только: PDF, DOC, DOCX, ZIP, TXT`), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 } // ограничение 30 МБ на файл
});

module.exports = upload;