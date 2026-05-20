const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer'); 
const fs = require('fs'); 
const csv = require('csv-parser'); 

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

const upload = multer({ dest: 'uploads/' });

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: "ok", message: "server is running" });
});


app.post('/api/users', async (req, res) => {
    try {
        const { email, name } = req.body; 
        const newUser = await prisma.user.create({ data: { email, name } });
        res.json(newUser);
    } catch (error) {
        res.status(400).json({ error: "Ошибка" });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const allUsers = await prisma.user.findMany();
        res.json(allUsers);
    } catch (error) {
        res.status(500).json({ error: "Ошибка базы данных" });
    }
});


app.post('/api/upload', upload.single('statement'), (req, res) => {
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
                res.status(500).json({ error: "Ошибка при сохранении транзакций в базу данных" });
            }
        });
});


app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: {
                date: 'desc'
            }
        });

        res.json(transactions);
    } catch (error) {
        console.error("Ошибка при получении транзакций:", error);
        res.status(500).json({ error: "Не удалось загрузить данные из базы" });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер бэкенда запущен на порту ${PORT}`);
});