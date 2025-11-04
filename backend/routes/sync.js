// backend/routes/sync.js - COMPLETO E CORRIGIDO
const express = require('express');
const router = express.Router();
const SyncService = require('../services/syncService');
const authMiddleware = require('../middleware/auth');

// ✅ CORREÇÃO: Instanciar o SyncService uma única vez
const syncService = new SyncService();

// 🔄 Rota de sincronização completa de clientes - COM FIREBASE INTEGRADO
router.post('/customers/full-sync', authMiddleware, async (req, res) => {
  try {
    console.log('🔄 Iniciando sincronização completa de clientes com Firebase...');
    
    const result = await syncService.syncCustomersReal();
    
    res.json({
      success: true,
      message: 'Sincronização Firebase concluída com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ Erro na sincronização Firebase:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Verifique a configuração do Firebase'
    });
  }
});

// 🔄 NOVA ROTA: Sincronização bidirecional
router.post('/bidirectional-sync', authMiddleware, async (req, res) => {
  try {
    console.log('🔄 Iniciando sincronização bidirecional...');
    
    const result = await syncService.bidirectionalSync();
    
    res.json({
      success: true,
      message: 'Sincronização bidirecional concluída',
      data: result
    });
  } catch (error) {
    console.error('❌ Erro na sincronização bidirecional:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📊 NOVA ROTA: Status do Firebase
router.get('/firebase-status', authMiddleware, (req, res) => {
  try {
    const status = syncService.getFirebaseStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Erro ao buscar status do Firebase:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ⚡ Rota de sincronização rápida - CORRIGIDA COM AUTH
router.post('/customers/quick-sync', authMiddleware, async (req, res) => {
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

// 🆕 Rota para sincronizar cliente individual - CORRIGIDA COM AUTH
router.post('/customers/:id/sync', authMiddleware, async (req, res) => {
  try {
    const customerId = req.params.id;
    console.log(`🔄 Sincronizando cliente individual ID: ${customerId}`);
    
    const success = await syncService.syncSingleCustomer(customerId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Cliente sincronizado com sucesso'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }
  } catch (error) {
    console.error('❌ Erro na sincronização individual:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📊 Rota de status da sincronização - CORRIGIDA COM AUTH
router.get('/status', authMiddleware, (req, res) => {
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

// 📄 Rota para gerar JSON do Entregador67 - CORRIGIDA COM AUTH
router.get('/generate-json', authMiddleware, async (req, res) => {
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

// 🧹 Rota para limpar dados de sync (apenas desenvolvimento) - COM AUTH
router.delete('/clear-data', authMiddleware, (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        error: 'Esta rota só está disponível em ambiente de desenvolvimento'
      });
    }
    
    const result = syncService.clearSyncData();
    
    res.json({
      success: true,
      message: 'Dados de sincronização limpos com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔍 Rota de teste - CORRIGIDA
router.get('/test', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Rota de sync funcionando!',
    service: 'Sync Service Corrigido',
    status: syncService.getSyncStatus(),
    firebase_status: syncService.getFirebaseStatus()
  });
});

// ✅ ROTA: Health check do sync service
router.get('/health', authMiddleware, (req, res) => {
  try {
    const status = syncService.getSyncStatus();
    const firebaseStatus = syncService.getFirebaseStatus();
    
    res.json({
      success: true,
      service: 'Sync Service',
      status: 'operational',
      database: 'connected',
      firebase: firebaseStatus.firebase_available ? 'connected' : 'development_mode',
      last_sync: status.last_sync,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔄 NOVA ROTA: Forçar sincronização manual
router.post('/force-sync', authMiddleware, async (req, res) => {
  try {
    console.log('⚡ Forçando sincronização manual...');
    
    const { type = 'full' } = req.body;
    
    let result;
    if (type === 'quick') {
      result = await syncService.quickSyncGaragem67();
    } else {
      result = await syncService.syncCustomersReal();
    }
    
    res.json({
      success: true,
      message: `Sincronização forçada (${type}) concluída`,
      data: result
    });
  } catch (error) {
    console.error('❌ Erro na sincronização forçada:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📊 NOVA ROTA: Estatísticas detalhadas
router.get('/statistics', authMiddleware, (req, res) => {
  try {
    const status = syncService.getSyncStatus();
    const firebaseStatus = syncService.getFirebaseStatus();
    
    // Buscar logs recentes
    const db = require('../config/database');
    const recentLogs = db.prepare(`
      SELECT * FROM sync_logs 
      ORDER BY sync_completed_at DESC 
      LIMIT 10
    `).all();
    
    res.json({
      success: true,
      data: {
        sync_status: status,
        firebase_status: firebaseStatus,
        recent_logs: recentLogs,
        summary: {
          total_customers: status.customers?.total || 0,
          synced_customers: status.customers?.synced || 0,
          pending_customers: status.customers?.pending || 0,
          firebase_customers: status.customers?.from_firebase || 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;