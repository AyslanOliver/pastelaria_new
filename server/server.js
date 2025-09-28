const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Importar configuração do banco
const connectDB = require('./config/database');

// Importar rotas
const produtosRoutes = require('./routes/produtos');
const saboresRoutes = require('./routes/sabores');
const tamanhosRoutes = require('./routes/tamanhos');
const pedidosRoutes = require('./routes/pedidos');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar ao MongoDB
connectDB();

// Middlewares
app.use(cors({
  origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas da API
app.use('/api/produtos', produtosRoutes);
app.use('/api/sabores', saboresRoutes);
app.use('/api/tamanhos', tamanhosRoutes);
app.use('/api/pedidos', pedidosRoutes);

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API da Pastelaria funcionando!', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota de status da API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    database: 'connected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err.stack);
  res.status(500).json({
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado!'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 API disponível em: http://localhost:${PORT}/api`);
  console.log(`🔍 Status da API: http://localhost:${PORT}/api/status`);
  console.log(`🧪 Teste da API: http://localhost:${PORT}/api/test`);
});

module.exports = app;