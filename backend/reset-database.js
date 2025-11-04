const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.db');

console.log('🔄 Reiniciando banco de dados...');

// Deletar arquivo do banco se existir
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Banco de dados antigo removido');
}

// Criar novo banco
const db = new sqlite3.Database(dbPath);

// Executar script de criação
const initScript = `
-- Suas tabelas aqui (como no exemplo acima)
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    category TEXT,
    barcode TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ... adicione todas as outras tabelas
`;

db.exec(initScript, (err) => {
  if (err) {
    console.error('❌ Erro ao criar tabelas:', err);
  } else {
    console.log('✅ Tabelas criadas com sucesso');
    
    // Inserir dados iniciais
    const initData = `
      INSERT INTO users (username, password_hash, role) 
      VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
      
      INSERT INTO products (name, price, stock_quantity) 
      VALUES 
        ('Produto Exemplo 1', 29.90, 100),
        ('Produto Exemplo 2', 49.90, 50);
    `;
    
    db.exec(initData, (err) => {
      if (err) {
        console.error('❌ Erro ao inserir dados iniciais:', err);
      } else {
        console.log('✅ Dados iniciais inseridos');
      }
      db.close();
      console.log('🎉 Banco de dados reiniciado com sucesso!');
    });
  }
});