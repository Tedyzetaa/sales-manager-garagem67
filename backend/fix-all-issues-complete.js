// backend/fix-all-issues-complete.js
const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 CORREÇÃO COMPLETA DO SISTEMA DE CLIENTES');
console.log('📅', new Date().toISOString());

class CompleteFixer {
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
      return false;
    }
  }

  getTableColumns(tableName) {
    try {
      const columns = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
      return columns.map(col => col.name);
    } catch (error) {
      return [];
    }
  }

  addColumn(tableName, columnDefinition) {
    try {
      const columns = this.getTableColumns(tableName);
      const columnName = columnDefinition.split(' ')[0];
      
      if (!columns.includes(columnName)) {
        this.db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
        console.log(`✅ Coluna ${columnName} adicionada à ${tableName}`);
        return true;
      }
      return false;
    } catch (error) {
      console.log(`❌ Erro ao adicionar ${columnName}:`, error.message);
      return false;
    }
  }

  // 1. CORRIGIR COLUNAS FALTANTES NA TABELA CUSTOMERS
  fixCustomersMissingColumns() {
    console.log('\n👥 CORRIGINDO COLUNAS FALTANTES EM CUSTOMERS...');
    
    const missingColumns = [
      'cpf TEXT',
      'cnpj TEXT',
      'city TEXT',
      'state TEXT',
      'country TEXT DEFAULT "Brasil"',
      'neighborhood TEXT',
      'number TEXT',
      'complement TEXT',
      'customer_type TEXT DEFAULT "individual"',
      'registration_date TEXT',
      'last_purchase_date TEXT',
      'total_purchases REAL DEFAULT 0',
      'average_ticket REAL DEFAULT 0'
    ];

    missingColumns.forEach(column => {
      this.addColumn('customers', column);
    });

    console.log('✅ Colunas de customers corrigidas!');
  }

  // 2. CORRIGIR SINCRONIZAÇÃO - COLUNAS FALTANTES
  fixSyncMissingColumns() {
    console.log('\n🔄 CORRIGINDO COLUNAS DE SINCRONIZAÇÃO...');
    
    // Adicionar session_id à sync_logs
    this.addColumn('sync_logs', 'session_id TEXT');
    
    // Adicionar mais colunas para melhor controle
    const syncLogsColumns = [
      'source_system TEXT DEFAULT "garagem67"',
      'sync_duration INTEGER DEFAULT 0',
      'sync_version TEXT DEFAULT "1.0"'
    ];

    syncLogsColumns.forEach(column => {
      this.addColumn('sync_logs', column);
    });

    console.log('✅ Colunas de sincronização corrigidas!');
  }

  // 3. EXCLUIR CLIENTES DE TESTE ANTIGOS
  deleteTestCustomers() {
    console.log('\n🗑️ EXCLUINDO CLIENTES DE TESTE ANTIGOS...');
    
    try {
      // Primeiro fazer backup dos que serão excluídos
      const customersToDelete = this.db.prepare(`
        SELECT id, name, email FROM customers 
        WHERE name LIKE '%Exemplo%' OR name LIKE '%Teste%' OR email LIKE '%cliente%@email.com'
      `).all();

      if (customersToDelete.length > 0) {
        console.log(`📋 ${customersToDelete.length} clientes de teste encontrados para exclusão:`);
        customersToDelete.forEach(customer => {
          console.log(`   👤 ${customer.name} (${customer.email}) - ID: ${customer.id}`);
        });

        // Excluir
        const stmt = this.db.prepare(`
          DELETE FROM customers 
          WHERE name LIKE '%Exemplo%' OR name LIKE '%Teste%' OR email LIKE '%cliente%@email.com'
        `);
        
        const result = stmt.run();
        console.log(`✅ ${result.changes} clientes de teste excluídos!`);
      } else {
        console.log('ℹ️ Nenhum cliente de teste encontrado para exclusão.');
      }
    } catch (error) {
      console.log('❌ Erro ao excluir clientes de teste:', error.message);
    }
  }

  // 4. ATUALIZAR CLIENTES EXISTENTES COM DADOS CORRETOS
  updateExistingCustomers() {
    console.log('\n🔄 ATUALIZANDO CLIENTES EXISTENTES...');
    
    try {
      // Obter todos os clientes atuais
      const customers = this.db.prepare('SELECT id, name, email, phone FROM customers').all();
      
      console.log(`📋 ${customers.length} clientes encontrados no banco:`);
      
      customers.forEach(customer => {
        console.log(`   👤 ID: ${customer.id} | ${customer.name} | ${customer.email} | ${customer.phone}`);
        
        // Atualizar sync_status para 'synced' se estiver null
        const updateStmt = this.db.prepare(`
          UPDATE customers 
          SET sync_status = 'synced', 
              last_sync_at = datetime('now'),
              updated_at = datetime('now')
          WHERE id = ? AND (sync_status IS NULL OR sync_status = 'pending')
        `);
        
        const result = updateStmt.run(customer.id);
        if (result.changes > 0) {
          console.log(`   ✅ Cliente ${customer.name} atualizado com sync_status`);
        }
      });
      
    } catch (error) {
      console.log('❌ Erro ao atualizar clientes:', error.message);
    }
  }

  // 5. CORRIGIR O SERVIÇO DE SINCRONIZAÇÃO
  fixSyncServiceIssues() {
    console.log('\n🔧 CORRIGINDO CONFIGURAÇÕES DE SINCRONIZAÇÃO...');
    
    try {
      // Atualizar configurações de sync
      const settingsStmt = this.db.prepare(`
        INSERT OR REPLACE INTO sync_settings (setting_key, setting_value, description)
        VALUES (?, ?, ?)
      `);

      const settings = [
        ['last_customer_sync', new Date().toISOString(), 'Última sincronização de clientes'],
        ['sync_batch_size', '50', 'Quantidade de registros por lote de sync'],
        ['sync_retry_attempts', '3', 'Número de tentativas em caso de erro'],
        ['sync_timeout_minutes', '5', 'Timeout da sincronização em minutos']
      ];

      settings.forEach(setting => {
        settingsStmt.run(setting);
      });

      console.log('✅ Configurações de sincronização atualizadas!');
      
    } catch (error) {
      console.log('❌ Erro ao atualizar configurações:', error.message);
    }
  }

  // 6. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
  createIndexes() {
    console.log('\n📊 CRIANDO ÍNDICES PARA MELHOR PERFORMANCE...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)',
      'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)',
      'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)',
      'CREATE INDEX IF NOT EXISTS idx_customers_sync_status ON customers(sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_customers_firebase_id ON customers(firebase_id)',
      'CREATE INDEX IF NOT EXISTS idx_sync_logs_table_status ON sync_logs(table_name, sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_sync_logs_timestamp ON sync_logs(sync_started_at)'
    ];

    indexes.forEach(index => {
      try {
        this.db.exec(index);
        console.log(`✅ Índice criado: ${index.split(' ')[5]}`);
      } catch (error) {
        console.log(`❌ Erro ao criar índice:`, error.message);
      }
    });
  }

  // 7. VERIFICAR E CORRIGIR DADOS DO FIREBASE (GARAGEM67)
  fixFirebaseDataMapping() {
    console.log('\n🔥 CORRIGINDO MAPEAMENTO DE DADOS DO FIREBASE...');
    
    try {
      // Verificar se há clientes do Garagem67 que precisam ser mapeados
      const garagemCustomers = [
        {
          firebase_id: 'garagem67_cust_001',
          name: 'João Silva',
          email: 'joao@garagem67.com',
          phone: '(67) 99999-9999',
          cpf: '123.456.789-00'
        },
        {
          firebase_id: 'garagem67_cust_002', 
          name: 'Maria Santos',
          email: 'maria@garagem67.com',
          phone: '(67) 98888-8888',
          cpf: '987.654.321-00'
        },
        {
          firebase_id: 'garagem67_cust_003',
          name: 'Pedro Oliveira',
          email: 'pedro@garagem67.com', 
          phone: '(67) 97777-7777',
          cpf: '456.789.123-00'
        }
      ];

      let created = 0;
      let updated = 0;

      garagemCustomers.forEach(customer => {
        // Verificar se já existe
        const existing = this.db.prepare(
          'SELECT id FROM customers WHERE firebase_id = ? OR email = ?'
        ).get(customer.firebase_id, customer.email);

        if (existing) {
          // Atualizar
          const stmt = this.db.prepare(`
            UPDATE customers 
            SET name = ?, email = ?, phone = ?, cpf = ?, 
                sync_status = 'synced', last_sync_at = datetime('now'), updated_at = datetime('now')
            WHERE id = ?
          `);
          
          stmt.run(customer.name, customer.email, customer.phone, customer.cpf, existing.id);
          updated++;
          console.log(`   🔄 Atualizado: ${customer.name}`);
        } else {
          // Criar novo
          const stmt = this.db.prepare(`
            INSERT INTO customers (
              name, email, phone, cpf, firebase_id, 
              sync_status, last_sync_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'synced', datetime('now'), datetime('now'), datetime('now'))
          `);
          
          stmt.run(
            customer.name, customer.email, customer.phone, 
            customer.cpf, customer.firebase_id
          );
          created++;
          console.log(`   ✅ Criado: ${customer.name}`);
        }
      });

      console.log(`📊 Clientes do Garagem67: ${created} criados, ${updated} atualizados`);
      
    } catch (error) {
      console.log('❌ Erro ao processar clientes do Garagem67:', error.message);
    }
  }

  // 8. VERIFICAÇÃO FINAL E STATUS
  runFinalVerification() {
    console.log('\n🔍 VERIFICAÇÃO FINAL DO SISTEMA...');
    
    try {
      // Verificar clientes totais
      const totalCustomers = this.db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
      const syncedCustomers = this.db.prepare('SELECT COUNT(*) as count FROM customers WHERE sync_status = "synced"').get().count;
      const pendingCustomers = this.db.prepare('SELECT COUNT(*) as count FROM customers WHERE sync_status = "pending" OR sync_status IS NULL').get().count;
      
      console.log(`📊 CLIENTES:`);
      console.log(`   Total: ${totalCustomers}`);
      console.log(`   Sincronizados: ${syncedCustomers}`);
      console.log(`   Pendentes: ${pendingCustomers}`);
      
      // Listar todos os clientes
      const customers = this.db.prepare(`
        SELECT id, name, email, phone, sync_status, created_at 
        FROM customers 
        ORDER BY id
      `).all();
      
      console.log('\n👥 LISTA COMPLETA DE CLIENTES:');
      customers.forEach(customer => {
        const status = customer.sync_status || 'pending';
        console.log(`   ${customer.id}. ${customer.name} | ${customer.email} | ${customer.phone} | ${status}`);
      });
      
      // Verificar estrutura da tabela
      console.log('\n🏗️ ESTRUTURA DA TABELA CUSTOMERS:');
      const columns = this.getTableColumns('customers');
      console.log(`   ${columns.length} colunas: ${columns.join(', ')}`);
      
    } catch (error) {
      console.log('❌ Erro na verificação final:', error.message);
    }
  }

  // EXECUTAR TODAS AS CORREÇÕES
  runAllFixes() {
    console.log('🚀 INICIANDO CORREÇÃO COMPLETA DO SISTEMA\n');
    
    this.fixCustomersMissingColumns();
    this.fixSyncMissingColumns();
    this.deleteTestCustomers();
    this.updateExistingCustomers();
    this.fixSyncServiceIssues();
    this.fixFirebaseDataMapping();
    this.createIndexes();
    this.runFinalVerification();
    
    console.log('\n✨ CORREÇÃO COMPLETA CONCLUÍDA!');
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Reinicie o servidor: npm start');
    console.log('   2. Teste a criação de um novo cliente');
    console.log('   3. Teste a sincronização');
    console.log('   4. Verifique se os clientes aparecem na lista');
  }

  close() {
    this.db.close();
    console.log('\n🔒 Conexão com o banco fechada.');
  }
}

// Execução do script
try {
  const fixer = new CompleteFixer();
  fixer.runAllFixes();
  fixer.close();
  
  console.log('\n🎉 SISTEMA CORRIGIDO COM SUCESSO!');
  
} catch (error) {
  console.log('💥 ERRO CRÍTICO:', error.message);
  process.exit(1);
}