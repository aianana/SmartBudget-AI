const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient(); 
const PORT = 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: "ok", message: "Server is running!" });
});


app.post('/api/users', async (req, res) => {
    try {
        const { email, name } = req.body; 
        const newUser = await prisma.user.create({
            data: { email, name }
        });
        
        res.json(newUser); 
    } catch (error) {
        res.status(400).json({ error: "Ошибка при создании пользователя. Возможно такой email уже есть" });
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

app.listen(PORT, () => {
    console.log(`Сервер бэкенда запущен на порту ${PORT}`);
});