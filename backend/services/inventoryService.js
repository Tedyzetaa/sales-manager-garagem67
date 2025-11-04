const db = require('../config/database');

class InventoryService {
  // Atualizar estoque
  static updateStock(productId, quantity, type, reason, userId) {
    try {
      // Buscar estoque atual
      const inventoryStmt = db.prepare('SELECT current_stock FROM inventory WHERE product_id = ?');
      const inventory = inventoryStmt.get(productId);

      if (!inventory) {
        throw new Error('Produto não encontrado no inventário');
      }

      const previousStock = inventory.current_stock;
      let newStock;

      switch (type) {
        case 'entrada':
          newStock = previousStock + quantity;
          break;
        case 'saida':
          newStock = previousStock - quantity;
          if (newStock < 0) {
            throw new Error('Estoque insuficiente');
          }
          break;
        case 'ajuste':
          newStock = quantity;
          break;
        default:
          throw new Error('Tipo de movimentação inválido');
      }

      // Atualizar estoque
      const updateStmt = db.prepare(`
        UPDATE inventory SET current_stock = ?, last_updated = CURRENT_TIMESTAMP 
        WHERE product_id = ?
      `);
      const updateResult = updateStmt.run(newStock, productId);

      // Registrar movimentação
      const movementStmt = db.prepare(`
        INSERT INTO stock_movements (
          product_id, type, quantity, previous_stock, new_stock, reason, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const movementResult = movementStmt.run(
        productId, type, quantity, previousStock, newStock, reason, userId
      );

      return {
        productId,
        previousStock,
        newStock,
        movementId: movementResult.lastInsertRowid
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar estoque:', error);
      throw error;
    }
  }

  // Buscar movimentações de estoque
  static getStockMovements(filters = {}) {
    try {
      const {
        product_id,
        type,
        start_date,
        end_date,
        page = 1,
        limit = 50
      } = filters;

      let whereConditions = ['1=1'];
      let params = [];

      if (product_id) {
        whereConditions.push('sm.product_id = ?');
        params.push(product_id);
      }

      if (type) {
        whereConditions.push('sm.type = ?');
        params.push(type);
      }

      if (start_date) {
        whereConditions.push('sm.movement_date >= ?');
        params.push(start_date);
      }

      if (end_date) {
        whereConditions.push('sm.movement_date <= ?');
        params.push(end_date + ' 23:59:59');
      }

      const offset = (page - 1) * limit;
      const whereClause = whereConditions.join(' AND ');

      // Buscar movimentações
      const movementsStmt = db.prepare(`
        SELECT 
          sm.*,
          p.name as product_name,
          p.sku,
          u.full_name as user_name
        FROM stock_movements sm
        LEFT JOIN products p ON sm.product_id = p.id
        LEFT JOIN users u ON sm.user_id = u.id
        WHERE ${whereClause}
        ORDER BY sm.movement_date DESC
        LIMIT ? OFFSET ?
      `);
      const movements = movementsStmt.all(...params, limit, offset);

      // Contar total
      const countStmt = db.prepare(`SELECT COUNT(*) as total FROM stock_movements sm WHERE ${whereClause}`);
      const countResult = countStmt.get(...params);

      return {
        movements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar movimentações:', error);
      throw error;
    }
  }

  // Buscar produtos com estoque baixo
  static getLowStockProducts() {
    try {
      const stmt = db.prepare(`
        SELECT 
          p.*,
          i.current_stock,
          i.reserved_stock,
          (i.current_stock - i.reserved_stock) as available_stock,
          p.min_stock
        FROM products p
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.has_stock_control = 1 
          AND (i.current_stock - i.reserved_stock) <= p.min_stock
          AND p.is_active = 1
        ORDER BY available_stock ASC
      `);
      return stmt.all();
    } catch (error) {
      console.error('❌ Erro ao buscar produtos com estoque baixo:', error);
      throw error;
    }
  }

  // Buscar relatório de estoque
  static getInventoryReport() {
    try {
      const stmt = db.prepare(`
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.barcode,
          c.name as category_name,
          i.current_stock,
          i.reserved_stock,
          (i.current_stock - i.reserved_stock) as available_stock,
          p.min_stock,
          p.max_stock,
          p.cost_price,
          (p.cost_price * i.current_stock) as total_cost_value,
          (p.price * i.current_stock) as total_sale_value
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.is_active = 1 AND p.has_stock_control = 1
        ORDER BY c.name, p.name
      `);
      const inventory = stmt.all();

      // Calcular totais
      const totals = inventory.reduce((acc, item) => {
        acc.totalProducts += 1;
        acc.totalStock += item.current_stock || 0;
        acc.totalCostValue += item.total_cost_value || 0;
        acc.totalSaleValue += item.total_sale_value || 0;
        
        if ((item.available_stock || 0) <= item.min_stock) {
          acc.lowStockItems += 1;
        }
        
        if ((item.available_stock || 0) <= 0) {
          acc.outOfStockItems += 1;
        }
        
        return acc;
      }, {
        totalProducts: 0,
        totalStock: 0,
        totalCostValue: 0,
        totalSaleValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      });

      return {
        inventory,
        totals
      };
    } catch (error) {
      console.error('❌ Erro ao buscar relatório de estoque:', error);
      throw error;
    }
  }
}

module.exports = InventoryService;