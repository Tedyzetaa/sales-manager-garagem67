const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ✅ LISTAR CLIENTES CORRIGIDO
router.get('/', authMiddleware, (req, res) => {
  try {
    console.log('👥 Buscando clientes...');

    const stmt = db.prepare(`
      SELECT * FROM customers 
      WHERE is_active = 1 
      ORDER BY name
    `);
    
    const customers = stmt.all();

    console.log(`✅ ${customers.length} clientes encontrados`);

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ✅ CRIAR CLIENTE CORRIGIDO
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    console.log('🆕 Criando cliente:', { name, email, phone });

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nome é obrigatório'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO customers (name, email, phone, address, created_at, updated_at) 
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(name, email, phone, address);
    const customerId = result.lastInsertRowid;

    console.log('✅ Cliente criado com ID:', customerId);

    res.json({
      success: true,
      data: {
        id: customerId,
        name,
        email,
        phone,
        address
      },
      message: 'Cliente criado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;