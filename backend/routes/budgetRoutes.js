const express = require('express');
const multer = require('multer');
const budgetController = require('../controllers/budgetController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

router.get('/transactions', authMiddleware, budgetController.getTransactions);
router.post('/upload', authMiddleware, upload.single('statement'), budgetController.uploadStatement);
router.post('/users/:id/analyze', authMiddleware, budgetController.analyzeBudget);
router.get('/users/:id/advices', authMiddleware, budgetController.getAdvices);

module.exports = router;