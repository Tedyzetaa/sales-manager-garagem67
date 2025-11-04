const express = require('express');
const router = express.Router();
const SyncService = require('../services/syncService');

// ✅ CORREÇÃO: Instanciar o SyncService uma única vez
const syncService = new SyncService();

// Rota de sincronização de clientes
router.post('/customers/full-sync', async (req, res) => {
  try {
    console.log('🔄 Iniciando sincronização completa de clientes...');
    
    const result = await syncService.syncCustomersReal();
    
    res.json({
      success: true,
      message: 'Sincronização concluída com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rota de sincronização rápida
router.post('/customers/quick-sync', async (req, res) => {
  try {
    console.log('⚡ Iniciando sincronização rápida...');
    
    const result = await syncService.quickSyncGaragem67();
    
    res.json({
      success: true,
      message: 'Sincronização rápida concluída',
      data: result
    });
  } catch (error) {
    console.error('❌ Erro na sincronização rápida:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rota de status da sincronização
router.get('/status', (req, res) => {
  try {
    const status = syncService.getSyncStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Erro ao buscar status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rota para gerar JSON do Entregador67
router.get('/generate-json', async (req, res) => {
  try {
    console.log('📄 Gerando JSON para Entregador67...');
    
    const jsonData = await syncService.generateEntregador67Json();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=entregador67_customers.json');
    
    res.json(jsonData);
  } catch (error) {
    console.error('❌ Erro ao gerar JSON:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rota de teste
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Rota de sync funcionando!',
    service: 'Sync Service',
    status: syncService.getSyncStatus()
  });
});

module.exports = router;