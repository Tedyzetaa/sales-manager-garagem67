const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ✅ FUNÇÕES AUXILIARES CORRIGIDAS PARA better-sqlite3
function salesToday() {
  try {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total 
      FROM sales 
      WHERE DATE(created_at) = DATE('now')
    `);
    return stmt.get();
  } catch (error) {
    console.error('❌ Erro em salesToday:', error);
    return { count: 0, total: 0 };
  }
}

function salesThisMonth() {
  try {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total 
      FROM sales 
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `);
    return stmt.get();
  } catch (error) {
    console.error('❌ Erro em salesThisMonth:', error);
    return { count: 0, total: 0 };
  }
}

function topProducts() {
  try {
    const stmt = db.prepare(`
      SELECT p.name, SUM(si.quantity) as total_sold
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.created_at) >= DATE('now', '-30 days')
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `);
    return stmt.all();
  } catch (error) {
    console.error('❌ Erro em topProducts:', error);
    return [];
  }
}

function lowStockProducts() {
  try {
    const stmt = db.prepare(`
      SELECT p.name, i.current_stock, i.min_stock
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.current_stock <= i.min_stock
      ORDER BY i.current_stock ASC
      LIMIT 10
    `);
    return stmt.all();
  } catch (error) {
    console.error('❌ Erro em lowStockProducts:', error);
    return [];
  }
}

function averageTicket() {
  try {
    const stmt = db.prepare(`
      SELECT COALESCE(AVG(total_amount), 0) as average
      FROM sales 
      WHERE DATE(created_at) = DATE('now')
    `);
    const result = stmt.get();
    return result.average || 0;
  } catch (error) {
    console.error('❌ Erro em averageTicket:', error);
    return 0;
  }
}

function totalProductsCount() {
  try {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM products WHERE is_active = 1`);
    const result = stmt.get();
    return result.count || 0;
  } catch (error) {
    console.error('❌ Erro em totalProductsCount:', error);
    return 0;
  }
}

function totalCustomersCount() {
  try {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM customers WHERE is_active = 1`);
    const result = stmt.get();
    return result.count || 0;
  } catch (error) {
    console.error('❌ Erro em totalCustomersCount:', error);
    return 0;
  }
}

function salesByCategoryCount() {
  try {
    const stmt = db.prepare(`
      SELECT c.name, COUNT(s.id) as count
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE DATE(s.created_at) = DATE('now')
      GROUP BY c.id, c.name
    `);
    return stmt.all();
  } catch (error) {
    console.error('❌ Erro em salesByCategoryCount:', error);
    return [];
  }
}

// ✅ ROTA DE ESTATÍSTICAS CORRIGIDA
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    console.log('📊 Buscando estatísticas do dashboard...');

    const [todaySales, monthSales, topProduct, lowStock] = await Promise.all([
      Promise.resolve(salesToday()),
      Promise.resolve(salesThisMonth()),
      Promise.resolve(topProducts()),
      Promise.resolve(lowStockProducts())
    ]);

    res.json({
      success: true,
      data: {
        sales_today: todaySales,
        sales_month: monthSales,
        top_product: topProduct,
        low_stock: lowStock
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas do dashboard'
    });
  }
});

// ✅ ROTA DE MÉTRICAS CORRIGIDA
router.get('/metrics', authMiddleware, async (req, res) => {
  try {
    console.log('📈 Buscando métricas do dashboard...');

    const [avgTicket, totalProducts, totalCustomers, salesByCategory] = await Promise.all([
      Promise.resolve(averageTicket()),
      Promise.resolve(totalProductsCount()),
      Promise.resolve(totalCustomersCount()),
      Promise.resolve(salesByCategoryCount())
    ]);

    res.json({
      success: true,
      data: {
        average_ticket: avgTicket,
        total_products: totalProducts,
        total_customers: totalCustomers,
        sales_by_category: salesByCategory
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar métricas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar métricas'
    });
  }
});

module.exports = router;