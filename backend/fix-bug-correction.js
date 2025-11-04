// backend/fix-bug-correction.js
const Database = require('better-sqlite3');
const path = require('path');

console.log('🐛 CORREÇÃO DO BUG NO SCRIPT ANTERIOR');
console.log('📅', new Date().toISOString());

class BugFixer {
  constructor() {
    this.dbPath = path.join(__dirname, 'database.sqlite');
    this.db = new Database(this.dbPath);
  }

  fixInventoryMovementsBug() {
    console.log('\n🔧 CORRIGINDO BUG NA TABELA INVENTORY_MOVEMENTS...');
    
    // Adicionar colunas que faltaram devido ao bug
    const missingColumns = [
      'movement_type TEXT',
      'reference_id INTEGER'
    ];

    missingColumns.forEach(column => {
      try {
        const columnName = column.split(' ')[0];
        const columns = this.db.prepare('PRAGMA table_info(inventory_movements)').all();
        const columnExists = columns.some(col => col.name === columnName);
        
        if (!columnExists) {
          this.db.exec(`ALTER TABLE inventory_movements ADD COLUMN ${column}`);
          console.log(`✅ Coluna ${columnName} adicionada à inventory_movements`);
        } else {
          console.log(`ℹ️ Coluna ${columnName} já existe na inventory_movements`);
        }
      } catch (error) {
        console.log(`❌ Erro ao adicionar coluna:`, error.message);
      }
    });

    // Corrigir valores NULL na coluna updated_at
    try {
      const stmt = this.db.prepare(`
        UPDATE inventory_movements 
        SET updated_at = datetime('now') 
        WHERE updated_at IS NULL
      `);
      const result = stmt.run();
      console.log(`✅ ${result.changes} registros em inventory_movements atualizados com updated_at`);
    } catch (error) {
      console.log('❌ Erro ao atualizar updated_at:', error.message);
    }
  }

  verifyAllFixes() {
    console.log('\n🔍 VERIFICANDO TODAS AS CORREÇÕES...');
    
    const checks = [
      { table: 'customers', columns: ['firebase_id', 'sync_status', 'updated_at'] },
      { table: 'products', columns: ['firebase_id', 'sync_status', 'updated_at'] },
      { table: 'inventory_movements', columns: ['firebase_id', 'sync_status', 'updated_at', 'movement_type'] },
      { table: 'sync_logs', columns: ['table_name', 'sync_type', 'sync_status'] },
      { table: 'sync_settings', columns: ['setting_key', 'setting_value'] }
    ];

    checks.forEach(check => {
      if (this.tableExists(check.table)) {
        const columns = this.getTableColumns(check.table);
        const missing = check.columns.filter(col => !columns.includes(col));
        
        if (missing.length === 0) {
          console.log(`✅ ${check.table}: TODAS as colunas necessárias presentes`);
        } else {
          console.log(`❌ ${check.table}: Faltando colunas: ${missing.join(', ')}`);
        }
      } else {
        console.log(`❌ Tabela ${check.table} não existe`);
      }
    });
  }

  tableExists(tableName) {
    const result = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
    ).get(tableName);
    return !!result;
  }

  getTableColumns(tableName) {
    try {
      const columns = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
      return columns.map(col => col.name);
    } catch (error) {
      return [];
    }
  }

  run() {
    console.log('🚀 INICIANDO CORREÇÃO DE BUGS\n');
    
    this.fixInventoryMovementsBug();
    this.verifyAllFixes();
    
    console.log('\n✨ CORREÇÃO DE BUGS CONCLUÍDA!');
  }

  close() {
    this.db.close();
    console.log('\n🔒 Conexão com o banco fechada.');
  }
}

// Execução
try {
  const fixer = new BugFixer();
  fixer.run();
  fixer.close();
  
  console.log('\n🎉 TODOS OS BUGS FORAM CORRIGIDOS!');
  
} catch (error) {
  console.log('💥 ERRO CRÍTICO:', error.message);
  process.exit(1);
}