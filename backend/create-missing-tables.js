const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Criando tabelas faltantes...');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Lista de todas as tabelas necessárias
const tables = [
  // Tabela stock_movements (que está faltando)
  `CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'saida', 'ajuste')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    movement_date TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`,

  // Tabela sales (se não existir)
  `CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    total_amount REAL NOT NULL DEFAULT 0,
    payment_method TEXT,
    sale_date TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  )`,

  // Tabela sale_items (se não existir)
  `CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (sale_id) REFERENCES sales (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`,

  // Tabela users (se não existir)
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`
];

tables.forEach((sql, index) => {
  try {
    db.exec(sql);
    console.log(`✅ Tabela ${index + 1} criada/verificada`);
  } catch (error) {
    console.log(`❌ Erro na tabela ${index + 1}:`, error.message);
  }
});

// Verificar se usuário admin existe
try {
  const userCheck = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCheck.count === 0) {
    db.exec(`
      INSERT INTO users (username, password_hash, role) 
      VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
    `);
    console.log('✅ Usuário admin criado');
  }
} catch (error) {
  console.log('ℹ️ Usuário admin já existe ou tabela users não foi criada');
}

db.close();
console.log('🎉 Todas as tabelas criadas com sucesso!');