const express = require('express');
const cors = require('cors');
const budgetRoutes = require('./routes/budgetRoutes');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const helmet = require('helmet');

const app = express();
app.use(helmet());
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use('/api', generalLimiter);

app.use((req, res, next) => {
    console.log(`\n[${new Date().toLocaleTimeString()}] Входящий запрос: ${req.method} ${req.originalUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Данные (req.body):', req.body);
    }
    next(); 
});

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'SmartBudget AI API',
            version: '1.0.0',
            description: 'API для управления бюджетом и получения советов от ИИ',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./routes/*.js'], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs)); 

app.get('/api/health', (req, res) => {
    res.json({ status: "ok", message: "Server is running!" });
});

app.use('/api', budgetRoutes);


const HONEYPOT_PATHS = ['/api/.env', '/api/admin/secret', '/api/config', '/api/backup'];

HONEYPOT_PATHS.forEach(path => {
    app.all(path, async (req, res) => {
        console.warn(`HONEYPOT TRIGGERED: ${req.method} ${path} from ${req.ip}`);
        
        //логируем в audit_logs
        const { logAction } = require('./utils/auditLog');
        await logAction(null, 'HONEYPOT_TRIGGERED', req.ip, `${req.method} ${path}`);
        
        //отвечаем 403 чтобы не спугнуть бота
        res.status(403).json({ error: "Forbidden" });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер бэкенда запущен на порту ${PORT}`);
    console.log(`Документация доступна по адресу: http://localhost:${PORT}/api-docs`);
});
