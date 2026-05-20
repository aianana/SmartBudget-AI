const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer'); // Подключаем библиотеку для файлов
const fs = require('fs'); // Встроенный модуль Node.js для работы с файловой системой
const csv = require('csv-parser'); // Библиотека для чтения CSV

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

// Настраиваем Multer: говорим ему сохранять все загруженные файлы в папку 'uploads/'
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: "ok", message: "server is running" });
});

// --- ЭНДПОИНТЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ---
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

// --- ЭНДПОИНТ ДЛЯ ЗАГРУЗКИ ФАЙЛОВ ---

// upload.single('statement') означает, что мы ждем ровно один файл, 
// и на фронтенде он должен называться словом 'statement'
app.post('/api/upload', upload.single('statement'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Пожалуйста, загрузите CSV файл" });
    }

    const results = [];

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            fs.unlinkSync(req.file.path); // Удаляем временный файл
            
            try {
                // Подготавливаем данные для базы
                const transactionsData = results.map(row => ({
                    amount: parseFloat(row.amount), // Превращаем строку в число
                    date: new Date(row.date),       // Превращаем строку в дату
                    category: row.category,
                    description: row.description,
                    userId: 1                       // Привязываем к первому пользователю
                }));

                // Команда Призме: сохранить сразу много записей в таблицу Transaction
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

app.listen(PORT, () => {
    console.log(`Сервер бэкенда запущен на порту ${PORT}`);
});