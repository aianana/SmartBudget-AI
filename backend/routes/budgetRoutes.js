const express = require('express');
const multer = require('multer');
const budgetController = require('../controllers/budgetController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

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

router.post('/auth/register', authController.register);

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

router.post('/auth/login', authController.login);

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

router.post('/upload', authMiddleware, upload.single('statement'), budgetController.uploadStatement);
router.post('/ask', authMiddleware, budgetController.askQuestion);
router.get('/history', authMiddleware, budgetController.getHistory);

module.exports = router;