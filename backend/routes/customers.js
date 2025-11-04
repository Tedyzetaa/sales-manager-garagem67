const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const SyncService = require('../services/syncService');

const router = express.Router();
const syncService = new SyncService();

// ✅ LISTAR CLIENTES CORRIGIDO - COM SINCRONIZAÇÃO
router.get('/', authMiddleware, (req, res) => {
  try {
    console.log('👥 Buscando clientes...');

    const { search = '', page = 1, limit = 50 } = req.query;
    
    let whereConditions = ['is_active = 1'];
    let params = [];

    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const offset = (page - 1) * limit;
    const whereClause = whereConditions.join(' AND ');

    // Buscar clientes
    const customersStmt = db.prepare(`
      SELECT * FROM customers 
      WHERE ${whereClause}
      ORDER BY name
      LIMIT ? OFFSET ?
    `);
    const customers = customersStmt.all(...params, parseInt(limit), offset);

    // Contar total
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM customers WHERE ${whereClause}`);
    const countResult = countStmt.get(...params);

    console.log(`✅ ${customers.length} clientes encontrados`);

    res.json({
      success: true,
      data: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ✅ CRIAR CLIENTE CORRIGIDO - COM SINCRONIZAÇÃO AUTOMÁTICA
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, email, phone, address, postal_code, city, state } = req.body;

    console.log('🆕 Criando cliente:', { name, email, phone });

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nome é obrigatório'
      });
    }

    // ✅ CORREÇÃO: Inserir com todas as colunas necessárias
    const stmt = db.prepare(`
      INSERT INTO customers (
        name, email, phone, address, postal_code, city, state,
        created_at, updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'synced')
    `);

    const result = stmt.run(
      name, 
      email, 
      phone, 
      address,
      postal_code || null,
      city || null, 
      state || null
    );
    
    const customerId = result.lastInsertRowid;

    // ✅ SINCRONIZAR AUTOMATICAMENTE O NOVO CLIENTE
    try {
      syncService.syncSingleCustomer(customerId);
      console.log(`✅ Cliente ${customerId} sincronizado automaticamente`);
    } catch (syncError) {
      console.log(`⚠️ Cliente criado mas erro na sincronização:`, syncError.message);
    }

    console.log('✅ Cliente criado com ID:', customerId);

    // Buscar dados completos do cliente criado
    const customerStmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    const customer = customerStmt.get(customerId);

    res.json({
      success: true,
      data: customer,
      message: 'Cliente criado e sincronizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ✅ ATUALIZAR CLIENTE - COM SINCRONIZAÇÃO
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const customerId = req.params.id;
    const { name, email, phone, address, postal_code, city, state } = req.body;

    console.log(`✏️ Atualizando cliente ID: ${customerId}`);

    const stmt = db.prepare(`
      UPDATE customers 
      SET 
        name = ?, email = ?, phone = ?, address = ?,
        postal_code = ?, city = ?, state = ?,
        updated_at = datetime('now'),
        sync_status = 'synced',
        last_sync_at = datetime('now')
      WHERE id = ?
    `);

    const result = stmt.run(
      name, email, phone, address,
      postal_code, city, state,
      customerId
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    console.log(`✅ Cliente ${customerId} atualizado`);

    res.json({
      success: true,
      message: 'Cliente atualizado e sincronizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ✅ EXCLUIR CLIENTE (soft delete)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const customerId = req.params.id;
    console.log(`🗑️ Excluindo cliente ID: ${customerId}`);

    const stmt = db.prepare(`
      UPDATE customers 
      SET is_active = 0, updated_at = datetime('now')
      WHERE id = ?
    `);

    const result = stmt.run(customerId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    console.log(`✅ Cliente ${customerId} excluído (soft delete)`);

    res.json({
      success: true,
      message: 'Cliente excluído com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao excluir cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ✅ BUSCAR CLIENTE POR ID
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const customerId = req.params.id;
    console.log(`🔍 Buscando cliente ID: ${customerId}`);

    const stmt = db.prepare(`
      SELECT * FROM customers 
      WHERE id = ? AND is_active = 1
    `);
    
    const customer = stmt.get(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    console.log(`✅ Cliente encontrado: ${customer.name}`);

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('❌ Erro ao buscar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;