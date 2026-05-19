const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('работает');
});

app.listen(PORT, () => {
    console.log(`запущено ${PORT}`);
    console.log(`Открой http://localhost:${PORT}`);
});