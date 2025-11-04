// backend/fix-sync-issues.js
const Database = require('better-sqlite3');
const path = require('path');

console.log('🔄 CORREÇÃO DE PROBLEMAS DE SINCRONIZAÇÃO');
console.log('📅', new Date().toISOString());

class SyncFixer {
  constructor() {
    this.dbPath = path.join(__dirname, 'database.sqlite');
    this.db = new Database(this.dbPath);
    this.setupPragmas();
  }

  setupPragmas() {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  tableExists(tableName) {
    try {
      const result = this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).get(tableName);
      return !!result;
    } catch (error) {
      console.log(`❌ Erro ao verificar tabela ${tableName}:`, error.message);
      return false;
    }
  }

  getTableColumns(tableName) {
    try {
      const columns = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
      return columns.map(col => col.name);
    } catch (error) {
      console.log(`❌ Erro ao obter colunas da tabela ${tableName}:`, error.message);
      return [];
    }
  }

  addColumn(tableName, columnDefinition) {
    try {
      const columns = this.getTableColumns(tableName);
      const columnName = columnDefinition.split(' ')[0];
      
      if (!columns.includes(columnName)) {
        this.db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
        console.log(`✅ Coluna ${columnName} adicionada à tabela ${tableName}`);
        return true;
      } else {
        console.log(`ℹ️ Coluna ${columnName} já existe na tabela ${tableName}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Erro ao adicionar coluna ${columnName} na tabela ${tableName}:`, error.message);
      return false;
    }
  }

  fixCustomersForSync() {
    console.log('\n👥 CORRIGINDO TABELA CUSTOMERS PARA SINCRONIZAÇÃO...');
    
    if (!this.tableExists('customers')) {
      console.log('❌ Tabela customers não existe!');
      return false;
    }

    // Colunas necessárias para sincronização
    const syncColumns = [
      'firebase_id TEXT',
      'external_id TEXT',
      'sync_status TEXT DEFAULT "pending"',
      'last_sync_at TEXT',
      'is_active INTEGER DEFAULT 1'
    ];

    syncColumns.forEach(column => {
      this.addColumn('customers', column);
    });

    console.log('✅ Tabela customers preparada para sincronização!');
    return true;
  }

  fixProductsForSync() {
    console.log('\n📦 CORRIGINDO TABELA PRODUCTS PARA SINCRONIZAÇÃO...');
    
    if (!this.tableExists('products')) {
      console.log('❌ Tabela products não existe!');
      return false;
    }

    const syncColumns = [
      'firebase_id TEXT',
      'external_id TEXT', 
      'sync_status TEXT DEFAULT "pending"',
      'last_sync_at TEXT',
      'barcode TEXT',
      'sku TEXT'
    ];

    syncColumns.forEach(column => {
      this.addColumn('products', column);
    });

    console.log('✅ Tabela products preparada para sincronização!');
    return true;
  }

  createSyncLogsTable() {
    console.log('\n📊 CRIANDO TABELA DE LOGS DE SINCRONIZAÇÃO...');
    
    const sql = `
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
        sync_status TEXT DEFAULT 'running',
        error_message TEXT,
        details TEXT
      )
    `;

    try {
      this.db.exec(sql);
      console.log('✅ Tabela sync_logs criada com sucesso!');
      
      // Criar índice para melhor performance
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_sync_logs_table_name ON sync_logs(table_name)');
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_status ON sync_logs(sync_status)');
      console.log('✅ Índices da sync_logs criados!');
      
    } catch (error) {
      console.log('❌ Erro ao criar tabela sync_logs:', error.message);
    }
  }

  createSyncSettingsTable() {
    console.log('\n⚙️ CRIANDO TABELA DE CONFIGURAÇÕES DE SINCRONIZAÇÃO...');
    
    const sql = `
      CREATE TABLE IF NOT EXISTS sync_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT,
        description TEXT,
        last_modified TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `;

    try {
      this.db.exec(sql);
      console.log('✅ Tabela sync_settings criada com sucesso!');
      
      // Inserir configurações padrão
      const defaultSettings = [
        ['sync_interval_minutes', '60', 'Intervalo de sincronização automática em minutos'],
        ['last_sync_timestamp', '', 'Timestamp da última sincronização completa'],
        ['auto_sync_enabled', '1', 'Sincronização automática habilitada (1) ou desabilitada (0)']
      ];

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO sync_settings (setting_key, setting_value, description)
        VALUES (?, ?, ?)
      `);

      defaultSettings.forEach(setting => {
        stmt.run(setting);
      });

      console.log('✅ Configurações padrão de sincronização inseridas!');
      
    } catch (error) {
      console.log('❌ Erro ao criar tabela sync_settings:', error.message);
    }
  }

  fixInventoryMovementsTable() {
    console.log('\n📊 CORRIGINDO TABELA INVENTORY_MOVEMENTS...');
    
    if (!this.tableExists('inventory_movements')) {
      console.log('❌ Tabela inventory_movements não existe!');
      return false;
    }

    const missingColumns = [
      'firebase_id TEXT',
      'external_id TEXT',
      'sync_status TEXT DEFAULT "pending"',
      'user_id INTEGER',
      'cost_price REAL'
    ];

    missingColumns.forEach(column => {
      this.addColumn('inventory_movements', column);
    });

    console.log('✅ Tabela inventory_movements corrigida!');
    return true;
  }

  fixSalesTablesForSync() {
    console.log('\n💰 CORRIGINDO TABELAS DE VENDAS PARA SINCRONIZAÇÃO...');
    
    const tablesToFix = ['sales', 'sale_items'];
    
    tablesToFix.forEach(tableName => {
      if (this.tableExists(tableName)) {
        console.log(`\n🔄 Corrigindo ${tableName}...`);
        
        const syncColumns = [
          'firebase_id TEXT',
          'external_id TEXT',
          'sync_status TEXT DEFAULT "pending"',
          'last_sync_at TEXT'
        ];

        syncColumns.forEach(column => {
          this.addColumn(tableName, column);
        });
        
        console.log(`✅ Tabela ${tableName} corrigida!`);
      }
    });
  }

  populateExistingRecords() {
    console.log('\n🔄 POPULANDO REGISTROS EXISTENTES...');
    
    try {
      // Atualizar sync_status dos registros existentes
      const tables = ['customers', 'products', 'sales', 'sale_items', 'inventory_movements'];
      
      tables.forEach(table => {
        if (this.tableExists(table)) {
          const stmt = this.db.prepare(`
            UPDATE ${table} 
            SET sync_status = 'synced', 
                last_sync_at = datetime('now')
            WHERE sync_status IS NULL 
              AND (firebase_id IS NOT NULL OR external_id IS NOT NULL)
          `);
          
          const result = stmt.run();
          console.log(`✅ ${result.changes} registros em ${table} marcados como sincronizados`);
        }
      });
      
    } catch (error) {
      console.log('❌ Erro ao popular registros existentes:', error.message);
    }
  }

  runAllFixes() {
    console.log('🚀 INICIANDO CORREÇÃO COMPLETA DE SINCRONIZAÇÃO\n');
    
    this.fixCustomersForSync();
    this.fixProductsForSync();
    this.fixInventoryMovementsTable();
    this.fixSalesTablesForSync();
    this.createSyncLogsTable();
    this.createSyncSettingsTable();
    this.populateExistingRecords();
    
    console.log('\n✨ CORREÇÃO DE SINCRONIZAÇÃO CONCLUÍDA!');
    this.printSyncStatus();
  }

  printSyncStatus() {
    console.log('\n📊 STATUS DA SINCRONIZAÇÃO:');
    
    const tables = ['customers', 'products', 'sales', 'sale_items', 'inventory_movements'];
    
    tables.forEach(table => {
      if (this.tableExists(table)) {
        try {
          const total = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
          const synced = this.db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE sync_status = 'synced'`).get().count;
          const pending = this.db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE sync_status = 'pending' OR sync_status IS NULL`).get().count;
          
          console.log(`\n📋 ${table.toUpperCase()}:`);
          console.log(`   Total: ${total} registros`);
          console.log(`   Sincronizados: ${synced}`);
          console.log(`   Pendentes: ${pending}`);
          
        } catch (error) {
          console.log(`❌ Erro ao verificar status de ${table}:`, error.message);
        }
      }
    });
  }

  close() {
    this.db.close();
    console.log('\n🔒 Conexão com o banco fechada.');
  }
}

// Execução do script
try {
  const fixer = new SyncFixer();
  fixer.runAllFixes();
  fixer.close();
  
  console.log('\n🎉 SINCRONIZAÇÃO CORRIGIDA COM SUCESSO!');
  console.log('🔄 Reinicie o servidor para aplicar as mudanças.');
  console.log('👥 Os clientes agora devem aparecer na sincronização!');
  
} catch (error) {
  console.log('💥 ERRO CRÍTICO:', error.message);
  process.exit(1);
}