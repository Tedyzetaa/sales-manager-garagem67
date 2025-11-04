// backend/run_update.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔄 Executando atualização do banco de dados...');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
    // Executar SQL de atualização
    const sql = `
        -- Adicionar campo CPF na tabela customers
        ALTER TABLE customers ADD COLUMN cpf TEXT;
        
        -- Adicionar campos extras para sincronização
        ALTER TABLE customers ADD COLUMN firebase_id TEXT;
        ALTER TABLE customers ADD COLUMN city TEXT DEFAULT 'Ivinhema';
        ALTER TABLE customers ADD COLUMN state TEXT DEFAULT 'MS';
        ALTER TABLE customers ADD COLUMN cep TEXT;
        ALTER TABLE customers ADD COLUMN complemento TEXT;
        ALTER TABLE customers ADD COLUMN last_sync DATETIME;
        
        -- Criar tabela de logs de sincronização
        CREATE TABLE IF NOT EXISTS sync_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            sync_type TEXT NOT NULL,
            items_created INTEGER DEFAULT 0,
            items_updated INTEGER DEFAULT 0,
            items_skipped INTEGER DEFAULT 0,
            error_count INTEGER DEFAULT 0,
            total_synced INTEGER DEFAULT 0,
            sync_date DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX IF NOT EXISTS idx_customers_firebase_id ON customers(firebase_id);
        CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
        CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);
        CREATE INDEX IF NOT EXISTS idx_sync_logs_session ON sync_logs(session_id);
        CREATE INDEX IF NOT EXISTS idx_sync_logs_date ON sync_logs(sync_date);
    `;
    
    db.exec(sql);
    console.log('✅ Estrutura do banco atualizada com sucesso!');
    
    // Verificar estrutura
    const customersStructure = db.prepare("PRAGMA table_info(customers)").all();
    console.log('📊 Estrutura da tabela customers:');
    customersStructure.forEach(col => {
        console.log(`   ${col.name} (${col.type})`);
    });
    
} catch (error) {
    console.error('❌ Erro ao atualizar banco:', error.message);
} finally {
    db.close();
}