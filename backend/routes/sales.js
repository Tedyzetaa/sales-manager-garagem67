const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ✅ LISTAR VENDAS CORRIGIDO
router.get('/', authMiddleware, (req, res) => {
  try {
    console.log('🛒 Buscando vendas...');

    const { start_date, end_date, customer_id } = req.query;
    
    let query = `
      SELECT s.*, c.name as customer_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += ' AND DATE(s.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(s.created_at) <= ?';
      params.push(end_date);
    }

    if (customer_id) {
      query += ' AND s.customer_id = ?';
      params.push(customer_id);
    }

    query += ' ORDER BY s.created_at DESC';

    const stmt = db.prepare(query);
    const sales = stmt.all(...params);

    console.log(`✅ ${sales.length} vendas encontradas`);

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('❌ Erro ao buscar vendas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ✅ CRIAR VENDA CORRIGIDA - SEM TRANSACTION PROBLEMÁTICA
router.post('/', authMiddleware, (req, res) => {
  try {
    const { customer_id, items, payment_method, observations } = req.body;

    console.log('🆕 Criando venda:', { customer_id, items: items?.length, payment_method });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Itens da venda são obrigatórios'
      });
    }

    // ✅ CORREÇÃO: Usar transação SQL tradicional
    db.exec('BEGIN TRANSACTION');

    try {
      // Calcular total
      const total_amount = items.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
      }, 0);

      // Gerar código único
      const sale_code = 'V' + Date.now();

      // Inserir venda
      const saleStmt = db.prepare(`
        INSERT INTO sales (sale_code, customer_id, total_amount, payment_method, observations, user_id, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      const saleResult = saleStmt.run(
        sale_code,
        customer_id || null,
        total_amount,
        payment_method,
        observations,
        req.user.userId
      );

      const saleId = saleResult.lastInsertRowid;

      // Inserir itens da venda e atualizar estoque
      const itemStmt = db.prepare(`
        INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total_price) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const inventoryStmt = db.prepare(`
        UPDATE inventory SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP 
        WHERE product_id = ?
      `);

      const movementStmt = db.prepare(`
        INSERT INTO stock_movements (product_id, quantity, type, reason, user_id, created_at) 
        VALUES (?, ?, 'saida', 'Venda', ?, CURRENT_TIMESTAMP)
      `);

      for (const item of items) {
        // Inserir item da venda
        itemStmt.run(
          saleId,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.quantity * item.unit_price
        );

        // Atualizar estoque
        inventoryStmt.run(item.quantity, item.product_id);

        // Registrar movimentação
        movementStmt.run(item.product_id, item.quantity, req.user.userId);
      }

      // Commit da transação
      db.exec('COMMIT');

      console.log('✅ Venda criada com ID:', saleId);

      res.json({
        success: true,
        data: {
          id: saleId,
          sale_code,
          total_amount,
          items_count: items.length
        },
        message: 'Venda registrada com sucesso'
      });

    } catch (error) {
      // Rollback em caso de erro
      db.exec('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Erro ao criar venda:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ OBTER DETALHES DA VENDA
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const saleId = req.params.id;
    console.log('📋 Buscando detalhes da venda:', saleId);

    // Venda
    const saleStmt = db.prepare(`
      SELECT s.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      WHERE s.id = ?
    `);
    const sale = saleStmt.get(saleId);

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Venda não encontrada'
      });
    }

    // Itens da venda
    const itemsStmt = db.prepare(`
      SELECT si.*, p.name as product_name 
      FROM sale_items si 
      JOIN products p ON si.product_id = p.id 
      WHERE si.sale_id = ?
    `);
    const items = itemsStmt.all(saleId);

    res.json({
      success: true,
      data: {
        ...sale,
        items
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar venda:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;