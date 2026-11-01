require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/db');
const User = require('./models/User');
const Assignment = require('./models/Assignment');

const SEED_PASSWORD = 'Password123!';

async function seedDatabase() {
  try {
    console.log('Подключение к Neon PostgreSQL...');
    await sequelize.authenticate();
    console.log('Связь установлена. Синхронизация таблиц...');
    await sequelize.sync();

    console.log('Очистка старых данных...');
    await Assignment.destroy({ where: {}, truncate: { cascade: true } });
    await User.destroy({ where: {}, truncate: { cascade: true } });

    console.log('Создание пользователей...');
    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);

    // 1. Преподаватели (moderator) — используем точное имя passwordHash
    const teachers = await User.bulkCreate([
      { email: 'ivanov.prof@campus.edu', passwordHash: hashedPassword, role: 'moderator' },
      { email: 'petrova.docent@campus.edu', passwordHash: hashedPassword, role: 'moderator' },
      { email: 'smirnov.lector@campus.edu', passwordHash: hashedPassword, role: 'moderator' }
    ]);

    // 2. Студенты (user)
    const studentsData = [];
    for (let i = 1; i <= 20; i++) {
      studentsData.push({
        email: `student_${i}@campus.edu`,
        passwordHash: hashedPassword,
        role: 'user'
      });
    }
    const students = await User.bulkCreate(studentsData);

    console.log(`Создано преподавателей: ${teachers.length}, студентов: ${students.length}`);

    const assignmentTemplates = [
      {
        title: 'Лабораторная работа №1: Проектирование реляционной схемы БД',
        description: 'Разработать концептуальную и логическую модель базы данных для ИС в нотации IDEF1X. Нормализовать до 3НФ.'
      },
      {
        title: 'Лабораторная работа №2: Индексы и оптимизация сложных SQL-запросов',
        description: 'Исследовать планы выполнения запросов (EXPLAIN ANALYZE) в PostgreSQL. Построить B-Tree и Hash индексы.'
      },
      {
        title: 'Курсовой проект: Разработка REST API на Express и Sequelize',
        description: 'Реализовать CRUD-операции, JWT-аутентификацию, ролевую модель доступа и централизованную обработку ошибок.'
      },
      {
        title: 'Практическая работа: Настройка CI/CD пайплайна в GitHub Actions',
        description: 'Автоматизировать линтинг, сборку клиентской части и уведомления в Telegram-канал при push в main.'
      },
      {
        title: 'Лабораторная работа №3: Интеграция дашборда Power BI с PostgreSQL',
        description: 'Построить визуализацию успеваемости академических групп, воронку сдачи заданий и расчет метрик DAX.'
      }
    ];

    const feedbacks = [
      'Отличная работа, код чистый, архитектура выдержана.',
      'Хорошее решение, но обратите внимание на валидацию входных данных.',
      'Тесты пройдены, однако не все крайние случаи обработаны.',
      'Прекрасно оформлен отчет, замечаний нет.',
      'Есть вопросы к производительности индексов. На защите поясните выбор.'
    ];

    console.log('Генерация заданий...');
    const assignmentsToInsert = [];
    const now = new Date();

    students.forEach((student) => {
      const assignedCount = Math.floor(Math.random() * 2) + 4; // 4-5 заданий каждому

      for (let j = 0; j < assignedCount; j++) {
        const template = assignmentTemplates[j % assignmentTemplates.length];
        const teacher = teachers[j % teachers.length];

        const daysAgo = Math.floor(Math.random() * 45);
        const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const rand = Math.random();
        let status = 'Выдано';
        let grade = null;
        let feedback = '';
        let submissions = [];

        if (rand > 0.5) {
          status = 'Оценено';
          grade = Math.random() > 0.15 ? Math.floor(Math.random() * 31) + 70 : Math.floor(Math.random() * 20) + 40;
          feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
          submissions = [
            { name: `solution_lab_${j + 1}_v1.pdf`, url: '/uploads/sample_report.pdf' }
          ];
        } else if (rand > 0.2) {
          status = 'Отправлено на оценку';
          submissions = [
            { name: `draft_solution_${j + 1}.zip`, url: '/uploads/sample_archive.zip' }
          ];
        }

        assignmentsToInsert.push({
          title: template.title,
          description: template.description,
          studentId: student.id,
          teacherId: teacher.id,
          status,
          grade,
          feedback,
          materials: [
            { name: 'metodichka_guidelines.pdf', url: '/uploads/metodichka.pdf' }
          ],
          submissions,
          createdAt,
          updatedAt: new Date(createdAt.getTime() + 1000 * 60 * 60 * 24)
        });
      }
    });

    await Assignment.bulkCreate(assignmentsToInsert);

    console.log(`\nУспешно создано заданий: ${assignmentsToInsert.length}`);
    console.log('--- ДАННЫЕ ДЛЯ ТЕСТОВОГО ВХОДА ---');
    console.log('Пароль для всех аккаунтов:', SEED_PASSWORD);
    console.log('Преподаватель:', teachers[0].email);
    console.log('Студент:', students[0].email);
    console.log('----------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Ошибка сидирования данных:', error);
    process.exit(1);
  }
}

seedDatabase();