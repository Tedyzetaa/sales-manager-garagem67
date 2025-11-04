const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Garantir que a pasta database existe
const databaseDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

const dbPath = path.join(databaseDir, 'sales_manager.db');
const db = new Database(dbPath);

console.log('🔄 Inicializando banco de dados...');

// Habilitar chaves estrangeiras
db.pragma('foreign_keys = ON');

// Criar tabelas
const schema = `
  -- Tabela de usuários/funcionários
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'vendedor',
    full_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de categorias de produtos
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de produtos
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    category_id INTEGER,
    sku TEXT UNIQUE,
    barcode TEXT,
    is_active BOOLEAN DEFAULT 1,
    has_stock_control BOOLEAN DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  -- Tabela de estoque
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL UNIQUE,
    current_stock INTEGER DEFAULT 0,
    reserved_stock INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
  );

  -- Tabela de movimentações de estoque
  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    user_id INTEGER NOT NULL,
    movement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  -- Tabela de vendas
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_code TEXT UNIQUE NOT NULL,
    customer_firebase_uid TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    sale_status TEXT DEFAULT 'pending',
    user_id INTEGER NOT NULL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  -- Tabela de itens da venda
  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id)
  );

  -- Tabela de clientes (cache do Firebase)
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firebase_uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_sync DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de exportações
  CREATE TABLE IF NOT EXISTS exports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    export_data TEXT NOT NULL,
    export_status TEXT DEFAULT 'pending',
    external_id TEXT,
    sent_at DATETIME,
    response_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales (id)
  );
`;

try {
  // Executar schema
  db.exec(schema);
  console.log('✅ Tabelas criadas/verificadas com sucesso');

  // Inserir usuário admin padrão
  const defaultPassword = bcrypt.hashSync('admin123', 10);
  
  const insertAdmin = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password_hash, role, full_name) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const adminResult = insertAdmin.run('admin', 'admin@garagem67.com', defaultPassword, 'admin', 'Administrador');
  
  if (adminResult.changes > 0) {
    console.log('✅ Usuário admin criado: admin / admin123');
  } else {
    console.log('ℹ️  Usuário admin já existe');
  }

  // Inserir categorias padrão
  const defaultCategories = [
    ['Bebidas Alcoólicas', 'Cervejas, vinhos, destilados'],
    ['Bebidas Não Alcoólicas', 'Refrigerantes, sucos, águas'],
    ['Petiscos', 'Salgadinhos, porções'],
    ['Conveniência', 'Produtos de conveniência'],
    ['Outros', 'Diversos']
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, description) 
    VALUES (?, ?)
  `);

  let categoriesInserted = 0;
  defaultCategories.forEach(category => {
    const result = insertCategory.run(category[0], category[1]);
    if (result.changes > 0) {
      categoriesInserted++;
    }
  });

  console.log(`✅ ${categoriesInserted} categorias padrão inseridas/verificadas`);

  console.log('🎉 Banco de dados inicializado com sucesso!');

} catch (error) {
  console.error('❌ Erro ao inicializar banco de dados:', error);
} finally {
  db.close();
}