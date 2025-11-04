const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Banco de dados JSON
const db = require('./config/database-json');

// JWT Secret
const JWT_SECRET = 'sales_manager_jwt_secret_2025';

// Rotas de Autenticação
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = db.getUserByUsername(username);
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rotas de Produtos
app.get('/api/products', (req, res) => {
  try {
    const products = db.getProducts();
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao buscar produtos' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const product = db.createProduct(req.body);
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao criar produto' });
  }
});

// Rotas de Vendas
app.get('/api/sales', (req, res) => {
  try {
    const sales = db.getSales();
    res.json({ success: true, sales });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao buscar vendas' });
  }
});

app.post('/api/sales', (req, res) => {
  try {
    const sale = db.createSale(req.body);
    res.json({ success: true, sale });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao criar venda' });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Sales Manager Backend',
    version: '1.0.0',
    database: 'JSON'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Sales Manager API - Garagem 67',
    version: '1.0.0',
    database: 'JSON'
  });
});

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🛍️  SALES MANAGER - GARAGEM 67 (JSON Database)');
  console.log('='.repeat(60));
  console.log(`📍 Servidor rodando: http://localhost:${PORT}`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(60));
});