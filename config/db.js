const { Sequelize } = require('sequelize');
require('dotenv').config();

// creating a new Sequelize instance with the database URL from environment variables
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // canseling logging for cleaner output, cuz some trash info
  dialectOptions: {
    // setting for neon
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Подключение к базе данных успешно установлено.');
  } catch (error) {
    console.error('Ошибка подключения к базе данных:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };