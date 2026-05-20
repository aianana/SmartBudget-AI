const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../controllers/authController');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Доступ запрещен. Токен отсутствует." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.userId = decoded.userId; 
        
        next(); 
    } catch (error) {
        return res.status(403).json({ error: "Неверный или просроченный токен." });
    }
};