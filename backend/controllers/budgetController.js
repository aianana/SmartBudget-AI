const prisma = require('../db');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');


const uploadStatement = async (req, res) => {
    try {
        const userId = req.userId; 

        if (!req.file) {
            return res.status(400).json({ message: "Пожалуйста, загрузите файл выписки." });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        if (user.filesUsed >= 2) {
            fs.unlinkSync(req.file.path); 
            return res.status(403).json({ message: "Лимит файлов исчерпан. Оформите подписку." });
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path), req.file.originalname);

        console.log("Отправляю файл на анализ ИИ...");

        // ЗАМЕНИ URL НА АДРЕС ИИ-СЕРВЕРА
        const aiResponse = await axios.post('http://10.128.52.94/api/upload', formData, {
            headers: { ...formData.getHeaders() }
        });

        const stats = aiResponse.data;

        await prisma.user.update({
            where: { id: userId },
            data: {
                filesUsed: { increment: 1 }, 
                statsJson: JSON.stringify(stats) 
            }
        });

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.status(200).json({
            message: "Выписка успешно проанализирована!",
            data: stats
        });

    } catch (error) {
        console.error("Ошибка при обработке файла:", error.message);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); 
        res.status(500).json({ message: "Ошибка сервера при анализе выписки." });
    }
};



const askQuestion = async (req, res) => {
    try {
        const userId = req.userId;
        const { question } = req.body; 

        if (!question) {
            return res.status(400).json({ message: "Введите вопрос." });
        }

        const user = await prisma.user.findUnique({ 
            where: { id: userId },
            include: { histories: true } 
        });

        if (user.questionsUsed >= 3) {
            return res.status(403).json({ message: "Лимит вопросов исчерпан. Оформите подписку." });
        }

        if (!user.statsJson) {
            return res.status(400).json({ message: "Сначала загрузите выписку для анализа." });
        }

        console.log("Отправляю вопрос ИИ...");

        const aiResponse = await axios.post('http://10.128.52.94/api/ask', {
            question: question,
            stats: JSON.parse(user.statsJson), 
            history: user.histories 
        });

        const answerText = aiResponse.data.answer;

        await prisma.history.create({
            data: {
                userId: userId,
                question: question,
                answer: answerText
            }
        });

        await prisma.user.update({
            where: { id: userId },
            data: { questionsUsed: { increment: 1 } }
        });

        res.status(200).json({ answer: answerText });

    } catch (error) {
        console.error("Ошибка при вопросе к ИИ:", error.message);
        res.status(500).json({ message: "Ошибка сервера при обращении к ИИ." });
    }
};


const getHistory = async (req, res) => {
    try {
        const userId = req.userId; 

        const history = await prisma.history.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' } 
        });

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: "Не удалось загрузить историю" });
    }
};


const getTransactions = async (req, res) => {
    try {
        const userId = req.userId; 
        const transactions = await prisma.transaction.findMany({
            where: { userId: userId }, 
            orderBy: { date: 'desc' }
        });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Не удалось загрузить данные" });
    }
};

module.exports = {
    uploadStatement,
    askQuestion,
    getHistory,
    getTransactions
};