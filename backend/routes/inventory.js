const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ✅ CORREÇÃO: Importar igual aos outros arquivos
const authMiddleware = require('../middleware/auth');

// ✅ Rota para obter relatório de estoque - AGORA FUNCIONANDO
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('📦 Buscando relatório de estoque...');
    
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.current_stock,
        p.min_stock,
        p.is_active,
        c.name as category_name,
        (p.price * p.current_stock) as stock_value
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY p.current_stock ASC, p.name ASC
    `;

    const products = db.prepare(query).all();
    
    console.log(`✅ ${products.length} produtos encontrados no estoque`);
    
    res.json({
      success: true,
      data: products,
      count: products.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estoque:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar relatório de estoque',
      message: error.message
    });
  }
});

// ✅ Rota para criar movimentação de estoque
router.post('/movements', authMiddleware, async (req, res) => {
  try {
    const { product_id, type, quantity, reason, observations } = req.body;
    
    console.log('📦 Registrando movimentação:', { product_id, type, quantity, reason });

    // Validações
    if (!product_id || !type || !quantity || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Dados incompletos'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantidade deve ser maior que zero'
      });
    }

    // Buscar produto atual
    const productQuery = `SELECT * FROM products WHERE id = ?`;
    const product = db.prepare(productQuery).get(product_id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }

    const currentStock = product.current_stock || 0;
    let newStock = currentStock;

    // Calcular novo estoque baseado no tipo
    switch (type) {
      case 'entrada':
        newStock = currentStock + quantity;
        break;
      case 'saida':
        if (quantity > currentStock) {
          return res.status(400).json({
            success: false,
            error: `Quantidade indisponível. Estoque atual: ${currentStock}`
          });
        }
        newStock = currentStock - quantity;
        break;
      case 'ajuste':
        newStock = quantity;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Tipo de movimentação inválido'
        });
    }

    // Iniciar transação
    const transaction = db.transaction(() => {
      // 1. Registrar a movimentação
      const movementQuery = `
        INSERT INTO inventory_movements 
        (product_id, type, quantity, reason, observations, movement_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const movementParams = [
        product_id,
        type,
        quantity,
        reason,
        observations || null,
        new Date().toISOString(),
        new Date().toISOString()
      ];

      const movementResult = db.prepare(movementQuery).run(...movementParams);
      console.log('📝 Movimentação registrada com ID:', movementResult.lastInsertRowid);

      // 2. Atualizar estoque do produto
      const updateProductQuery = `
        UPDATE products 
        SET current_stock = ?, updated_at = ?
        WHERE id = ?
      `;
      
      const updateParams = [
        newStock,
        new Date().toISOString(),
        product_id
      ];

      const updateResult = db.prepare(updateProductQuery).run(...updateParams);
      console.log('🔄 Estoque atualizado:', updateResult.changes, 'linhas afetadas');

      return {
        movementId: movementResult.lastInsertRowid,
        productUpdated: updateResult.changes,
        newStock: newStock
      };
    });

    // Executar transação
    const result = transaction();

    console.log('✅ Movimentação concluída:', result);

    res.json({
      success: true,
      message: 'Movimentação registrada com sucesso',
      data: {
        movement_id: result.movementId,
        product_id: product_id,
        previous_stock: currentStock,
        new_stock: newStock,
        movement_type: type,
        quantity: quantity
      }
    });

  } catch (error) {
    console.error('❌ Erro ao registrar movimentação:', error);
    
    let errorMessage = 'Erro ao registrar movimentação';
    
    if (error.message.includes('no such column')) {
      errorMessage = `Erro de estrutura do banco: ${error.message}`;
    } else if (error.message.includes('FOREIGN KEY')) {
      errorMessage = 'Produto não encontrado';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      message: error.message
    });
  }
});

// ✅ Rota: Obter histórico de movimentações
router.get('/movements', authMiddleware, async (req, res) => {
  try {
    const { product_id, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        im.*,
        p.name as product_name,
        p.price as product_price
      FROM inventory_movements im
      LEFT JOIN products p ON im.product_id = p.id
    `;
    
    let params = [];
    
    if (product_id) {
      query += ' WHERE im.product_id = ?';
      params.push(product_id);
    }
    
    query += ' ORDER BY im.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const movements = db.prepare(query).all(...params);
    
    res.json({
      success: true,
      data: movements,
      count: movements.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar movimentações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico de movimentações'
    });
  }
});

// ✅ Rota: Estatísticas de estoque
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_products,
        SUM(current_stock) as total_items,
        SUM(price * current_stock) as total_value,
        SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN current_stock > 0 AND current_stock < min_stock THEN 1 ELSE 0 END) as low_stock
      FROM products 
      WHERE is_active = 1
    `;

    const stats = db.prepare(statsQuery).get();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas de estoque'
    });
  }
});

// ✅ Rota: Buscar movimentação por ID
router.get('/movements/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        im.*,
        p.name as product_name,
        p.price as product_price
      FROM inventory_movements im
      LEFT JOIN products p ON im.product_id = p.id
      WHERE im.id = ?
    `;

    const movement = db.prepare(query).get(id);
    
    if (!movement) {
      return res.status(404).json({
        success: false,
        error: 'Movimentação não encontrada'
      });
    }

    res.json({
      success: true,
      data: movement
    });

  } catch (error) {
    console.error('❌ Erro ao buscar movimentação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar movimentação'
    });
  }
});

console.log('✅ Rotas de inventory carregadas com sucesso');

module.exports = router;