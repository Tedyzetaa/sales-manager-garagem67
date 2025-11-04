const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database', 'data.json');

// Banco de dados em memória
let db = {
  users: [],
  categories: [],
  products: [],
  inventory: [],
  sales: [],
  sale_items: [],
  customers: []
};

// Carregar dados do arquivo se existir
if (fs.existsSync(dbPath)) {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    db = JSON.parse(data);
    console.log('✅ Dados carregados do arquivo JSON');
  } catch (error) {
    console.log('🆕 Criando novo banco de dados JSON');
  }
}

function saveToFile() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('❌ Erro ao salvar dados:', error);
  }
}

function initializeDatabase() {
  console.log('🔄 Inicializando banco de dados JSON...');

  // Inserir usuário admin se não existir
  const adminExists = db.users.find(u => u.username === 'admin');
  if (!adminExists) {
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    db.users.push({
      id: 1,
      username: 'admin',
      email: 'admin@garagem67.com',
      password_hash: defaultPassword,
      role: 'admin',
      full_name: 'Administrador',
      is_active: true,
      created_at: new Date().toISOString()
    });
    console.log('✅ Usuário admin criado: admin / admin123');
  }

  // Inserir categorias padrão
  const defaultCategories = [
    { id: 1, name: 'Bebidas Alcoólicas', description: 'Cervejas, vinhos, destilados' },
    { id: 2, name: 'Bebidas Não Alcoólicas', description: 'Refrigerantes, sucos, águas' },
    { id: 3, name: 'Petiscos', description: 'Salgadinhos, porções' },
    { id: 4, name: 'Conveniência', description: 'Produtos de conveniência' },
    { id: 5, name: 'Outros', description: 'Diversos' }
  ];

  defaultCategories.forEach(category => {
    const exists = db.categories.find(c => c.id === category.id);
    if (!exists) {
      db.categories.push({
        ...category,
        is_active: true,
        created_at: new Date().toISOString()
      });
    }
  });

  console.log('✅ Categorias padrão inseridas');
  saveToFile();
  console.log('🎉 Banco de dados JSON inicializado com sucesso!');
}

// Inicializar
initializeDatabase();

// Funções do banco de dados
const database = {
  // Users
  getUsers: () => db.users,
  getUserById: (id) => db.users.find(u => u.id === id),
  getUserByUsername: (username) => db.users.find(u => u.username === username),
  createUser: (userData) => {
    const newUser = {
      id: Math.max(...db.users.map(u => u.id), 0) + 1,
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.users.push(newUser);
    saveToFile();
    return newUser;
  },

  // Products
  getProducts: () => db.products,
  getProductById: (id) => db.products.find(p => p.id === id),
  createProduct: (productData) => {
    const newProduct = {
      id: Math.max(...db.products.map(p => p.id), 0) + 1,
      ...productData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.products.push(newProduct);
    saveToFile();
    return newProduct;
  },

  // Sales
  getSales: () => db.sales,
  createSale: (saleData) => {
    const newSale = {
      id: Math.max(...db.sales.map(s => s.id), 0) + 1,
      sale_code: `V${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
      ...saleData,
      sale_date: new Date().toISOString(),
      sale_status: 'completed'
    };
    db.sales.push(newSale);
    saveToFile();
    return newSale;
  },

  // Customers
  getCustomers: () => db.customers,
  createCustomer: (customerData) => {
    const newCustomer = {
      id: Math.max(...db.customers.map(c => c.id), 0) + 1,
      ...customerData,
      created_at: new Date().toISOString(),
      last_sync: new Date().toISOString()
    };
    db.customers.push(newCustomer);
    saveToFile();
    return newCustomer;
  },

  // Save function
  save: saveToFile
};

module.exports = database;