// app.js - VERSÃO CORRIGIDA - PROBLEMA DE LOGIN RESOLVIDO
class SalesManagerApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.cart = [];
        this.products = [];
        this.customers = [];
        this.sales = [];
        this.inventory = [];
        
        this.init();
    }

    init() {
        console.log('🚀 Sales Manager App Inicializando...');
        this.initializeEventListeners();
        this.checkAuthentication();
        this.loadInitialData();
        this.initializeCharts();
        
        console.log('✅ Sales Manager App Inicializado');
    }

    initializeEventListeners() {
        console.log('🔧 Inicializando event listeners...');
        
        // Login - CORREÇÃO CRÍTICA: Event listener aprimorado
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📝 Formulário de login submetido');
                this.handleLogin();
            });
        } else {
            console.error('❌ Formulário de login não encontrado!');
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Navegação
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.showPage(page);
            });
        });

        // Dashboard
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }

        console.log('✅ Event listeners inicializados');
    }

    async checkAuthentication() {
        console.log('🔐 Verificando autenticação...');
        const token = localStorage.getItem('sales_manager_token');
        
        if (token) {
            try {
                console.log('📡 Verificando token no backend...');
                const response = await api.verifyToken();
                if (response.success) {
                    this.currentUser = response.user;
                    this.showMainApp();
                    this.updateUserInfo();
                    console.log('✅ Usuário autenticado via token');
                } else {
                    console.log('❌ Token inválido');
                    this.showLogin();
                }
            } catch (error) {
                console.error('❌ Erro na verificação do token:', error);
                this.showLogin();
            }
        } else {
            console.log('🔐 Nenhum token encontrado');
            this.showLogin();
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        console.log('🔐 Tentativa de login:', { username });

        if (!username || !password) {
            this.showNotification('Por favor, preencha todos os campos', 'error');
            return;
        }

        this.showLoading(true);

        try {
            console.log('📡 Enviando credenciais para API...');
            const response = await api.login(username, password);
            console.log('📨 Resposta da API:', response);
            
            if (response.success) {
                this.currentUser = response.user;
                console.log('✅ Login bem-sucedido:', this.currentUser);
                this.showMainApp();
                this.updateUserInfo();
                this.showNotification('Login realizado com sucesso!', 'success');
                
                // Carregar dados iniciais após login
                setTimeout(() => {
                    this.loadDashboardData();
                    this.loadProductsData();
                }, 1000);
            } else {
                console.log('❌ Login falhou:', response.error);
                this.showNotification(response.error || 'Usuário ou senha incorretos', 'error');
            }
        } catch (error) {
            console.error('❌ Erro no login:', error);
            this.showNotification('Erro ao realizar login. Verifique se o servidor está rodando.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    handleLogout() {
        console.log('🚪 Realizando logout...');
        api.removeToken();
        this.currentUser = null;
        this.showLogin();
        this.showNotification('Logout realizado com sucesso', 'info');
    }

    showLogin() {
        console.log('👤 Mostrando tela de login');
        const loginPage = document.getElementById('login-page');
        const app = document.getElementById('app');
        
        if (loginPage && app) {
            loginPage.classList.add('active');
            app.style.display = 'none';
            
            // Limpar campos do formulário
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            if (usernameInput) usernameInput.value = '';
            if (passwordInput) passwordInput.value = '';
            
            // Focar no campo de usuário
            setTimeout(() => {
                if (usernameInput) usernameInput.focus();
            }, 100);
        } else {
            console.error('❌ Elementos da tela de login não encontrados');
        }
    }

    showMainApp() {
        console.log('🏠 Mostrando aplicação principal');
        const loginPage = document.getElementById('login-page');
        const app = document.getElementById('app');
        
        if (loginPage && app) {
            loginPage.classList.remove('active');
            app.style.display = 'flex';
            this.showPage('dashboard');
        } else {
            console.error('❌ Elementos da aplicação principal não encontrados');
        }
    }

    showPage(pageName) {
        console.log('📄 Mudando para página:', pageName);
        
        // Remove active class de todas as páginas e menu items
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        // Adiciona active class à página e menu item selecionados
        const targetPage = document.getElementById(`${pageName}-page`);
        const targetMenuItem = document.querySelector(`[data-page="${pageName}"]`);
        
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        if (targetMenuItem) {
            targetMenuItem.classList.add('active');
        }

        this.currentPage = pageName;

        // Carrega dados específicos da página
        switch (pageName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'products':
                this.loadProductsData();
                break;
            case 'inventory':
                this.loadInventoryData();
                break;
            case 'customers':
                this.loadCustomersData();
                break;
            case 'reports':
                this.loadReportsData();
                break;
        }
    }

    updateUserInfo() {
        if (this.currentUser) {
            const userElement = document.getElementById('current-user');
            if (userElement) {
                userElement.textContent = this.currentUser.full_name || this.currentUser.username;
            }
            console.log('👤 Informações do usuário atualizadas:', this.currentUser);
        }
    }

    updateConnectionStatus(isConnected) {
        const statusElement = document.getElementById('connection-status');
        const statusText = document.getElementById('status-text');
        
        if (!statusElement || !statusText) return;
        
        statusElement.classList.remove('online', 'offline', 'connecting');
        
        if (isConnected) {
            statusElement.classList.add('online');
            statusText.textContent = 'Conectado';
        } else {
            statusElement.classList.add('offline');
            statusText.textContent = 'Desconectado';
        }
    }

    // ===== MÉTODOS DE NOTIFICAÇÃO E LOADING =====

    showNotification(message, type = 'info') {
        console.log(`📢 Notificação [${type}]:`, message);
        
        // Remover notificação anterior se existir
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                </div>
                <div class="notification-message">${message}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    // ===== MÉTODOS DAS PÁGINAS =====

    async loadDashboardData() {
        if (!this.currentUser) return;
        
        this.showLoading(true);
        
        try {
            const response = await api.getSalesStats();
            if (response.success) {
                this.updateDashboardStats(response.stats);
                this.updateSalesChart(response.stats.dailySales);
                this.renderRecentSales(response.stats.recentSales);
            }
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            this.showNotification('Erro ao carregar dashboard', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadProductsData() {
        if (!this.currentUser) return;
        
        this.showLoading(true);
        
        try {
            const response = await api.getProducts();
            if (response.success) {
                this.products = response.products;
                this.renderProductsTable();
                this.updateProductsStats();
            }
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            this.showNotification('Erro ao carregar produtos', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadInventoryData() {
        if (!this.currentUser) return;
        
        this.showLoading(true);
        
        try {
            const response = await api.getInventoryReport();
            if (response.success) {
                this.inventory = response.inventory;
                this.renderInventoryTable();
                this.updateInventoryStats(response.totals);
            }
        } catch (error) {
            console.error('Erro ao carregar estoque:', error);
            this.showNotification('Erro ao carregar estoque', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadCustomersData() {
        if (!this.currentUser) return;
        
        this.showLoading(true);
        
        try {
            const response = await api.getCustomers();
            if (response.success) {
                this.customers = response.customers;
                this.renderCustomersTable();
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            this.showNotification('Erro ao carregar clientes', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadReportsData() {
        if (!this.currentUser) return;
        this.applyReportFilters();
    }

    // ===== RENDERIZAÇÃO DE TABELAS =====

    renderProductsTable() {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;
        
        if (this.products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-box"></i>
                        <p>Nenhum produto encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.products.map(product => `
            <tr>
                <td>
                    <strong>${product.name}</strong>
                    ${product.description ? `<br><small class="text-muted">${product.description}</small>` : ''}
                </td>
                <td>${product.category_name || 'Sem categoria'}</td>
                <td>R$ ${parseFloat(product.price).toFixed(2)}</td>
                <td>
                    <span class="${product.available_stock <= product.min_stock ? 'text-warning' : 'text-success'}">
                        ${product.available_stock}
                    </span>
                    ${product.available_stock <= product.min_stock ? '<i class="fas fa-exclamation-triangle ml-1"></i>' : ''}
                </td>
                <td>
                    <span class="badge ${product.is_active ? 'badge-success' : 'badge-secondary'}">
                        ${product.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="app.editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderInventoryTable() {
        const tbody = document.getElementById('inventory-table-body');
        if (!tbody) return;
        
        if (this.inventory.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-warehouse"></i>
                        <p>Nenhum produto em estoque</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.inventory.map(product => {
            let status = 'success';
            let statusText = 'Normal';
            
            if (product.available_stock === 0) {
                status = 'danger';
                statusText = 'Sem Estoque';
            } else if (product.available_stock <= product.min_stock) {
                status = 'warning';
                statusText = 'Estoque Baixo';
            }
            
            const stockValue = (product.available_stock * product.cost_price).toFixed(2);
            
            return `
                <tr>
                    <td>
                        <strong>${product.name}</strong>
                        <br><small class="text-muted">${product.sku || 'Sem SKU'}</small>
                    </td>
                    <td>${product.category_name || 'Sem categoria'}</td>
                    <td>
                        <span class="badge badge-${status}">
                            ${product.available_stock}
                        </span>
                    </td>
                    <td>${product.min_stock}</td>
                    <td>
                        <span class="badge badge-${status}">
                            ${statusText}
                        </span>
                    </td>
                    <td>R$ ${stockValue}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="app.adjustStock(${product.id})">
                            <i class="fas fa-edit"></i> Ajustar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderCustomersTable() {
        const tbody = document.getElementById('customers-table-body');
        if (!tbody) return;
        
        if (this.customers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>Nenhum cliente encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.customers.map(customer => `
            <tr>
                <td>${customer.name || 'N/A'}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td>${new Date(customer.last_sync).toLocaleString('pt-BR')}</td>
            </tr>
        `).join('');
    }

    // ===== MÉTODOS AUXILIARES =====

    updateDashboardStats(stats) {
        if (!stats) return;
        
        const totalSales = document.getElementById('total-sales');
        const totalRevenue = document.getElementById('total-revenue');
        const lowStock = document.getElementById('low-stock');
        const totalCustomers = document.getElementById('total-customers');
        
        if (totalSales) totalSales.textContent = stats.totalSales?.count || 0;
        if (totalRevenue) totalRevenue.textContent = `R$ ${(stats.totalSales?.amount || 0).toFixed(2)}`;
        if (lowStock) lowStock.textContent = stats.lowStock || 0;
        if (totalCustomers) totalCustomers.textContent = stats.totalCustomers || 0;
    }

    updateInventoryStats(totals) {
        if (!totals) return;
        
        const totalProducts = document.getElementById('total-products');
        const totalStockValue = document.getElementById('total-stock-value');
        const lowStockCount = document.getElementById('low-stock-count');
        const outOfStockCount = document.getElementById('out-of-stock-count');
        
        if (totalProducts) totalProducts.textContent = totals.totalProducts || 0;
        if (totalStockValue) totalStockValue.textContent = `R$ ${(totals.totalCostValue || 0).toFixed(2)}`;
        if (lowStockCount) lowStockCount.textContent = totals.lowStockItems || 0;
        if (outOfStockCount) outOfStockCount.textContent = totals.outOfStockItems || 0;
    }

    initializeCharts() {
        const ctx = document.getElementById('sales-chart');
        if (!ctx) return;
        
        this.salesChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Vendas Diárias',
                    data: [],
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    updateSalesChart(dailySales) {
        if (!this.salesChart || !dailySales) return;

        const labels = dailySales.map(day => {
            const date = new Date(day.date);
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        });

        const data = dailySales.map(day => day.amount);

        this.salesChart.data.labels = labels;
        this.salesChart.data.datasets[0].data = data;
        this.salesChart.update();
    }

    renderRecentSales(recentSales) {
        const container = document.getElementById('recent-sales');
        if (!container) return;
        
        if (!recentSales || recentSales.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Nenhuma venda recente</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentSales.map(sale => `
            <div class="recent-sale-item">
                <div class="sale-info">
                    <strong>${sale.customer_name || 'Cliente não identificado'}</strong>
                    <span>${sale.items_count || 1} item(s)</span>
                    <small class="sale-date">${new Date(sale.date).toLocaleString('pt-BR')}</small>
                </div>
                <div class="sale-amount">R$ ${parseFloat(sale.total || sale.amount).toFixed(2)}</div>
            </div>
        `).join('');
    }

    // ===== MÉTODOS DE AÇÃO =====

    refreshDashboard() {
        this.loadDashboardData();
        this.showNotification('Dashboard atualizado', 'success');
    }

    async syncCustomers() {
        this.showLoading(true);
        
        try {
            const response = await api.syncCustomers();
            if (response.success) {
                this.showNotification(`${response.synced} clientes sincronizados com sucesso`, 'success');
                this.loadCustomersData();
            }
        } catch (error) {
            console.error('Erro ao sincronizar clientes:', error);
            this.showNotification('Erro ao sincronizar clientes', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async applyReportFilters() {
        this.showLoading(true);
        
        try {
            // Implementação básica de relatórios
            const response = await api.getSalesStats();
            if (response.success) {
                this.updateReportSummary(response.stats);
            }
        } catch (error) {
            console.error('Erro ao carregar relatório:', error);
            this.showNotification('Erro ao carregar relatório', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateReportSummary(stats) {
        if (!stats) return;
        
        const reportTotalSales = document.getElementById('report-total-sales');
        const reportTotalRevenue = document.getElementById('report-total-revenue');
        const reportAverageTicket = document.getElementById('report-average-ticket');
        const reportProductsSold = document.getElementById('report-products-sold');
        
        if (reportTotalSales) reportTotalSales.textContent = stats.totalSales?.count || 0;
        if (reportTotalRevenue) reportTotalRevenue.textContent = `R$ ${(stats.totalSales?.amount || 0).toFixed(2)}`;
        if (reportAverageTicket) {
            const avg = stats.totalSales?.count ? (stats.totalSales.amount / stats.totalSales.count) : 0;
            reportAverageTicket.textContent = `R$ ${avg.toFixed(2)}`;
        }
        if (reportProductsSold) reportProductsSold.textContent = stats.productsSold || 0;
    }

    // ===== MÉTODOS DE CARREGAMENTO INICIAL =====

    async loadInitialData() {
        // Dados serão carregados após o login
        console.log('📦 Pronto para carregar dados após autenticação');
    }

    // ===== PLACEHOLDERS PARA FUNCIONALIDADES FUTURAS =====

    showNewSaleModal() {
        this.showNotification('Funcionalidade em desenvolvimento', 'info');
    }

    showProductModal() {
        this.showNotification('Funcionalidade em desenvolvimento', 'info');
    }

    showInventoryModal() {
        this.showNotification('Funcionalidade em desenvolvimento', 'info');
    }

    editProduct(id) {
        this.showNotification(`Editando produto ${id} - Em desenvolvimento`, 'info');
    }

    deleteProduct(id) {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            this.showNotification(`Produto ${id} excluído - Em desenvolvimento`, 'success');
        }
    }

    adjustStock(id) {
        this.showNotification(`Ajustando estoque do produto ${id} - Em desenvolvimento`, 'info');
    }

    clearCart() {
        this.cart = [];
        this.showNotification('Carrinho limpo', 'info');
    }

    completeSale() {
        this.showNotification('Funcionalidade em desenvolvimento', 'info');
    }

    searchProducts(query) {
        console.log(`Buscando produtos: ${query}`);
    }

    searchProductsManagement(query) {
        console.log(`Buscando na gestão: ${query}`);
    }

    generateReport() {
        this.showNotification('Relatório gerado com sucesso', 'success');
    }

    handleReportPeriodChange(period) {
        const customDates = document.getElementById('custom-dates');
        if (customDates) {
            customDates.style.display = period === 'custom' ? 'flex' : 'none';
        }
    }

    updateProductsStats() {
        // Implementar estatísticas de produtos se necessário
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado, inicializando aplicação...');
    window.app = new SalesManagerApp();
});

// Estilos para notificações
const notificationStyles = `
.notification {
    position: fixed;
    top: 90px;
    right: 30px;
    background: white;
    border-left: 4px solid #4CAF50;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    max-width: 350px;
    animation: slideInRight 0.3s ease;
    display: flex;
    align-items: center;
    gap: 15px;
    backdrop-filter: blur(10px);
}

.notification.error {
    border-left-color: #f44336;
}

.notification.warning {
    border-left-color: #ff9800;
}

.notification.info {
    border-left-color: #2196F3;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.notification-icon {
    font-size: 20px;
    flex-shrink: 0;
}

.notification-message {
    color: #333;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
}

@keyframes slideInRight {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
}

.badge-success {
    background: #d5f4e6;
    color: #27ae60;
}

.badge-warning {
    background: #fdebd0;
    color: #f39c12;
}

.badge-danger {
    background: #fdeaea;
    color: #e74c3c;
}

.badge-secondary {
    background: #e9ecef;
    color: #6c757d;
}

.text-warning {
    color: #e74c3c;
}

.text-success {
    color: #27ae60;
}

.text-muted {
    color: #6c757d;
}

.ml-1 {
    margin-left: 4px;
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #6c757d;
}

.empty-state i {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
}

.empty-state p {
    margin: 8px 0 16px;
    font-size: 16px;
}
`;

// Adicionar estilos ao DOM
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);