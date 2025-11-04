const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Relatório de vendas avançado
router.get('/sales', (req, res) => {
  const { start_date, end_date, group_by = 'day' } = req.query;

  let whereConditions = ['s.sale_status = "completed"'];
  let params = [];

  if (start_date) {
    whereConditions.push('s.sale_date >= ?');
    params.push(start_date);
  }

  if (end_date) {
    whereConditions.push('s.sale_date <= ?');
    params.push(end_date + ' 23:59:59');
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  let groupByClause;
  switch (group_by) {
    case 'month':
      groupByClause = 'STRFTIME("%Y-%m", s.sale_date)';
      break;
    case 'week':
      groupByClause = 'STRFTIME("%Y-%W", s.sale_date)';
      break;
    case 'day':
    default:
      groupByClause = 'DATE(s.sale_date)';
  }

  const query = `
    SELECT 
      ${groupByClause} as period,
      COUNT(*) as total_sales,
      SUM(s.final_amount) as total_revenue,
      AVG(s.final_amount) as average_ticket,
      COUNT(DISTINCT s.customer_firebase_uid) as unique_customers
    FROM sales s
    ${whereClause}
    GROUP BY ${groupByClause}
    ORDER BY period DESC
  `;

  db.all(query, params, (err, results) => {
    if (err) {
      console.error('Erro ao gerar relatório avançado:', err);
      return res.status(500).json({
        success: false,
        error: 'Erro ao gerar relatório'
      });
    }

    res.json({
      success: true,
      report: {
        period: { start_date, end_date, group_by },
        summary: {
          total_periods: results.length,
          total_sales: results.reduce((sum, row) => sum + row.total_sales, 0),
          total_revenue: results.reduce((sum, row) => sum + row.total_revenue, 0),
          average_ticket: results.reduce((sum, row) => sum + row.average_ticket, 0) / results.length
        },
        data: results
      }
    });
  });
});

// Analytics de produtos
router.get('/products', (req, res) => {
  const { start_date, end_date, limit = 10 } = req.query;

  let whereConditions = ['s.sale_status = "completed"'];
  let params = [];

  if (start_date) {
    whereConditions.push('s.sale_date >= ?');
    params.push(start_date);
  }

  if (end_date) {
    whereConditions.push('s.sale_date <= ?');
    params.push(end_date + ' 23:59:59');
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      p.id,
      p.name,
      p.category_name,
      SUM(si.quantity) as total_quantity,
      SUM(si.total_price) as total_revenue,
      COUNT(DISTINCT s.id) as times_sold,
      AVG(si.quantity) as avg_quantity_per_sale
    FROM sale_items si
    LEFT JOIN sales s ON si.sale_id = s.id
    LEFT JOIN products p ON si.product_id = p.id
    ${whereClause}
    GROUP BY p.id, p.name, p.category_name
    ORDER BY total_revenue DESC
    LIMIT ?
  `;

  db.all(query, [...params, parseInt(limit)], (err, results) => {
    if (err) {
      console.error('Erro ao gerar analytics de produtos:', err);
      return res.status(500).json({
        success: false,
        error: 'Erro ao gerar analytics'
      });
    }

    res.json({
      success: true,
      analytics: results
    });
  });
});

// Métricas de performance
router.get('/performance', (req, res) => {
  const { start_date, end_date } = req.query;

  let whereConditions = ['s.sale_status = "completed"'];
  let params = [];

  if (start_date) {
    whereConditions.push('s.sale_date >= ?');
    params.push(start_date);
  }

  if (end_date) {
    whereConditions.push('s.sale_date <= ?');
    params.push(end_date + ' 23:59:59');
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const queries = {
    salesByHour: `
      SELECT 
        STRFTIME("%H", s.sale_date) as hour,
        COUNT(*) as sales_count,
        SUM(s.final_amount) as revenue
      FROM sales s
      ${whereClause}
      GROUP BY STRFTIME("%H", s.sale_date)
      ORDER BY hour
    `,
    paymentMethods: `
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(final_amount) as amount,
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sales s ${whereClause})) as percentage
      FROM sales s
      ${whereClause}
      GROUP BY payment_method
      ORDER BY amount DESC
    `,
    customerMetrics: `
      SELECT 
        COUNT(DISTINCT customer_firebase_uid) as total_customers,
        COUNT(DISTINCT CASE WHEN sale_date >= DATE('now', '-30 days') THEN customer_firebase_uid END) as active_customers_30d,
        AVG(final_amount) as avg_ticket,
        MAX(final_amount) as max_ticket
      FROM sales s
      ${whereClause}
    `
  };

  const results = {};

  Promise.all(
    Object.entries(queries).map(([key, query]) => {
      return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          results[key] = rows;
          resolve();
        });
      });
    })
  )
  .then(() => {
    res.json({
      success: true,
      performance: results
    });
  })
  .catch(error => {
    console.error('Erro ao gerar métricas de performance:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar métricas'
    });
  });
});

module.exports = router;