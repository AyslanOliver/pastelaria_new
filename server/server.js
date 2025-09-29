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

console.log('🚀 Iniciando servidor...');
console.log('📍 Ambiente:', process.env.NODE_ENV || 'development');
console.log('🔌 Porta:', PORT);

// Conectar ao MongoDB apenas se não estiver em ambiente serverless
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDB();
}

// Middlewares
app.use(cors({
  origin: function(origin, callback) {
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:8000', 
      'http://127.0.0.1:8000',
      'http://192.168.18.104:8000',
      'http://10.0.2.2:8000',  // Emulador Android
      'file://',
      'capacitor://localhost',
      'ionic://localhost',
      'http://localhost',
      'http://192.168.18.104',
      'http://10.0.2.2'  // Emulador Android
    ];
    
    // Permitir requisições sem origin (mobile apps)
    if (!origin) return callback(null, true);
    
    // Verificar se a origin está na lista permitida
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Detectar automaticamente IPs locais para desenvolvimento
      const isLocalDevelopment = origin.match(/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.0\.|172\.(1[6-9]|2[0-9]|3[01])\.)/);
      if (isLocalDevelopment) {
        callback(null, true);
      } else {
        // Em produção, permitir qualquer origin (pode ser restringido depois)
        if (process.env.NODE_ENV === 'production') {
          callback(null, true);
        } else {
          callback(new Error('Não permitido pelo CORS'));
        }
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas da API
// Rota raiz da API
app.get('/api', (req, res) => {
  res.json({
    message: 'API da Pastelaria funcionando!',
    version: '2.0.0',
    endpoints: {
      produtos: '/api/produtos',
      sabores: '/api/sabores',
      tamanhos: '/api/tamanhos',
      pedidos: '/api/pedidos',
      test: '/api/test',
      status: '/api/status'
    }
  });
});

// Usar as rotas
app.use('/api/produtos', produtosRoutes);
app.use('/api/sabores', saboresRoutes);
app.use('/api/tamanhos', tamanhosRoutes);
app.use('/api/pedidos', pedidosRoutes);

// Rota de health check (compatibilidade com frontend)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'API da Pastelaria funcionando!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rota de health check alternativa
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'API da Pastelaria funcionando!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

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