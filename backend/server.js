const express = require('express');
const cors = require('cors');
const budgetRoutes = require('./routes/budgetRoutes');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const helmet = require('helmet');

const app = express();
app.set('trust proxy', 1);
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
        const safebody = { ...req.body };
        if (safebody.password) safebody.password = '***';
        console.log('Данные (req.body):', safebody);
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

const { logAction } = require('./utils/auditLog');

app.all('/.env', async (req, res) => {
    await logAction(null, 'HONEYPOT_TRIGGERED', req.ip, `${req.method} /.env`);
    res.status(403).json({ error: "Forbidden" });
});
app.all('/admin/secret', async (req, res) => {
    await logAction(null, 'HONEYPOT_TRIGGERED', req.ip, `${req.method} /admin/secret`);
    res.status(403).json({ error: "Forbidden" });
});
app.all('/backup', async (req, res) => {
    await logAction(null, 'HONEYPOT_TRIGGERED', req.ip, `${req.method} /backup`);
    res.status(403).json({ error: "Forbidden" });
});

app.use('/api', budgetRoutes);

app.listen(PORT, () => {
    console.log(`Сервер бэкенда запущен на порту ${PORT}`);
    console.log(`Документация доступна по адресу: http://localhost:${PORT}/api-docs`);
});
