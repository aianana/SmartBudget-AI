const express = require('express');
const cors = require('cors');
const budgetRoutes = require('./routes/budgetRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: "ok", message: "Server is running!" });
});

app.use('/api', budgetRoutes);

app.listen(PORT, () => {
    console.log(`Сервер бэкенда запущен на порту ${PORT}`);
});