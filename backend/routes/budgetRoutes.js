const express = require('express');
const multer = require('multer');
const budgetController = require('../controllers/budgetController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/users', budgetController.createUser);
router.get('/users', budgetController.getUsers);
router.get('/transactions', budgetController.getTransactions);
router.post('/users/:id/analyze', budgetController.analyzeBudget);
router.get('/users/:id/advices', budgetController.getAdvices);

router.post('/upload', upload.single('statement'), budgetController.uploadStatement);

module.exports = router;