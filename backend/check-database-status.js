// backend/check-database-status.js
const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 VERIFICADOR DE STATUS DO BANCO DE DADOS');
console.log('📅', new Date().toISOString());

class DatabaseChecker {
  constructor() {
    this.dbPath = path.join(__dirname, 'database.sqlite');
    this.db = new Database(this.dbPath);
  }

  checkAllTables() {
    console.log('\n📊 TABELAS EXISTENTES:');
    
    const tables = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all();
    
    console.log(`📋 Total de tabelas: ${tables.length}`);
    
    tables.forEach(table => {
      this.checkTableStructure(table.name);
    });
    
    return tables.length > 0;
  }

  checkTableStructure(tableName) {
    try {
      const columns = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
      const rowCount = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
      
      console.log(`\n📋 ${tableName.toUpperCase()} (${rowCount} registros):`);
      
      columns.forEach(col => {
        const constraints = [];
        if (col.pk) constraints.push('PRIMARY KEY');
        if (col.notnull) constraints.push('NOT NULL');
        if (col.dflt_value !== null) constraints.push(`DEFAULT ${col.dflt_value}`);
        
        console.log(`   ${col.name} (${col.type}) ${constraints.join(' ')}`);
      });
      
    } catch (error) {
      console.log(`❌ Erro ao verificar tabela ${tableName}:`, error.message);
    }
  }

  checkCommonIssues() {
    console.log('\n🔎 VERIFICANDO PROBLEMAS COMUNS:');
    
    const issues = [];
    
    // Verifica se customers tem updated_at
    const customersColumns = this.getTableColumns('customers');
    if (!customersColumns.includes('updated_at')) {
      issues.push('❌ Tabela customers não tem coluna updated_at');
    }
    
    // Verifica registros sem updated_at
    try {
      const nullUpdatedAt = this.db.prepare(
        "SELECT COUNT(*) as count FROM customers WHERE updated_at IS NULL"
      ).get().count;
      
      if (nullUpdatedAt > 0) {
        issues.push(`⚠️  ${nullUpdatedAt} registros em customers sem updated_at`);
      }
    } catch (error) {
      issues.push('❌ Não foi possível verificar registros sem updated_at');
    }
    
    if (issues.length === 0) {
      console.log('✅ Nenhum problema comum encontrado');
    } else {
      issues.forEach(issue => console.log(issue));
    }
    
    return issues;
  }

  getTableColumns(tableName) {
    try {
      const columns = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
      return columns.map(col => col.name);
    } catch (error) {
      return [];
    }
  }

  runFullCheck() {
    console.log('🔍 INICIANDO VERIFICAÇÃO COMPLETA\n');
    
    const hasTables = this.checkAllTables();
    
    if (!hasTables) {
      console.log('💥 ERRO: Nenhuma tabela encontrada no banco!');
      this.close();
      return false;
    }
    
    const issues = this.checkCommonIssues();
    
    console.log('\n📈 RESUMO DA VERIFICAÇÃO:');
    if (issues.length === 0) {
      console.log('✅ Banco de dados está saudável!');
    } else {
      console.log(`⚠️  ${issues.length} problema(s) encontrado(s)`);
      console.log('💡 Execute o script de correção: node fix-all-database-issues.js');
    }
    
    return issues.length === 0;
  }

  close() {
    this.db.close();
    console.log('\n🔒 Conexão com o banco fechada.');
  }
}

// Execução
try {
  const checker = new DatabaseChecker();
  const isHealthy = checker.runFullCheck();
  checker.close();
  
  if (!isHealthy) {
    console.log('\n🚨 Recomenda-se executar os scripts de correção!');
  }
  
} catch (error) {
  console.log('💥 ERRO AO ACESSAR BANCO:', error.message);
  console.log('📌 Verifique se o arquivo database.sqlite existe na pasta backend');
}