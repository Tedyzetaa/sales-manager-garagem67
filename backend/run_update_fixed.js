// backend/run_update_fixed.js
const Database = require('better-sqlite3');
const path = require('path');

console.log('🔄 Verificando e atualizando estrutura do banco...');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
    // 1. Verificar estrutura atual da tabela customers
    console.log('📊 Verificando estrutura da tabela customers...');
    const customersStructure = db.prepare("PRAGMA table_info(customers)").all();
    
    const existingColumns = customersStructure.map(col => col.name.toLowerCase());
    console.log('Colunas existentes:', existingColumns);

    // 2. Adicionar apenas as colunas que não existem
    const columnsToAdd = [
        { name: 'cpf', type: 'TEXT' },
        { name: 'firebase_id', type: 'TEXT' },
        { name: 'city', type: 'TEXT DEFAULT "Ivinhema"' },
        { name: 'state', type: 'TEXT DEFAULT "MS"' },
        { name: 'cep', type: 'TEXT' },
        { name: 'complemento', type: 'TEXT' },
        { name: 'last_sync', type: 'DATETIME' }
    ];

    let columnsAdded = 0;
    
    for (const column of columnsToAdd) {
        if (!existingColumns.includes(column.name.toLowerCase())) {
            console.log(`➕ Adicionando coluna: ${column.name}`);
            try {
                db.exec(`ALTER TABLE customers ADD COLUMN ${column.name} ${column.type}`);
                console.log(`✅ Coluna ${column.name} adicionada com sucesso`);
                columnsAdded++;
            } catch (error) {
                console.log(`⚠️ Coluna ${column.name} já existe: ${error.message}`);
            }
        } else {
            console.log(`✅ Coluna ${column.name} já existe`);
        }
    }

    // 3. Criar tabela sync_logs se não existir
    console.log('\n📋 Verificando tabela sync_logs...');
    const syncLogsExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sync_logs'").get();
    
    if (!syncLogsExists) {
        console.log('➕ Criando tabela sync_logs...');
        db.exec(`
            CREATE TABLE sync_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                sync_type TEXT NOT NULL,
                items_created INTEGER DEFAULT 0,
                items_updated INTEGER DEFAULT 0,
                items_skipped INTEGER DEFAULT 0,
                error_count INTEGER DEFAULT 0,
                total_synced INTEGER DEFAULT 0,
                sync_date DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabela sync_logs criada com sucesso');
    } else {
        console.log('✅ Tabela sync_logs já existe');
    }

    // 4. Criar índices se não existirem
    console.log('\n📈 Verificando índices...');
    const indicesToCreate = [
        'idx_customers_firebase_id',
        'idx_customers_phone', 
        'idx_customers_cpf',
        'idx_sync_logs_session',
        'idx_sync_logs_date'
    ];

    indicesToCreate.forEach(indexName => {
        const indexExists = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name=?").get(indexName);
        if (!indexExists) {
            console.log(`➕ Criando índice: ${indexName}`);
            
            let createIndexSQL = '';
            switch(indexName) {
                case 'idx_customers_firebase_id':
                    createIndexSQL = 'CREATE INDEX idx_customers_firebase_id ON customers(firebase_id)';
                    break;
                case 'idx_customers_phone':
                    createIndexSQL = 'CREATE INDEX idx_customers_phone ON customers(phone)';
                    break;
                case 'idx_customers_cpf':
                    createIndexSQL = 'CREATE INDEX idx_customers_cpf ON customers(cpf)';
                    break;
                case 'idx_sync_logs_session':
                    createIndexSQL = 'CREATE INDEX idx_sync_logs_session ON sync_logs(session_id)';
                    break;
                case 'idx_sync_logs_date':
                    createIndexSQL = 'CREATE INDEX idx_sync_logs_date ON sync_logs(sync_date)';
                    break;
            }
            
            if (createIndexSQL) {
                db.exec(createIndexSQL);
                console.log(`✅ Índice ${indexName} criado com sucesso`);
            }
        } else {
            console.log(`✅ Índice ${indexName} já existe`);
        }
    });

    // 5. Mostrar resumo final
    console.log('\n🎯 RESUMO DA ATUALIZAÇÃO:');
    console.log(`📊 Colunas adicionadas: ${columnsAdded}`);
    console.log(`📋 Tabelas verificadas: 2 (customers, sync_logs)`);
    console.log(`📈 Índices verificados: ${indicesToCreate.length}`);
    
    // 6. Mostrar estrutura final
    console.log('\n🏗️ ESTRUTURA FINAL - customers:');
    const finalStructure = db.prepare("PRAGMA table_info(customers)").all();
    finalStructure.forEach(col => {
        console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
    });

    console.log('\n✅ Atualização do banco concluída com sucesso!');

} catch (error) {
    console.error('❌ Erro durante a atualização:', error.message);
} finally {
    db.close();
}