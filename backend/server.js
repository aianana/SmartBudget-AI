const express = require('express');
const cors = require('cors');
const budgetRoutes = require('./routes/budgetRoutes');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
    console.log(`Сервер бэкенда запущен на порту ${PORT}`);
    console.log(`Документация доступна по адресу: http://localhost:${PORT}/api-docs`);
});
