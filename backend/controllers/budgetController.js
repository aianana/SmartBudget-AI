const prisma = require('../db');
const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const path = require('path');
const axios = require('axios');

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
        return res.status(400).json({ error: "Пожалуйста, загрузите файл" });
    }
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    const userId = req.userId; 
    
    let results = [];

    try {
        if (ext === '.csv') {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    await processAndSaveData(results, req.file.path, userId, res); 
                });
        } 
        else if (ext === '.xlsx' || ext === '.xls') {
            const workbook = xlsx.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0]; 
            
            results = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            
            processAndSaveData(results, req.file.path, userId, res); 
        } 
        else if (ext === '.pdf') {
            fs.unlinkSync(req.file.path);
            return res.json({ 
                message: "PDF файл принят! В MVP-версии PDF-выписки отправляются на ручной анализ ИИ.",
                status: "pending_ai_analysis"
            });
        } 
        else {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: "Формат не поддерживается. Загрузите CSV, Excel или PDF." });
        }
    } catch (error) {
        console.error("Ошибка при чтении файла:", error);
        res.status(500).json({ error: "Ошибка при обработке файла" });
    }
};

async function processAndSaveData(results, filePath, userId, res) { 
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); 
        }

        const transactionsData = results.map(row => ({
            amount: parseFloat(row.amount || row.Сумма || 0), 
            date: new Date(row.date || row.Дата || new Date()),
            category: row.category || row.Категория || "Другое",
            description: row.description || row.Описание || "",
            userId: userId 
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
}

const getTransactions = async (req, res) => {
    try {
        const userId = req.userId; 

        const transactions = await prisma.transaction.findMany({
            where: { userId: userId }, 
            orderBy: { date: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: "Не удалось загрузить данные" });
    }
};

const analyzeBudget = async (req, res) => {
    try {
        const userId = req.userId; 
        const transactions = await prisma.transaction.findMany({ where: { userId } });

        if (transactions.length === 0) {
            return res.json({ message: "У вас пока нет транзакций для анализа." });
        }

        const totalSpend = transactions.reduce((sum, t) => sum + t.amount, 0);
        const maxTransaction = transactions.reduce((max, t) => t.amount > max.amount ? t : max, transactions[0]);

        let aiMessage = `Анализ бюджета готов. Всего вы потратили: ${totalSpend.toFixed(2)} сом. \n Обратите внимание на категорию "${maxTransaction.category}", где самая крупная трата составила ${maxTransaction.amount} сом (${maxTransaction.description}). \n Совет: Попробуйте сократить расходы на эту категорию на 10% в следующем месяце.`;

        /*
        // Замени 'http://localhost:5000/analyze' на реальный адрес Python-сервиса
        const response = await axios.post('http://localhost:5000/analyze', {
            transactions: transactions,
            totalSpend: totalSpend
        });
        aiMessage = response.data.advice; 
        */

        const savedAdvice = await prisma.advice.create({
            data: { message: aiMessage, userId }
        });

        res.json(savedAdvice);
    } catch (error) {
        console.error("Ошибка при ИИ-анализе:", error);
        res.status(500).json({ error: "Не удалось провести анализ" });
    }
};

const getAdvices = async (req, res) => {
    try {
        const userId = req.userId; 

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