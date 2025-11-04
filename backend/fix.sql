-- Corrigir a tabela inventory_movements se ela existir
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste')),
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  observations TEXT,
  movement_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products (id)
);

-- Garantir que a tabela products tem as colunas necessárias
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 10,
  category_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories (id)
);

-- Criar tabela categories se não existir
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL
);

-- Inserir categorias padrão se a tabela estiver vazia
INSERT OR IGNORE INTO categories (name, description, created_at) VALUES 
('Bebidas', 'Bebidas em geral', datetime('now')),
('Snacks', 'Salgadinhos e petiscos', datetime('now')),
('Tabacaria', 'Produtos de tabacaria', datetime('now')),
('Conveniência', 'Produtos de conveniência', datetime('now')),
('Outros', 'Outras categorias', datetime('now'));