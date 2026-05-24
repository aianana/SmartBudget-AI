const rateLimit = require('express-rate-limit');

//Общий лимит для всего API 100 запросов за 15 минут с одного IP
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Слишком много запросов. Попробуйте через 15 минут.' },
    standardHeaders: true,
    legacyHeaders: false,
});

//Жёсткий лимит для авторизации 5 попыток за 15 минут
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Слишком много попыток входа. Аккаунт заблокирован на 15 минут.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, //успешный вход не попытка
});

module.exports = { generalLimiter, authLimiter };
