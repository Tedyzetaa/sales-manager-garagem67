const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ✅ CORREÇÃO: Caminho absoluto para o banco de dados
const dbPath = process.env.NODE_ENV === 'test' 
  ? ':memory:' 
  : path.join(__dirname, '..', 'database.sqlite');

console.log('🗄️ Iniciando banco de dados SQLite...');
console.log('📁 Caminho do banco:', dbPath);

// Criar diretório se não existir
if (dbPath !== ':memory:') {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
});

// ✅ CORREÇÃO: Habilitar chaves estrangeiras
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// ✅ CORREÇÃO: Função de inicialização do banco
function initializeDatabase() {
  try {
    console.log('🔄 Inicializando banco de dados...');

    // Criar tabelas
    db.exec(`
      -- Tabela de usuários
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        role TEXT DEFAULT 'user',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabela de categorias
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabela de produtos
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );

      -- Tabela de inventário
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER UNIQUE NOT NULL,
        current_stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );

      -- Tabela de movimentações de estoque
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        type TEXT NOT NULL,
        reason TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      -- Tabela de clientes
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabela de vendas
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_code TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method TEXT,
        observations TEXT,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      -- Tabela de itens de venda
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );

      -- Tabela de exportações
      CREATE TABLE IF NOT EXISTS exports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        filters TEXT,
        file_path TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);

    // Inserir categorias padrão
    const categoriesStmt = db.prepare(`
      INSERT OR IGNORE INTO categories (name, description) VALUES 
      ('Bebidas', 'Refrigerantes, sucos, água, etc.'),
      ('Snacks', 'Salgadinhos, biscoitos, chocolates'),
      ('Tabacaria', 'Cigarro, fumo, acessórios'),
      ('Conveniência', 'Produtos de conveniência em geral'),
      ('Outros', 'Outras categorias de produtos')
    `);
    
    categoriesStmt.run();
    console.log('✅ 5 categorias padrão criadas');

    // Inserir usuário admin padrão
    const bcrypt = require('bcryptjs');
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    
    const userStmt = db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password_hash, full_name, role) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    userStmt.run('admin', 'admin@garagem67.com', adminPasswordHash, 'Administrador', 'admin');
    console.log('✅ Usuário admin criado');

    console.log('✅ Banco de dados inicializado com sucesso');
    
    // Listar tabelas criadas
    const tablesStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
    const tables = tablesStmt.all().map(t => t.name);
    console.log('📊 Tabelas criadas:', tables.join(', '));

  } catch (error) {
    console.error('❌ Erro na inicialização do banco:', error);
    throw error;
  }
}

// Inicializar o banco
initializeDatabase();

module.exports = db;