const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Exportar pedido para o sistema de entregadores
router.post('/sale/:saleId', async (req, res) => {
  try {
    const saleId = req.params.saleId;

    // Buscar venda completa
    const sale = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           s.*,
           u.full_name as user_name,
           GROUP_CONCAT(si.product_name || ' (' || si.quantity || 'x)') as items_description
         FROM sales s
         LEFT JOIN users u ON s.user_id = u.id
         LEFT JOIN sale_items si ON s.id = si.sale_id
         WHERE s.id = ?
         GROUP BY s.id`,
        [saleId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Venda não encontrada'
      });
    }

    // Buscar itens da venda
    const items = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM sale_items WHERE sale_id = ?',
        [saleId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    // Preparar dados para exportação no formato do entregador67
    const exportData = {
      external_id: sale.sale_code,
      store_name: "Garagem 67 Bar e Conveniência",
      store_phone: "67998668032",
      customer: {
        name: sale.customer_name || 'Cliente não identificado',
        phone: sale.customer_phone || 'Não informado',
        address: 'Retirada no local', // Pode ser ajustado conforme necessário
        complement: '',
        city: 'Ivinhema',
        state: 'MS'
      },
      items: items.map(item => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.total_price
      })),
      total: sale.final_amount,
      description: `Pedido ${sale.sale_code}: ${items.map(item => `${item.quantity}x ${item.product_name}`).join(', ')}`,
      notes: sale.notes || `Venda realizada por ${sale.user_name}`,
      metadata: {
        source: 'sales_manager',
        sale_id: sale.id,
        sale_date: sale.sale_date,
        payment_method: sale.payment_method
      }
    };

    // Enviar para o sistema de entregadores
    const entregador67Url = process.env.ENTREGADOR67_URL || 'https://entregador67-production.up.railway.app';
    
    const response = await fetch(`${entregador67Url}/api/external/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Salvar registro da exportação
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO exports (sale_id, export_data, export_status, external_id, sent_at, response_data) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            saleId,
            JSON.stringify(exportData),
            'sent',
            result.order.internal_id,
            new Date().toISOString(),
            JSON.stringify(result)
          ],
          function(err) {
            if (err) reject(err);
            resolve();
          }
        );
      });

      // Atualizar status da venda para indicar que foi exportada
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE sales SET sale_status = "completed" WHERE id = ?',
          [saleId],
          function(err) {
            if (err) reject(err);
            resolve();
          }
        );
      });

      res.json({
        success: true,
        message: 'Pedido exportado com sucesso para o sistema de entregadores',
        exportData: exportData,
        deliveryInfo: result
      });

    } else {
      throw new Error(result.message || 'Erro ao enviar para o sistema de entregadores');
    }

  } catch (error) {
    console.error('❌ Erro ao exportar pedido:', error);
    
    // Registrar falha na exportação
    try {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO exports (sale_id, export_data, export_status, response_data) 
           VALUES (?, ?, ?, ?)`,
          [
            req.params.saleId,
            JSON.stringify(req.body),
            'failed',
            JSON.stringify({ error: error.message })
          ],
          function(err) {
            if (err) console.error('Erro ao registrar falha:', err);
            resolve();
          }
        );
      });
    } catch (dbError) {
      console.error('Erro ao registrar falha no banco:', dbError);
    }

    res.status(500).json({
      success: false,
      error: 'Erro ao exportar pedido: ' + error.message
    });
  }
});

// Listar exportações
router.get('/exports', (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const offset = (page - 1) * limit;

  let whereConditions = ['1=1'];
  let params = [];

  if (status) {
    whereConditions.push('e.export_status = ?');
    params.push(status);
  }

  const whereClause = whereConditions.join(' AND ');

  db.all(
    `SELECT 
       e.*,
       s.sale_code,
       s.customer_name,
       s.final_amount,
       s.sale_date
     FROM exports e
     LEFT JOIN sales s ON e.sale_id = s.id
     WHERE ${whereClause}
     ORDER BY e.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
    (err, exports) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar exportações'
        });
      }

      // Contar total
      db.get(
        `SELECT COUNT(*) as total FROM exports e WHERE ${whereClause}`,
        params,
        (countErr, countResult) => {
          if (countErr) {
            return res.status(500).json({
              success: false,
              error: 'Erro ao contar exportações'
            });
          }

          res.json({
            success: true,
            exports,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: countResult.total,
              pages: Math.ceil(countResult.total / limit)
            }
          });
        }
      );
    }
  );
});

// Gerar relatório de vendas em JSON
router.get('/sales-report', (req, res) => {
  const { start_date, end_date, format = 'json' } = req.query;

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

  const whereClause = whereConditions.join(' AND ');

  db.all(
    `SELECT 
       s.*,
       u.full_name as user_name,
       GROUP_CONCAT(
         si.product_name || ' (' || si.quantity || 'x - R$ ' || 
         printf('%.2f', si.total_price) || ')'
       ) as items_description
     FROM sales s
     LEFT JOIN users u ON s.user_id = u.id
     LEFT JOIN sale_items si ON s.id = si.sale_id
     WHERE ${whereClause}
     GROUP BY s.id
     ORDER BY s.sale_date DESC`,
    params,
    (err, sales) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Erro ao gerar relatório'
        });
      }

      // Buscar itens detalhados para cada venda
      const fetchItems = sales.map(sale => {
        return new Promise((resolve, reject) => {
          db.all(
            'SELECT * FROM sale_items WHERE sale_id = ?',
            [sale.id],
            (err, items) => {
              if (err) reject(err);
              sale.items = items;
              resolve();
            }
          );
        });
      });

      Promise.all(fetchItems)
        .then(() => {
          const report = {
            generated_at: new Date().toISOString(),
            period: {
              start_date: start_date || 'Não especificado',
              end_date: end_date || 'Não especificado'
            },
            summary: {
              total_sales: sales.length,
              total_amount: sales.reduce((sum, sale) => sum + parseFloat(sale.final_amount), 0),
              total_items: sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
            },
            sales: sales
          };

          if (format === 'json') {
            res.json({
              success: true,
              report
            });
          } else {
            // Para outros formatos (futuramente CSV, PDF, etc.)
            res.json({
              success: true,
              message: 'Formato não implementado. Use format=json',
              report
            });
          }
        })
        .catch(error => {
          res.status(500).json({
            success: false,
            error: 'Erro ao processar relatório'
          });
        });
    }
  );
});

module.exports = router;