const express = require('express');
const multer = require('multer');
const budgetController = require('../controllers/budgetController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'application/vnd.ms-excel', 
        'text/csv' 
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); 
    } else {
        cb(new Error('Неверный формат. Загрузите PDF, Excel или CSV.')); 
    }
};

const upload = multer({ 
    dest: 'uploads/',
    fileFilter: fileFilter 
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация в системе
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Пользователь успешно создан
 */
router.post('/auth/register', authLimiter, authController.register);


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный вход, возвращает токен
 */

router.post('/auth/login', authLimiter, authController.login);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Получить все транзакции пользователя
 *     tags: [Transactions]
 *     security:
 *     - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список транзакций
 *       401:
 *         description: Доступ запрещен (нет токена)
 */

router.get('/transactions', authMiddleware, budgetController.getTransactions);

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Загрузка выписки (PDF, Excel, CSV)
 *     tags: [AI Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               statement:
 *                 type: string
 *                 format: binary
 *                 description: Файл выписки
 *     responses:
 *       200:
 *         description: Выписка успешно проанализирована ИИ
 *       403:
 *         description: Лимит загрузок исчерпан
 */

router.post('/upload', authMiddleware, upload.single('statement'), budgetController.uploadStatement);

/**
 * @swagger
 * /api/ask:
 *   post:
 *     summary: Задать вопрос ИИ по своей статистике
 *     tags: [AI Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 example: "На чем я могу сэкономить в этом месяце?"
 *     responses:
 *       200:
 *         description: Ответ от нейросети
 *       403:
 *         description: Лимит вопросов исчерпан
 */

router.post('/ask', authMiddleware, budgetController.askQuestion);

/**
 * @swagger
 * /api/history:
 *   get:
 *     summary: Получить историю диалогов с ИИ
 *     tags: [AI Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список вопросов и ответов
 */
router.get('/history', authMiddleware, budgetController.getHistory);

module.exports = router;
