// api.js - VERSÃO CORRIGIDA
class API {
    constructor() {
        this.baseURL = 'http://localhost:3002/api';
        this.token = localStorage.getItem('sales_manager_token');
        this.isConnected = false;
        
        console.log('🌐 API inicializada:', {
            baseURL: this.baseURL,
            hasToken: !!this.token,
            token: this.token ? '***' + this.token.slice(-10) : 'none'
        });
        
        // Verificar conexão com backend
        this.checkConnection();
    }

    async checkConnection() {
        try {
            console.log('🔍 Verificando conexão com backend...');
            const response = await fetch(`${this.baseURL}/health`);
            const data = await response.json();
            this.isConnected = response.ok;
            
            console.log(`✅ Backend ${this.isConnected ? 'conectado' : 'desconectado'}:`, data);
            
            if (window.app) {
                window.app.updateConnectionStatus(this.isConnected);
            }
            
            return this.isConnected;
        } catch (error) {
            console.error('❌ Backend não conectado:', error);
            this.isConnected = false;
            
            if (window.app) {
                window.app.updateConnectionStatus(false);
            }
            
            return false;
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        if (options.body) {
            config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
        }

        console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`, {
            hasToken: !!this.token,
            body: config.body ? JSON.parse(config.body) : undefined
        });

        try {
            const response = await fetch(url, config);
            let data;
            
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('❌ Erro ao parsear resposta:', parseError);
                throw new Error('Resposta inválida do servidor');
            }

            console.log(`📨 API Response [${response.status}]:`, data);

            if (!response.ok) {
                // Se for erro de autenticação, redireciona para login
                if (response.status === 401) {
                    this.handleUnauthorized();
                }
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;

        } catch (error) {
            console.error('❌ API Request Error:', error);
            
            // Em desenvolvimento, usar dados mockados se backend não estiver disponível
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.log('🔄 Backend offline, usando dados mockados...');
                return this.getMockData(endpoint, options);
            }
            
            throw error;
        }
    }

    handleUnauthorized() {
        console.log('🔐 Token inválido ou expirado, redirecionando para login...');
        this.removeToken();
        if (window.app) {
            window.app.showLogin();
        }
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('sales_manager_token', token);
        console.log('🔑 Token salvo no localStorage');
    }

    removeToken() {
        this.token = null;
        localStorage.removeItem('sales_manager_token');
        console.log('🔑 Token removido do localStorage');
    }

    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url);
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // ===== MÉTODOS ESPECÍFICOS DA APLICAÇÃO =====

    // 🔐 AUTENTICAÇÃO - CORRIGIDO
    async login(username, password) {
        try {
            console.log('🔐 Iniciando processo de login...');
            const response = await this.post('/auth/login', { username, password });
            
            if (response.success && response.token) {
                this.setToken(response.token);
                console.log('✅ Login realizado com sucesso, token salvo');
            } else {
                console.log('❌ Login falhou na resposta:', response);
            }
            
            return response;
        } catch (error) {
            console.error('❌ Erro no método login:', error);
            throw error;
        }
    }

    async verifyToken() {
        return this.get('/auth/verify');
    }

    async changePassword(currentPassword, newPassword) {
        return this.post('/auth/change-password', { currentPassword, newPassword });
    }

    async login(username, password) {
    try {
        console.log('🔐 Iniciando processo de login...');
        const response = await this.post('/auth/login', { username, password });
        
        console.log('📨 Resposta completa do login:', response);
        
        if (response.success && response.token) {
            this.setToken(response.token);
            console.log('✅ Login realizado com sucesso, token salvo');
        } else {
            console.log('❌ Login falhou na resposta:', response);
        }
        
        return response;
    } catch (error) {
        console.error('❌ Erro no método login:', error);
        
        // Se for erro de rede, tentar com dados mockados
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.log('🌐 Usando dados mockados devido a erro de rede...');
            const mockResponse = this.getMockData('/auth/login', {});
            if (mockResponse.success) {
                this.setToken(mockResponse.token);
            }
            return mockResponse;
        }
        
        throw error;
    }
}
    // 📦 PRODUTOS
    async getProducts(filters = {}) {
        return this.get('/products', filters);
    }

    async getProductById(id) {
        return this.get(`/products/${id}`);
    }

    async createProduct(productData) {
        return this.post('/products', productData);
    }

    async updateProduct(id, productData) {
        return this.put(`/products/${id}`, productData);
    }

    async deleteProduct(id) {
        return this.delete(`/products/${id}`);
    }

    async getCategories() {
        return this.get('/products/categories/all');
    }

    // 🛒 VENDAS
    async getSales(filters = {}) {
        return this.get('/sales', filters);
    }

    async getSaleById(id) {
        return this.get(`/sales/${id}`);
    }

    async createSale(saleData) {
        return this.post('/sales', saleData);
    }

    async cancelSale(id, reason) {
        return this.post(`/sales/${id}/cancel`, { reason });
    }

    async getSalesStats(filters = {}) {
        return this.get('/sales/stats/dashboard', filters);
    }

    // 👥 CLIENTES
    async getCustomers(filters = {}) {
        return this.get('/customers', filters);
    }

    async syncCustomers() {
        return this.post('/customers/sync');
    }

    // 📊 ESTOQUE
    async getInventory(filters = {}) {
        return this.get('/inventory', filters);
    }

    async getInventoryReport() {
        return this.get('/inventory/report');
    }

    async getLowStockProducts() {
        return this.get('/inventory/low-stock');
    }

    async updateStock(productId, quantity, type, reason) {
        return this.post(`/inventory/${productId}/stock`, {
            quantity,
            type,
            reason,
            userId: this.getCurrentUserId()
        });
    }

    async getStockMovements(filters = {}) {
        return this.get('/inventory/movements', filters);
    }

    // 📤 EXPORTAÇÃO
    async exportSale(saleId) {
        return this.post(`/export/sale/${saleId}`);
    }

    async getExports(filters = {}) {
        return this.get('/export/exports', filters);
    }

    async getSalesReport(filters = {}) {
        return this.get('/export/sales-report', filters);
    }

    // 👤 USUÁRIOS (Admin apenas)
    async getUsers() {
        return this.get('/auth/users');
    }

    async createUser(userData) {
        return this.post('/auth/users', userData);
    }

    // ===== DADOS MOCKADOS PARA DESENVOLVIMENTO =====

    getMockData(endpoint, options) {
        console.log(`🎭 Retornando dados mockados para: ${endpoint}`);
        
        const mockData = {
            // Autenticação
            '/auth/login': {
                success: true,
                token: 'mock_jwt_token_' + Date.now(),
                user: {
                    id: 1,
                    username: 'admin',
                    email: 'admin@garagem67.com',
                    role: 'admin',
                    full_name: 'Administrador'
                }
            },
            '/auth/verify': {
                success: true,
                user: {
                    id: 1,
                    username: 'admin',
                    email: 'admin@garagem67.com',
                    role: 'admin',
                    full_name: 'Administrador'
                }
            },

            // Produtos
            '/products': {
                success: true,
                products: this.generateMockProducts(),
                pagination: { page: 1, limit: 100, total: 15, pages: 1 }
            },
            '/products/categories/all': {
                success: true,
                categories: [
                    { id: 1, name: 'Bebidas Alcoólicas', description: 'Cervejas, vinhos, destilados' },
                    { id: 2, name: 'Bebidas Não Alcoólicas', description: 'Refrigerantes, sucos, águas' },
                    { id: 3, name: 'Petiscos', description: 'Salgadinhos, porções' },
                    { id: 4, name: 'Conveniência', description: 'Produtos de conveniência' },
                    { id: 5, name: 'Outros', description: 'Diversos' }
                ]
            },

            // Vendas
            '/sales/stats/dashboard': {
                success: true,
                stats: this.generateMockDashboardStats()
            },
            '/sales': {
                success: true,
                sales: this.generateMockSales(),
                pagination: { page: 1, limit: 50, total: 8, pages: 1 }
            },

            // Clientes
            '/customers': {
                success: true,
                customers: this.generateMockCustomers(),
                pagination: { page: 1, limit: 50, total: 25, pages: 1 }
            },
            '/customers/sync': {
                success: true,
                synced: 5,
                errors: 0,
                total: 25
            },

            // Estoque
            '/inventory/report': {
                success: true,
                inventory: this.generateMockInventory(),
                totals: {
                    totalProducts: 15,
                    totalStock: 245,
                    totalCostValue: 1250.50,
                    totalSaleValue: 2850.75,
                    lowStockItems: 3,
                    outOfStockItems: 1
                }
            },
            '/inventory/low-stock': {
                success: true,
                products: this.generateMockProducts().filter(p => p.available_stock <= p.min_stock)
            }
        };

        // Encontrar o endpoint correspondente
        for (const [key, value] of Object.entries(mockData)) {
            if (endpoint.includes(key)) {
                return value;
            }
        }

        // Endpoint não encontrado nos mocks
        return {
            success: false,
            error: `Endpoint não mockado: ${endpoint}`
        };
    }

    generateMockProducts() {
        return [
            {
                id: 1,
                name: 'Heineken Long Neck',
                description: 'Cerveja Heineken 330ml',
                price: 12.00,
                cost_price: 8.50,
                category_id: 1,
                category_name: 'Bebidas Alcoólicas',
                sku: 'HEINEKEN-330',
                barcode: '789123456001',
                is_active: true,
                has_stock_control: true,
                min_stock: 10,
                max_stock: 100,
                current_stock: 25,
                reserved_stock: 2,
                available_stock: 23,
                created_at: '2024-01-15T10:00:00Z'
            },
            {
                id: 2,
                name: 'Budweiser Long Neck',
                description: 'Cerveja Budweiser 330ml',
                price: 10.00,
                cost_price: 7.00,
                category_id: 1,
                category_name: 'Bebidas Alcoólicas',
                sku: 'BUD-330',
                barcode: '789123456002',
                is_active: true,
                has_stock_control: true,
                min_stock: 10,
                max_stock: 100,
                current_stock: 8,
                reserved_stock: 0,
                available_stock: 8,
                created_at: '2024-01-15T10:00:00Z'
            },
            {
                id: 3,
                name: 'Corona Extra',
                description: 'Cerveja Corona Extra 330ml',
                price: 15.90,
                cost_price: 11.00,
                category_id: 1,
                category_name: 'Bebidas Alcoólicas',
                sku: 'CORONA-330',
                barcode: '789123456003',
                is_active: true,
                has_stock_control: true,
                min_stock: 5,
                max_stock: 50,
                current_stock: 3,
                reserved_stock: 0,
                available_stock: 3,
                created_at: '2024-01-15T10:00:00Z'
            }
        ];
    }

    generateMockDashboardStats() {
        const today = new Date();
        const dailySales = [];
        
        // Gerar dados dos últimos 7 dias
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dailySales.push({
                date: date.toISOString().split('T')[0],
                sales: Math.floor(Math.random() * 10) + 5,
                amount: parseFloat((Math.random() * 500 + 200).toFixed(2))
            });
        }

        return {
            totalSales: {
                count: dailySales.reduce((sum, day) => sum + day.sales, 0),
                amount: dailySales.reduce((sum, day) => sum + day.amount, 0)
            },
            lowStock: 3,
            totalCustomers: 45,
            dailySales: dailySales,
            recentSales: [
                {
                    id: 1,
                    customer_name: 'João Silva',
                    total: 45.50,
                    items_count: 3,
                    date: today.toISOString()
                },
                {
                    id: 2,
                    customer_name: 'Maria Santos',
                    total: 32.00,
                    items_count: 2,
                    date: new Date(today.setHours(today.getHours() - 2)).toISOString()
                }
            ]
        };
    }

    generateMockSales() {
        return [
            {
                id: 1,
                sale_code: 'V20240115001',
                customer_name: 'João Silva',
                total_amount: 45.50,
                discount_amount: 0,
                final_amount: 45.50,
                payment_method: 'dinheiro',
                sale_status: 'completed',
                user_name: 'Administrador',
                sale_date: '2024-01-15T14:30:00Z',
                items_count: 3
            }
        ];
    }

    generateMockCustomers() {
        return [
            {
                id: 1,
                firebase_uid: 'user123',
                name: 'João Silva',
                email: 'joao@email.com',
                phone: '(67) 99999-9999',
                last_sync: '2024-01-15T10:00:00Z'
            },
            {
                id: 2,
                firebase_uid: 'user456',
                name: 'Maria Santos',
                email: 'maria@email.com',
                phone: '(67) 98888-8888',
                last_sync: '2024-01-15T10:00:00Z'
            }
        ];
    }

    generateMockInventory() {
        return this.generateMockProducts();
    }

    getCurrentUserId() {
        return 1; // ID do admin
    }
}

// Instância global da API
console.log('🌐 Criando instância global da API...');
window.api = new API();

