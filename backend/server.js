const express = require('express');
const budgetRoutes = require('./routes/budgetRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: "ok", message: "Server is running!" });
});

app.use('/api', budgetRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер бэкенда запущен на порту ${PORT}`);
});
