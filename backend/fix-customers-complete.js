// backend/fix-customers-complete.js
const Database = require('better-sqlite3');
const path = require('path');

console.log('👥 CORREÇÃO ESPECÍFICA - TABELA CUSTOMERS');
console.log('📅', new Date().toISOString());

class CustomersFixer {
  constructor() {
    this.dbPath = path.join(__dirname, 'database.sqlite');
    this.db = new Database(this.dbPath);
  }

  tableExists(tableName) {
    const result = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
    ).get(tableName);
    return !!result;
  }

  getCurrentCustomersStructure() {
    console.log('\n🔍 ESTRUTURA ATUAL DA TABELA CUSTOMERS:');
    
    const columns = this.db.prepare('PRAGMA table_info(customers)').all();
    
    if (columns.length === 0) {
      console.log('❌ Tabela customers não encontrada!');
      return [];
    }
    
    columns.forEach(col => {
      console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    return columns.map(col => col.name);
  }

  addUpdatedAtColumn() {
    console.log('\n➕ ADICIONANDO COLUNA UPDATED_AT...');
    
    try {
      // SQLite não permite valor padrão com datetime() no ALTER TABLE
      this.db.exec('ALTER TABLE customers ADD COLUMN updated_at TEXT');
      console.log('✅ Coluna updated_at adicionada com sucesso!');
      
      // Agora preenchemos os valores existentes
      console.log('🔄 Preenchendo valores existentes...');
      const stmt = this.db.prepare("UPDATE customers SET updated_at = datetime('now') WHERE updated_at IS NULL");
      const result = stmt.run();
      
      console.log(`✅ ${result.changes} registros atualizados com updated_at`);
      return true;
      
    } catch (error) {
      console.log('❌ Erro ao adicionar coluna updated_at:', error.message);
      return false;
    }
  }

  addMissingColumns() {
    console.log('\n🔧 VERIFICANDO COLUNAS FALTANTES...');
    
    const expectedColumns = [
      { name: 'document', definition: 'document TEXT' },
      { name: 'birth_date', definition: 'birth_date TEXT' },
      { name: 'notes', definition: 'notes TEXT' }
    ];
    
    const currentColumns = this.getCurrentCustomersStructure();
    
    expectedColumns.forEach(column => {
      if (!currentColumns.includes(column.name)) {
        try {
          this.db.exec(`ALTER TABLE customers ADD COLUMN ${column.definition}`);
          console.log(`✅ Coluna ${column.name} adicionada`);
        } catch (error) {
          console.log(`❌ Erro ao adicionar coluna ${column.name}:`, error.message);
        }
      } else {
        console.log(`ℹ️ Coluna ${column.name} já existe`);
      }
    });
  }

  backupCustomersData() {
    console.log('\n💾 CRIANDO BACKUP DOS DADOS...');
    
    try {
      // Cria tabela de backup se não existir
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS customers_backup (
          id INTEGER PRIMARY KEY,
          name TEXT,
          email TEXT,
          phone TEXT,
          address TEXT,
          created_at TEXT,
          is_active INTEGER,
          backup_timestamp TEXT DEFAULT (datetime('now'))
        )
      `);
      
      // Copia dados para backup
      const backupStmt = this.db.prepare(`
        INSERT INTO customers_backup (id, name, email, phone, address, created_at, is_active)
        SELECT id, name, email, phone, address, created_at, is_active FROM customers
      `);
      
      const result = backupStmt.run();
      console.log(`✅ Backup criado: ${result.changes} registros copiados para customers_backup`);
      
    } catch (error) {
      console.log('❌ Erro ao criar backup:', error.message);
    }
  }

  validateFix() {
    console.log('\n🔎 VALIDANDO CORREÇÃO...');
    
    try {
      // Testa inserção com todas as colunas
      const testStmt = this.db.prepare(`
        INSERT INTO customers (name, email, phone, address, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `);
      
      const result = testStmt.run(
        'Cliente Teste - ' + Date.now(),
        'teste@exemplo.com',
        '(11) 99999-9999',
        'Endereço de teste'
      );
      
      console.log(`✅ Teste de inserção bem-sucedido! ID: ${result.lastInsertRowid}`);
      
      // Remove o registro de teste
      this.db.prepare('DELETE FROM customers WHERE id = ?').run(result.lastInsertRowid);
      console.log('✅ Registro de teste removido');
      
      return true;
      
    } catch (error) {
      console.log('❌ Falha na validação:', error.message);
      return false;
    }
  }

  runCompleteFix() {
    console.log('🚀 INICIANDO CORREÇÃO COMPLETA DA TABELA CUSTOMERS\n');
    
    if (!this.tableExists('customers')) {
      console.log('💥 ERRO: Tabela customers não existe!');
      this.close();
      return false;
    }
    
    // Backup primeiro
    this.backupCustomersData();
    
    // Mostra estrutura atual
    this.getCurrentCustomersStructure();
    
    // Aplica correções
    this.addUpdatedAtColumn();
    this.addMissingColumns();
    
    // Valida
    const isValid = this.validateFix();
    
    // Mostra estrutura final
    console.log('\n📋 ESTRUTURA FINAL:');
    this.getCurrentCustomersStructure();
    
    if (isValid) {
      console.log('\n🎉 CORREÇÃO DOS CUSTOMERS CONCLUÍDA COM SUCESSO!');
    } else {
      console.log('\n⚠️  Correção concluída com avisos. Verifique os logs.');
    }
    
    return isValid;
  }

  close() {
    this.db.close();
    console.log('\n🔒 Conexão com o banco fechada.');
  }
}

// Execução
try {
  const fixer = new CustomersFixer();
  const success = fixer.runCompleteFix();
  fixer.close();
  
  if (success) {
    console.log('\n🔄 Reinicie o servidor para aplicar as mudanças.');
    console.log('👥 Funcionalidade de clientes agora deve funcionar corretamente!');
  } else {
    process.exit(1);
  }
  
} catch (error) {
  console.log('💥 ERRO CRÍTICO:', error.message);
  process.exit(1);
}