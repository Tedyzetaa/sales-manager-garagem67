const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.NODE_ENV === 'test' 
  ? ':memory:' 
  : path.join(__dirname, '..', 'database.sqlite');

console.log('📁 Caminho do banco de dados:', dbPath);

const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// ✅ CORREÇÃO: Configurações de performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

// ✅ CORREÇÃO: Criar tabelas se não existirem
function initializeDatabase() {
  try {
    console.log('🔄 Inicializando banco de dados...');

    // Tabela de categorias
    db.prepare(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Tabela de produtos
    db.prepare(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        current_stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 10,
        category_id INTEGER,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `).run();

    // Tabela de movimentações de estoque
    db.prepare(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste')),
        quantity INTEGER NOT NULL,
        reason TEXT NOT NULL,
        observations TEXT,
        movement_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `).run();

    // ✅ CORREÇÃO CRÍTICA: Tabela de clientes COM TODAS AS COLUNAS
    db.prepare(`
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
    `).run();

    // ✅ CORREÇÃO: Tabela de logs de sincronização
    db.prepare(`
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
    `).run();

    // ✅ CORREÇÃO: Tabelas de vendas (se não existirem)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        total_amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT,
        status TEXT DEFAULT 'completed',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      )
    `).run();

    db.prepare(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `).run();

    // ✅ CORREÇÃO: Tabela de inventário (se não existir)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        current_stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 10,
        last_updated TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `).run();

    // Inserir categorias padrão
    const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    if (categoryCount === 0) {
      console.log('📝 Inserindo categorias padrão...');
      const insertCategory = db.prepare(`
        INSERT INTO categories (name, description) VALUES (?, ?)
      `);
      
      const defaultCategories = [
        ['Bebidas', 'Bebidas em geral'],
        ['Snacks', 'Salgadinhos e petiscos'],
        ['Tabacaria', 'Produtos de tabacaria'],
        ['Conveniência', 'Produtos de conveniência'],
        ['Outros', 'Outras categorias']
      ];
      
      defaultCategories.forEach(([name, description]) => {
        insertCategory.run(name, description);
      });
    }

    console.log('✅ Banco de dados inicializado com sucesso');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Executar inicialização
initializeDatabase();

module.exports = db;