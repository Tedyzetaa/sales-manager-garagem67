const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// ✅ CORREÇÃO: Importar serviços CORRETAMENTE
const SyncService = require('./services/syncService');
const syncService = new SyncService(); // ⭐ ÚNICA INSTÂNCIA

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// ✅✅✅ CONFIGURAÇÃO CORS MAIS PERMISSIVA - CORREÇÃO CRÍTICA
const corsOptions = {
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'],
  credentials: true, // ✅ CORREÇÃO: Mudar para true
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// ✅ APLICAR CORS PRIMEIRO
app.use(cors(corsOptions));

// ✅ MIDDLEWARE CORS MANUAL COMO BACKUP - CORRIGIDO
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true'); // ✅ CORREÇÃO: true para credentials
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Muitas requisições' }
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ CORREÇÃO: Middleware de logging simplificado
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Conectar ao banco de dados
const db = require('./config/database');

// ✅ ROTA DE TESTE CORS - MELHORADA
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: '✅ CORS está funcionando!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    headers: req.headers
  });
});

// ✅ CORREÇÃO: Importar e usar rotas CORRETAMENTE
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/products', require('./routes/products'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/export', require('./routes/export'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ✅ CORREÇÃO: Rotas de sync com instância correta
const syncRoutes = require('./routes/sync');
app.use('/api/sync', syncRoutes);

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Sales Manager Backend',
    version: '2.1.0',
    database: 'SQLite',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Sales Manager API - Garagem 67',
    version: '2.1.0',
    status: 'Operacional',
    endpoints: {
      health: '/api/health',
      cors_test: '/api/cors-test',
      auth: '/api/auth'
    }
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Erro no servidor:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'production' ? 'Erro interno' : error.message
  });
});

// ✅ CORREÇÃO: Inicialização mais segura - REMOVIDA CHAMADA startAutoSync
setTimeout(() => {
  if (process.env.AUTO_SYNC !== 'false') {
    console.log('ℹ️ Sincronização automática configurada para uso manual');
    // syncService será usado apenas via rotas manuais
  }
}, 5000);

// Inicializar servidor
const server = app.listen(PORT, HOST, () => {
  console.log('='.repeat(60));
  console.log(`🛍️  SALES MANAGER - GARAGEM 67`);
  console.log('='.repeat(60));
  console.log(`📍 Servidor: http://localhost:${PORT}`);
  console.log(`🌐 Acesso: http://${HOST}:${PORT}`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
  console.log(`🧪 CORS Test: http://localhost:${PORT}/api/cors-test`);
  console.log(`🔗 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔻 Encerrando servidor...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔻 Encerrando servidor...');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = { app, server };