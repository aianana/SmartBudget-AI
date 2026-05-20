const prisma = require('../db');
const fs = require('fs');
const csv = require('csv-parser');

const createUser = async (req, res) => {
    try {
        const { email, name } = req.body; 
        const newUser = await prisma.user.create({ data: { email, name } });
        res.json(newUser);
    } catch (error) {
        res.status(400).json({ error: "Ошибка при создании пользователя." });
    }
};

const getUsers = async (req, res) => {
    try {
        const allUsers = await prisma.user.findMany();
        res.json(allUsers);
    } catch (error) {
        res.status(500).json({ error: "Ошибка базы данных" });
    }
};


const uploadStatement = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Пожалуйста, загрузите CSV файл" });
    }

    const results = [];

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            fs.unlinkSync(req.file.path);
            
            try {
                const transactionsData = results.map(row => ({
                    amount: parseFloat(row.amount),
                    date: new Date(row.date),
                    category: row.category,
                    description: row.description,
                    userId: 1
                }));

                const savedTransactions = await prisma.transaction.createMany({
                    data: transactionsData
                });

                res.json({
                    message: "Выписка успешно загружена и сохранена в базу!",
                    savedCount: savedTransactions.count
                });
            } catch (error) {
                console.error("Ошибка сохранения:", error);
                res.status(500).json({ error: "Ошибка при сохранении транзакций" });
            }
        });
};

const getTransactions = async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: { date: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: "Не удалось загрузить данные" });
    }
};

const analyzeBudget = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const transactions = await prisma.transaction.findMany({ where: { userId } });

        if (transactions.length === 0) {
            return res.json({ message: "У вас пока нет транзакций для анализа." });
        }

        const totalSpend = transactions.reduce((sum, t) => sum + t.amount, 0);
        const maxTransaction = transactions.reduce((max, t) => t.amount > max.amount ? t : max, transactions[0]);

        const aiMessage = `Анализ бюджета готов. Всего вы потратили: ${totalSpend.toFixed(2)} сом. \n Обратите внимание на категорию "${maxTransaction.category}", где самая крупная трата составила ${maxTransaction.amount} сом (${maxTransaction.description}). \n Совет: Попробуйте сократить расходы на эту категорию на 10% в следующем месяце.`;

        const savedAdvice = await prisma.advice.create({
            data: { message: aiMessage, userId }
        });

        res.json(savedAdvice);
    } catch (error) {
        res.status(500).json({ error: "Не удалось провести анализ" });
    }
};

const getAdvices = async (req, res) => {
    try {
        const userId = parseInt(req.params.id); 
        const advices = await prisma.advice.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' } 
        });

        res.json(advices);
    } catch (error) {
        console.error("Ошибка при получении советов:", error);
        res.status(500).json({ error: "Не удалось загрузить советы от AI" });
    }
};

module.exports = {
    createUser,
    getUsers,
    uploadStatement,
    getTransactions,
    analyzeBudget,
    getAdvices
};