const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const InventoryService = require('../services/inventoryService');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Buscar relatório de estoque completo
router.get('/', async (req, res) => {
  try {
    const report = await InventoryService.getInventoryReport();
    res.json({
      success: true,
      ...report
    });
  } catch (error) {
    console.error('Erro ao buscar relatório de estoque:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar relatório de estoque'
    });
  }
});

// Buscar movimentações de estoque
router.get('/movements', async (req, res) => {
  try {
    const { product_id, type, start_date, end_date, page = 1, limit = 50 } = req.query;
    
    const movements = await InventoryService.getStockMovements({
      product_id,
      type,
      start_date,
      end_date,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      ...movements
    });
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar movimentações de estoque'
    });
  }
});

// Buscar produtos com estoque baixo
router.get('/low-stock', async (req, res) => {
  try {
    const products = await InventoryService.getLowStockProducts();
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Erro ao buscar produtos com estoque baixo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar produtos com estoque baixo'
    });
  }
});

// Atualizar estoque de um produto
router.post('/:productId/stock', async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, type, reason } = req.body;

    if (!quantity || !type || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Quantidade, tipo e motivo são obrigatórios'
      });
    }

    const result = await InventoryService.updateStock(
      parseInt(productId),
      parseInt(quantity),
      type,
      reason,
      req.user.userId
    );

    res.json({
      success: true,
      message: 'Estoque atualizado com sucesso',
      data: result
    });
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atualizar estoque'
    });
  }
});

// Criar nova movimentação de estoque
router.post('/movements', async (req, res) => {
  try {
    const { product_id, type, quantity, reason } = req.body;

    if (!product_id || !type || !quantity || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Produto, tipo, quantidade e motivo são obrigatórios'
      });
    }

    const result = await InventoryService.updateStock(
      parseInt(product_id),
      parseInt(quantity),
      type,
      reason,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: 'Movimentação registrada com sucesso',
      data: result
    });
  } catch (error) {
    console.error('Erro ao criar movimentação:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao criar movimentação'
    });
  }
});

// Buscar estatísticas de estoque
router.get('/stats', async (req, res) => {
  try {
    const report = await InventoryService.getInventoryReport();
    
    const stats = {
      totalProducts: report.totals.totalProducts,
      totalStock: report.totals.totalStock,
      totalValue: report.totals.totalCostValue,
      lowStockCount: report.totals.lowStockItems,
      outOfStockCount: report.totals.outOfStockItems
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas de estoque'
    });
  }
});

module.exports = router;