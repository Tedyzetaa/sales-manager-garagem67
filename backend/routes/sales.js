const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ✅ LISTAR VENDAS
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

// ✅ CRIAR VENDA - COMPLETAMENTE CORRIGIDA
router.post('/', authMiddleware, (req, res) => {
  let transactionCommitted = false;
  
  try {
    const { customer_id, items, payment_method } = req.body;

    console.log('🆕 Criando venda:', { 
      customer_id, 
      items: items?.length, 
      payment_method 
    });

    // Validações
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Itens da venda são obrigatórios'
      });
    }

    if (!payment_method) {
      return res.status(400).json({
        success: false,
        error: 'Método de pagamento é obrigatório'
      });
    }

    // ✅ INICIAR TRANSAÇÃO NATIVA
    db.exec('BEGIN TRANSACTION');

    try {
      // 1. Calcular total da venda
      const total_amount = items.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
      }, 0);

      console.log('💰 Total da venda:', total_amount);

      // 2. Validar estoque antes de processar
      for (const item of items) {
        const productStmt = db.prepare('SELECT name, current_stock FROM products WHERE id = ?');
        const product = productStmt.get(item.product_id);
        
        if (!product) {
          throw new Error(`Produto ID ${item.product_id} não encontrado`);
        }

        if (product.current_stock < item.quantity) {
          throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${product.current_stock}, Solicitado: ${item.quantity}`);
        }

        console.log(`✅ Estoque válido: ${product.name} - ${product.current_stock} unidades`);
      }

      // 3. Inserir venda (APENAS COLUNAS EXISTENTES)
      const saleStmt = db.prepare(`
        INSERT INTO sales (customer_id, total_amount, payment_method, status, created_at) 
        VALUES (?, ?, ?, 'completed', datetime('now'))
      `);

      const saleResult = saleStmt.run(
        customer_id || null,
        total_amount,
        payment_method
      );

      const saleId = saleResult.lastInsertRowid;
      console.log('📝 Venda inserida com ID:', saleId);

      // 4. Preparar statements para itens e movimentações
      const itemStmt = db.prepare(`
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) 
        VALUES (?, ?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare(`
        UPDATE products 
        SET current_stock = current_stock - ?, updated_at = datetime('now') 
        WHERE id = ?
      `);

      const movementStmt = db.prepare(`
        INSERT INTO inventory_movements 
        (product_id, type, quantity, reason, movement_date, created_at) 
        VALUES (?, 'saida', ?, 'Venda', datetime('now'), datetime('now'))
      `);

      // 5. Processar itens da venda
      for (const item of items) {
        const itemTotal = item.quantity * item.unit_price;
        
        // Inserir item da venda
        itemStmt.run(
          saleId,
          item.product_id,
          item.quantity,
          item.unit_price,
          itemTotal
        );

        // Atualizar estoque do produto
        const updateResult = updateStockStmt.run(item.quantity, item.product_id);
        
        if (updateResult.changes === 0) {
          throw new Error(`Falha ao atualizar estoque do produto ID ${item.product_id}`);
        }

        // Registrar movimentação de estoque
        movementStmt.run(
          item.product_id,
          item.quantity
        );

        console.log(`📦 Item processado: Produto ${item.product_id}, Quantidade: ${item.quantity}`);
      }

      // 6. COMMIT da transação
      db.exec('COMMIT');
      transactionCommitted = true;

      console.log('✅ Venda finalizada com sucesso - ID:', saleId);

      // Buscar dados completos da venda criada
      const completeSaleStmt = db.prepare(`
        SELECT s.*, c.name as customer_name 
        FROM sales s 
        LEFT JOIN customers c ON s.customer_id = c.id 
        WHERE s.id = ?
      `);
      const completeSale = completeSaleStmt.get(saleId);

      res.json({
        success: true,
        data: {
          ...completeSale,
          items_count: items.length
        },
        message: 'Venda registrada com sucesso'
      });

    } catch (error) {
      // Rollback em caso de erro na transação
      if (!transactionCommitted) {
        db.exec('ROLLBACK');
        console.log('🔄 Rollback executado devido a erro:', error.message);
      }
      throw error;
    }

  } catch (error) {
    console.error('❌ Erro ao criar venda:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erro ao processar venda',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ OBTER DETALHES DA VENDA
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const saleId = req.params.id;
    console.log('📋 Buscando detalhes da venda:', saleId);

    // Venda principal
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

// ✅ CANCELAR VENDA
router.post('/:id/cancel', authMiddleware, (req, res) => {
  let transactionCommitted = false;
  
  try {
    const saleId = req.params.id;
    console.log('❌ Cancelando venda:', saleId);

    db.exec('BEGIN TRANSACTION');

    try {
      // Buscar itens da venda
      const itemsStmt = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?');
      const items = itemsStmt.all(saleId);

      // Verificar se a venda existe
      const saleStmt = db.prepare('SELECT * FROM sales WHERE id = ?');
      const sale = saleStmt.get(saleId);

      if (!sale) {
        throw new Error('Venda não encontrada');
      }

      // Reestocar produtos
      const updateStockStmt = db.prepare(`
        UPDATE products 
        SET current_stock = current_stock + ?, updated_at = datetime('now') 
        WHERE id = ?
      `);

      const movementStmt = db.prepare(`
        INSERT INTO inventory_movements 
        (product_id, type, quantity, reason, movement_date, created_at) 
        VALUES (?, 'entrada', ?, 'Cancelamento de Venda', datetime('now'), datetime('now'))
      `);

      for (const item of items) {
        updateStockStmt.run(item.quantity, item.product_id);
        movementStmt.run(item.product_id, item.quantity);
      }

      // Atualizar status da venda
      const cancelStmt = db.prepare('UPDATE sales SET status = ? WHERE id = ?');
      cancelStmt.run('canceled', saleId);

      db.exec('COMMIT');
      transactionCommitted = true;

      console.log('✅ Venda cancelada com sucesso:', saleId);

      res.json({
        success: true,
        message: 'Venda cancelada com sucesso'
      });

    } catch (error) {
      if (!transactionCommitted) {
        db.exec('ROLLBACK');
      }
      throw error;
    }

  } catch (error) {
    console.error('❌ Erro ao cancelar venda:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao cancelar venda',
      message: error.message
    });
  }
});

module.exports = router;