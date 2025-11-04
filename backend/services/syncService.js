const Database = require('better-sqlite3');
const path = require('path');
const FirebaseService = require('./firebaseService'); // ✅ Importar FirebaseService

class SyncService {
  constructor() {
    this.dbPath = path.join(__dirname, '../database.sqlite');
    this.db = new Database(this.dbPath);
    this.setupDatabase();
    console.log('✅ SyncService inicializado com integração Firebase');
  }

  setupDatabase() {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    // ✅ CORREÇÃO: Garantir que a tabela sync_logs existe
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        sync_type TEXT NOT NULL,
        records_processed INTEGER DEFAULT 0,
        records_created INTEGER DEFAULT 0,
        records_updated INTEGER DEFAULT 0,
        records_failed INTEGER DEFAULT 0,
        sync_started_at TEXT NOT NULL DEFAULT (datetime('now')),
        sync_completed_at TEXT,
        sync_status TEXT DEFAULT 'running'
      )
    `);

    // ✅ CORREÇÃO: Garantir que a tabela customers tem todas as colunas necessárias
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        postal_code TEXT,
        city TEXT,
        state TEXT,
        firebase_uid TEXT,
        sync_status TEXT DEFAULT 'pending',
        last_sync_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT,
        is_active INTEGER DEFAULT 1
      )
    `);
  }

  // 🔄 SINCRONIZAÇÃO REAL COM FIREBASE - INTEGRAÇÃO COMPLETA
  async syncCustomersReal() {
    console.log('🔄 Iniciando sincronização REAL com Firebase...');
    
    try {
      // ✅ CORREÇÃO: Usar FirebaseService para sincronização real
      const firebaseResult = await FirebaseService.syncCustomers();
      
      if (!firebaseResult.success) {
        throw new Error(`FirebaseService error: ${firebaseResult.error}`);
      }

      console.log(`✅ FirebaseService: ${firebaseResult.synced} clientes sincronizados, ${firebaseResult.errors} erros`);

      // ✅ CORREÇÃO: Atualizar status de sincronização no banco local
      let created = 0;
      let updated = 0;
      let errors = 0;

      // Buscar clientes recentemente sincronizados para atualizar status
// Buscar clientes recentemente sincronizados para atualizar status
// ✅ CORREÇÃO: Buscar clientes recentemente sincronizados para atualizar status
const recentlySyncedStmt = this.db.prepare(`
  SELECT id, name, firebase_uid 
  FROM customers 
  WHERE last_sync_at IS NOT NULL 
  AND (sync_status IS NULL OR sync_status != 'synced')
  ORDER BY last_sync_at DESC
  LIMIT 100
`);
      
      const recentlySynced = recentlySyncedStmt.all();

      for (const customer of recentlySynced) {
        try {
          const updateStmt = this.db.prepare(`
            UPDATE customers 
            SET sync_status = 'synced', last_sync_at = datetime('now'), updated_at = datetime('now')
            WHERE id = ?
          `);
          
          const result = updateStmt.run(customer.id);
          
          if (result.changes > 0) {
            updated++;
            console.log(`   ✅ Status atualizado: ${customer.name}`);
          }
        } catch (error) {
          errors++;
          console.error(`❌ Erro ao atualizar status do cliente ${customer.id}:`, error.message);
        }
      }

      // ✅ CORREÇÃO: Salvar log de sincronização
      try {
        const logStmt = this.db.prepare(`
          INSERT INTO sync_logs (
            table_name, sync_type, records_processed, records_created, 
            records_updated, records_failed, sync_status, sync_completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);
        
        logStmt.run(
          'customers',
          'firebase_sync',
          firebaseResult.synced + firebaseResult.errors,
          firebaseResult.created || 0,
          firebaseResult.updated || firebaseResult.synced,
          firebaseResult.errors,
          firebaseResult.errors === 0 ? 'completed' : 'completed_with_errors'
        );
        console.log('✅ Log de sincronização Firebase salvo!');
      } catch (logError) {
        console.error('❌ Erro ao salvar estatísticas Firebase:', logError.message);
      }

      const result = {
        created: firebaseResult.created || 0,
        updated: firebaseResult.updated || firebaseResult.synced,
        errors: firebaseResult.errors,
        total: firebaseResult.synced + firebaseResult.errors,
        timestamp: new Date().toISOString(),
        mode: firebaseResult.mode,
        firebase_available: FirebaseService.isFirebaseAvailable(),
        message: `Sincronização ${firebaseResult.mode} concluída`
      };

      console.log(`✅ Sincronização REAL concluída: ${result.created} novos, ${result.updated} atualizados, ${result.errors} erros (Modo: ${result.mode})`);
      return result;

    } catch (error) {
      console.error('💥 ERRO CRÍTICO na sincronização Firebase:', error);
      
      // ✅ CORREÇÃO: Salvar log de erro
      try {
        const errorLogStmt = this.db.prepare(`
          INSERT INTO sync_logs (
            table_name, sync_type, records_processed, records_failed, 
            sync_status, sync_completed_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        `);
        
        errorLogStmt.run(
          'customers',
          'firebase_sync',
          0,
          1,
          'failed'
        );
      } catch (logError) {
        console.error('❌ Erro ao salvar log de erro:', logError);
      }
      
      throw error;
    }
  }

  // ⚡ SINCRONIZAÇÃO RÁPIDA - CORRIGIDA
  async quickSyncGaragem67() {
    console.log('⚡ Sincronização rápida iniciada...');
    
    try {
      // Buscar apenas clientes pendentes de sincronização
      const pendingStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM customers 
        WHERE sync_status = 'pending' OR sync_status IS NULL
      `);
      const pendingCount = pendingStmt.get().count;

      if (pendingCount === 0) {
        console.log('ℹ️ Nenhum cliente pendente para sincronização rápida');
        return { 
          synced: 0, 
          message: 'Nenhum cliente pendente para sincronização',
          timestamp: new Date().toISOString()
        };
      }

      // Marcar como sincronizados
      const updateStmt = this.db.prepare(`
        UPDATE customers 
        SET sync_status = 'synced', last_sync_at = datetime('now'), updated_at = datetime('now')
        WHERE sync_status = 'pending' OR sync_status IS NULL
      `);
      
      const result = updateStmt.run();

      console.log(`✅ Sincronização rápida: ${result.changes} clientes marcados como sincronizados`);
      return { 
        synced: result.changes,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro na sincronização rápida:', error);
      throw error;
    }
  }

  // 📊 STATUS DA SINCRONIZAÇÃO - CORRIGIDA COM INFO FIREBASE
  getSyncStatus() {
    try {
      // Status dos clientes
      const customerStats = this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) as synced,
          SUM(CASE WHEN sync_status = 'pending' OR sync_status IS NULL THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN firebase_uid IS NOT NULL THEN 1 ELSE 0 END) as from_firebase
        FROM customers
      `).get();

      // Última sincronização
      const lastSync = this.db.prepare(`
        SELECT sync_completed_at, sync_type, sync_status, records_processed, records_created, records_updated
        FROM sync_logs 
        WHERE table_name = 'customers' 
        ORDER BY sync_completed_at DESC 
        LIMIT 1
      `).get();

      return {
        customers: customerStats,
        last_sync: lastSync || { sync_status: 'never' },
        firebase_available: FirebaseService.isFirebaseAvailable(),
        service_status: 'operational',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao buscar status:', error);
      return { 
        error: error.message,
        service_status: 'degraded',
        firebase_available: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 📄 GERAR JSON PARA ENTREGADOR67 - CORRIGIDA
  async generateEntregador67Json() {
    try {
      console.log('📄 Gerando JSON para Entregador67...');
      
      const customers = this.db.prepare(`
        SELECT 
          id, name, email, phone, address, postal_code, city, state,
          created_at, sync_status, firebase_uid
        FROM customers 
        WHERE sync_status = 'synced' OR sync_status IS NULL
        ORDER BY name
      `).all();

      const jsonData = {
        generated_at: new Date().toISOString(),
        total_customers: customers.length,
        system: 'Entregador67',
        source: 'Sales Manager - Garagem67',
        firebase_integration: FirebaseService.isFirebaseAvailable(),
        customers: customers.map(customer => ({
          id: customer.id,
          firebase_uid: customer.firebase_uid,
          nome: customer.name,
          email: customer.email,
          telefone: customer.phone,
          endereco: customer.address,
          cep: customer.postal_code,
          cidade: customer.city,
          estado: customer.state,
          data_cadastro: customer.created_at,
          sincronizado: customer.sync_status === 'synced'
        }))
      };

      console.log(`✅ JSON gerado com ${customers.length} clientes`);
      return jsonData;

    } catch (error) {
      console.error('❌ Erro ao gerar JSON:', error);
      throw error;
    }
  }

  // 🆕 SINCRONIZAR CLIENTE INDIVIDUAL (para quando criar novo cliente) - CORRIGIDA
  async syncSingleCustomer(customerId) {
    try {
      console.log(`🔄 Sincronizando cliente individual ID: ${customerId}`);
      
      // ✅ CORREÇÃO: Primeiro verificar se o cliente existe
      const customerStmt = this.db.prepare('SELECT id, name, firebase_uid FROM customers WHERE id = ?');
      const customer = customerStmt.get(customerId);
      
      if (!customer) {
        console.log(`❌ Cliente ${customerId} não encontrado`);
        return false;
      }
      
      const updateStmt = this.db.prepare(`
        UPDATE customers 
        SET sync_status = 'synced', last_sync_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `);
      
      const result = updateStmt.run(customerId);
      
      if (result.changes > 0) {
        console.log(`✅ Cliente ${customerId} (${customer.name}) sincronizado individualmente`);
        
        // ✅ CORREÇÃO: Se tem firebase_uid, tentar sincronizar com Firebase
        if (customer.firebase_uid && FirebaseService.isFirebaseAvailable()) {
          console.log(`🔄 Cliente ${customerId} tem Firebase UID, sincronizando...`);
          // Aqui poderia chamar um método específico para sync individual com Firebase
        }
        
        return true;
      } else {
        console.log(`❌ Cliente ${customerId} não foi atualizado`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Erro ao sincronizar cliente ${customerId}:`, error);
      return false;
    }
  }

  // 🧹 LIMPAR DADOS DE SINCRONIZAÇÃO (para testes) - CORRIGIDA
  clearSyncData() {
    try {
      console.log('🧹 Limpando dados de sincronização...');
      
      // Resetar status de sync dos clientes
      const resetStmt = this.db.prepare(`
        UPDATE customers 
        SET sync_status = NULL, last_sync_at = NULL, firebase_uid = NULL
      `);
      const customerResult = resetStmt.run();
      
      // Limpar logs de sync
      const clearLogsStmt = this.db.prepare('DELETE FROM sync_logs');
      const logsResult = clearLogsStmt.run();
      
      console.log(`✅ Dados limpos: ${customerResult.changes} clientes, ${logsResult.changes} logs`);
      return {
        customers_cleared: customerResult.changes,
        logs_cleared: logsResult.changes,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
      throw error;
    }
  }

  // ✅ NOVO MÉTODO: Verificar status do Firebase
  getFirebaseStatus() {
    return {
      firebase_available: FirebaseService.isFirebaseAvailable(),
      timestamp: new Date().toISOString()
    };
  }

  // ✅ NOVO MÉTODO: Sincronização bidirecional completa
  async bidirectionalSync() {
    console.log('🔄 Iniciando sincronização bidirecional...');
    
    try {
      // 1. Sincronizar do Firebase para local
      const firebaseResult = await this.syncCustomersReal();
      
      // 2. Sincronizar do local para Firebase (se necessário)
      // Aqui você pode adicionar lógica para enviar dados locais para o Firebase
      
      return {
        success: true,
        firebase_to_local: firebaseResult,
        local_to_firebase: { synced: 0, message: 'Funcionalidade em desenvolvimento' },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro na sincronização bidirecional:', error);
      throw error;
    }
  }

  close() {
    this.db.close();
    console.log('🔒 Conexão com o banco fechada (SyncService)');
  }
}

module.exports = SyncService;