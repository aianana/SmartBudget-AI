const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET не задан в переменных окружения. Запуск прерван.");
}

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email и пароль обязательны" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Пароль должен быть не короче 6 символов" });
        }

        const candidate = await prisma.user.findUnique({ where: { email } });
        if (candidate) {
            return res.status(400).json({ error: "Пользователь с таким email уже существует" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: { email, password: hashedPassword }
        });

        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            message: "Пользователь успешно зарегистрирован",
            token,
            user: { id: newUser.id, email: newUser.email }
        });
    } catch (error) {
        console.error("Ошибка в функции register:", error);
        res.status(500).json({ error: "Ошибка при регистрации" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email и пароль обязательны" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: "Неверный email или пароль" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Неверный email или пароль" });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: { id: user.id, email: user.email }
        });
    } catch (error) {
        console.error("Ошибка в функции login:", error);
        res.status(500).json({ error: "Ошибка при входе" });
    }
};

module.exports = { register, login, JWT_SECRET };