// backend/fix-all-database-issues.js
const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 INICIANDO CORREÇÃO GERAL DO BANCO DE DADOS...');
console.log('📅', new Date().toISOString());

class DatabaseFixer {
  constructor() {
    this.dbPath = path.join(__dirname, 'database.sqlite');
    this.db = new Database(this.dbPath);
    this.setupPragmas();
  }

  setupPragmas() {
    // Configurações para melhor performance e compatibilidade
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

  updateExistingRecords(tableName, columnName, defaultValue) {
    try {
      const stmt = this.db.prepare(`UPDATE ${tableName} SET ${columnName} = ? WHERE ${columnName} IS NULL`);
      const result = stmt.run(defaultValue);
      console.log(`✅ ${result.changes} registros atualizados na tabela ${tableName} (${columnName})`);
      return result.changes;
    } catch (error) {
      console.log(`❌ Erro ao atualizar registros na tabela ${tableName}:`, error.message);
      return 0;
    }
  }

  fixCustomersTable() {
    console.log('\n📋 CORRIGINDO TABELA CUSTOMERS...');
    
    if (!this.tableExists('customers')) {
      console.log('❌ Tabela customers não existe!');
      return false;
    }

    // Adicionar coluna updated_at
    this.addColumn('customers', 'updated_at TEXT');
    
    // Preencher registros existentes
    this.updateExistingRecords('customers', 'updated_at', "datetime('now')");
    
    console.log('✅ Tabela customers corrigida com sucesso!');
    return true;
  }

  fixProductsTable() {
    console.log('\n📦 CORRIGINDO TABELA PRODUCTS...');
    
    if (!this.tableExists('products')) {
      console.log('❌ Tabela products não existe!');
      return false;
    }

    // Colunas que devem existir na tabela products
    const expectedColumns = [
      'updated_at TEXT',
      'category TEXT',
      'supplier TEXT',
      'cost_price REAL',
      'min_stock INTEGER DEFAULT 0'
    ];

    expectedColumns.forEach(column => {
      this.addColumn('products', column);
    });

    // Preencher valores padrão
    this.updateExistingRecords('products', 'updated_at', "datetime('now')");
    this.updateExistingRecords('products', 'min_stock', 0);

    console.log('✅ Tabela products corrigida com sucesso!');
    return true;
  }

  fixSalesTable() {
    console.log('\n💰 CORRIGINDO TABELA SALES...');
    
    if (!this.tableExists('sales')) {
      console.log('❌ Tabela sales não existe!');
      return false;
    }

    const expectedColumns = [
      'updated_at TEXT',
      'payment_method TEXT DEFAULT "cash"',
      'status TEXT DEFAULT "completed"',
      'discount REAL DEFAULT 0'
    ];

    expectedColumns.forEach(column => {
      this.addColumn('sales', column);
    });

    this.updateExistingRecords('sales', 'updated_at', "datetime('now')");

    console.log('✅ Tabela sales corrigida com sucesso!');
    return true;
  }

  fixInventoryTable() {
    console.log('\n📊 CORRIGINDO TABELA INVENTORY...');
    
    if (!this.tableExists('inventory_movements')) {
      console.log('❌ Tabela inventory_movements não existe!');
      return false;
    }

    const expectedColumns = [
      'updated_at TEXT',
      'movement_type TEXT NOT NULL',
      'reference_id INTEGER'
    ];

    expectedColumns.forEach(column => {
      this.addColumn('inventory_movements', column);
    });

    this.updateExistingRecords('inventory_movements', 'updated_at', "datetime('now')");

    console.log('✅ Tabela inventory_movements corrigida com sucesso!');
    return true;
  }

  createMissingTables() {
    console.log('\n🏗️ VERIFICANDO TABELAS FALTANTES...');
    
    const tablesToCreate = [
      {
        name: 'suppliers',
        sql: `
          CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_person TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT,
            is_active INTEGER DEFAULT 1
          )
        `
      },
      {
        name: 'categories',
        sql: `
          CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT
          )
        `
      }
    ];

    tablesToCreate.forEach(table => {
      if (!this.tableExists(table.name)) {
        try {
          this.db.exec(table.sql);
          console.log(`✅ Tabela ${table.name} criada com sucesso!`);
        } catch (error) {
          console.log(`❌ Erro ao criar tabela ${table.name}:`, error.message);
        }
      } else {
        console.log(`ℹ️ Tabela ${table.name} já existe`);
      }
    });
  }

  runAllFixes() {
    console.log('🚀 EXECUTANDO TODAS AS CORREÇÕES...\n');
    
    this.fixCustomersTable();
    this.fixProductsTable();
    this.fixSalesTable();
    this.fixInventoryTable();
    this.createMissingTables();
    
    console.log('\n✨ CORREÇÃO GERAL CONCLUÍDA!');
    this.printDatabaseSummary();
  }

  printDatabaseSummary() {
    console.log('\n📊 RESUMO DO BANCO DE DADOS:');
    
    const tables = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all();
    
    tables.forEach(table => {
      const columns = this.getTableColumns(table.name);
      console.log(`\n📋 ${table.name}: ${columns.length} colunas`);
      console.log(`   Colunas: ${columns.join(', ')}`);
    });
  }

  close() {
    this.db.close();
    console.log('\n🔒 Conexão com o banco fechada.');
  }
}

// Execução do script
try {
  const fixer = new DatabaseFixer();
  fixer.runAllFixes();
  fixer.close();
  
  console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('🔄 Reinicie o servidor para aplicar as mudanças.');
  
} catch (error) {
  console.log('💥 ERRO CRÍTICO:', error.message);
  process.exit(1);
}