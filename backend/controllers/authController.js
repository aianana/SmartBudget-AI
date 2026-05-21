const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        const candidate = await prisma.user.findUnique({ where: { email } });
        if (candidate) {
            return res.status(400).json({ error: "Пользователь с таким email уже существует" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: { email, password: hashedPassword }
        });

        res.status(201).json({ message: "Пользователь успешно зарегистрирован" });
    } catch (error) {
        console.error("Ошибка в функции register:", error);
        res.status(500).json({ error: "Ошибка при регистрации" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

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
        console.error("🔥 Ошибка в функции login:", error);
        res.status(500).json({ error: "Ошибка при входе" });
    }
};

module.exports = { register, login, JWT_SECRET };
