// src/app.js
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
const express = require('express');
const path = require('path');
const convertRoutes = require('./routes/convertRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir arquivos estáticos (seu frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para parsing de JSON (se necessário para futuras requisições)
app.use(express.json());

// Rotas da API
app.use('/api', convertRoutes);

// Rota padrão para servir o index.html
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
	console.log(`Servidor rodando em http://localhost:${PORT}`);
});
