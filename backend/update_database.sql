-- backend/update_database.sql
-- Atualização do banco para sincronização

-- 1. Adicionar campo CPF na tabela customers
ALTER TABLE customers ADD COLUMN cpf TEXT;

-- 2. Adicionar campos extras para sincronização
ALTER TABLE customers ADD COLUMN firebase_id TEXT;
ALTER TABLE customers ADD COLUMN city TEXT DEFAULT 'Ivinhema';
ALTER TABLE customers ADD COLUMN state TEXT DEFAULT 'MS';
ALTER TABLE customers ADD COLUMN cep TEXT;
ALTER TABLE customers ADD COLUMN complemento TEXT;
ALTER TABLE customers ADD COLUMN last_sync DATETIME;

-- 3. Criar tabela de logs de sincronização
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

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_customers_firebase_id ON customers(firebase_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);
CREATE INDEX IF NOT EXISTS idx_sync_logs_session ON sync_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_date ON sync_logs(sync_date);

-- 5. Verificar estrutura atualizada
PRAGMA table_info(customers);
PRAGMA table_info(sync_logs);

-- 6. Mostrar resumo
SELECT '✅ Banco de dados atualizado para sincronização' as status;