console.log('🚀 Enhanced app.js carregado - VENDAS REIMPLEMENTADAS');

class EnhancedApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.products = [];
        this.customers = [];
        this.sales = [];
        this.isInitialized = false;
        this.currentSale = {
            items: [],
            customer_id: null,
            payment_method: '',
            observations: ''
        };
        
        console.log('🔄 EnhancedApp Constructor Iniciado');
        this.safeInit();
    }

    async safeInit() {
        try {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            } else {
                setTimeout(() => this.init(), 100);
            }
        } catch (error) {
            console.error('💥 Erro crítico no safeInit:', error);
        }
    }

    async init() {
        if (this.isInitialized) {
            console.log('⚠️ App já inicializado');
            return;
        }

        try {
            console.log('🚀 Inicializando Enhanced Sales Manager App...');
            
            this.forceShowLogin();
            this.initializeEventListeners();
            await this.checkAuthentication();
            
            // ✅ CORREÇÃO: Debug dos botões
            setTimeout(() => {
                this.debugSyncButtons();
            }, 2000);
            
            this.isInitialized = true;
            console.log('✅ Enhanced App Inicializado e Corrigido');

        } catch (error) {
            console.error('💥 Erro crítico na inicialização:', error);
        }
    }

    initializeEventListeners() {
        console.log('🎯 Inicializando event listeners CORRIGIDOS...');
        
        // ✅ CORREÇÃO: Usar setTimeout para garantir que o DOM esteja pronto
        setTimeout(() => {
            try {
                // ✅ CORREÇÃO: Botão de sincronização do DASHBOARD
                const forceSyncBtn = document.getElementById('force-sync');
                if (forceSyncBtn) {
                    console.log('✅ Botão force-sync encontrado, adicionando listener...');
                    forceSyncBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔄 Botão sync clicado no dashboard!');
                        this.syncCustomers();
                    });
                    
                    // ✅ CORREÇÃO EXTRA: Adicionar onclick também como backup
                    forceSyncBtn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🎯 Clique direto no botão sync!');
                        this.syncCustomers();
                    };
                } else {
                    console.log('❌ Botão force-sync NÃO encontrado!');
                }

                // ✅ CORREÇÃO: Botão de sincronização da PÁGINA DE CLIENTES
                const syncCustomersBtn = document.getElementById('sync-customers-page-btn');
                if (syncCustomersBtn) {
                    console.log('✅ Botão sync-customers-page-btn encontrado, adicionando listener...');
                    syncCustomersBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔄 Botão sync clicado na página de clientes!');
                        this.syncCustomers();
                    });
                    
                    // ✅ CORREÇÃO EXTRA: Adicionar onclick também como backup
                    syncCustomersBtn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🎯 Clique direto no botão sync clientes!');
                        this.syncCustomers();
                    };
                } else {
                    console.log('❌ Botão sync-customers-page-btn NÃO encontrado!');
                }

                // Login
                const loginBtn = document.getElementById('login-btn');
                if (loginBtn) {
                    loginBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.handleLogin();
                    });
                }

                const loginForm = document.getElementById('login-form');
                if (loginForm) {
                    loginForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.handleLogin();
                    });
                }

                // Logout
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
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

                // Produtos
                const newProductBtn = document.getElementById('new-product-btn');
                if (newProductBtn) {
                    newProductBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showProductModal();
                    });
                }

                // ✅ VENDAS: Botão nova venda
                const newSaleBtn = document.getElementById('new-sale-btn');
                if (newSaleBtn) {
                    newSaleBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showSaleModal();
                    });
                }

                // ✅ VENDAS: Filtros
                const applySalesFilters = document.getElementById('apply-sales-filters');
                if (applySalesFilters) {
                    applySalesFilters.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.loadSales();
                    });
                }

                // Refresh Dashboard
                const refreshBtn = document.getElementById('refresh-dashboard');
                if (refreshBtn) {
                    refreshBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.refreshDashboard();
                    });
                }

                console.log('✅ Todos os event listeners configurados CORRETAMENTE');

            } catch (error) {
                console.error('❌ Erro crítico ao configurar event listeners:', error);
            }
        }, 1000);
    }

    // ✅ CORREÇÃO: Função de debug
    debugSyncButtons() {
        console.log('🔍 Debug: Procurando botões de sincronização...');
        
        const elements = {
            'force-sync': document.getElementById('force-sync'),
            'sync-customers-page-btn': document.getElementById('sync-customers-page-btn'),
            'sync-status': document.getElementById('sync-status')
        };
        
        console.log('📍 Elementos encontrados:', elements);
        
        // Verificar se os event listeners estão ativos
        const forceSyncBtn = document.getElementById('force-sync');
        if (forceSyncBtn) {
            console.log('🖱️ Botão force-sync encontrado!');
        }
    }

    async checkAuthentication() {
        try {
            console.log('🔐 Verificando autenticação...');
            const token = localStorage.getItem('sales_manager_token');
            
            if (token) {
                const response = await api.verifyToken();
                if (response.success) {
                    this.currentUser = response.user;
                    console.log('✅ Usuário autenticado:', this.currentUser.username);
                    this.showMainApp();
                    return;
                }
            }
            
            this.forceShowLogin();
        } catch (error) {
            console.error('❌ Erro na verificação de autenticação:', error);
            this.forceShowLogin();
        }
    }

    async handleLogin() {
        console.log('🔐 INICIANDO LOGIN CORRIGIDO...');
        
        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value.trim();

        if (!username || !password) {
            this.showNotification('Por favor, preencha todos os campos', 'error');
            return;
        }

        this.showLoading(true, 'Conectando...');

        try {
            const response = await api.login(username, password);
            
            if (response && response.success) {
                this.currentUser = response.user;
                this.showMainApp();
                this.showNotification('Login realizado com sucesso!', 'success');
                
                this.loadDashboardData();
                this.loadProducts();
                this.loadCustomers();
                this.loadSales();
            } else {
                this.showNotification('Usuário ou senha incorretos', 'error');
            }
        } catch (error) {
            console.error('💥 Erro no login:', error);
            this.showNotification('Erro de conexão: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    handleLogout() {
        console.log('🚪 Logout...');
        
        try {
            if (window.api) {
                window.api.removeToken();
            }
            this.currentUser = null;
            
            this.forceShowLogin();
            this.showNotification('Logout realizado', 'info');
        } catch (error) {
            console.error('❌ Erro no logout:', error);
        }
    }

    forceShowLogin() {
        console.log('🔄 FORÇANDO TELA DE LOGIN');
        
        try {
            const appElement = document.getElementById('app');
            const loginElement = document.getElementById('login-page');
            
            if (appElement) appElement.style.display = 'none';
            if (loginElement) {
                loginElement.style.display = 'flex';
                loginElement.classList.add('active');
            }
            
            setTimeout(() => {
                const usernameField = document.getElementById('username');
                const passwordField = document.getElementById('password');
                if (usernameField) usernameField.value = 'admin';
                if (passwordField) passwordField.value = 'admin123';
            }, 100);
        } catch (error) {
            console.error('❌ Erro ao forçar tela de login:', error);
        }
    }

    showMainApp() {
        console.log('🔄 MOSTRANDO APLICAÇÃO PRINCIPAL CORRIGIDA');
        
        try {
            const loginElement = document.getElementById('login-page');
            const appElement = document.getElementById('app');
            
            if (loginElement) {
                loginElement.style.display = 'none';
                loginElement.classList.remove('active');
            }
            
            if (appElement) {
                appElement.style.display = 'block';
                appElement.classList.add('active');
            }
            
            this.updateUserInfo();
            this.showDashboard();
        } catch (error) {
            console.error('❌ Erro ao mostrar aplicação principal:', error);
        }
    }

    updateUserInfo() {
        try {
            if (this.currentUser) {
                const userElement = document.getElementById('current-user');
                if (userElement) {
                    userElement.textContent = this.currentUser.full_name || this.currentUser.username;
                }
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar informações do usuário:', error);
        }
    }

    showPage(page) {
        try {
            console.log('📄 Mostrando página:', page);
            
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });

            const pageElement = document.getElementById(`${page}-page`);
            const menuElement = document.querySelector(`[data-page="${page}"]`);
            
            if (pageElement) pageElement.classList.add('active');
            if (menuElement) menuElement.classList.add('active');

            this.currentPage = page;

            switch (page) {
                case 'dashboard':
                    this.loadDashboardData();
                    break;
                case 'sales':
                    this.loadSales();
                    break;
                case 'products':
                    this.loadProducts();
                    break;
                case 'customers':
                    this.loadCustomers();
                    break;
                case 'reports':
                    this.loadReports();
                    break;
            }
        } catch (error) {
            console.error('❌ Erro ao mostrar página:', error);
            this.showNotification('Erro ao carregar página', 'error');
        }
    }

    showDashboard() {
        this.showPage('dashboard');
    }

    // ✅ CORREÇÃO: Função syncCustomers COM FEEDBACK VISUAL
    async syncCustomers() {
        console.log('🔄 App: Iniciando sincronização COM FEEDBACK VISUAL...');
        
        // ✅ CORREÇÃO: Atualizar interface imediatamente
        this.setSyncButtonState(true);
        this.showLoading(true, 'Conectando com Garagem67...');
        
        try {
            const result = await api.syncCustomers();
            
            console.log('📦 Resultado da sincronização:', result);
            
            if (result && result.success) {
                let message = result.message || 'Sincronização concluída!';
                
                if (result.data && result.data.statistics) {
                    const stats = result.data.statistics;
                    message = `✅ ${stats.synced || 0} clientes sincronizados (${stats.created} novos, ${stats.updated} atualizados)`;
                }
                
                this.showNotification(message, 'success');
                
                // ✅ CORREÇÃO: Atualizar dados
                await Promise.all([
                    this.loadCustomers(),
                    this.loadDashboardData()
                ]);
                
            } else {
                const errorMsg = result?.error || 'Erro desconhecido';
                this.showNotification(`❌ ${errorMsg}`, 'error');
            }
            
        } catch (error) {
            console.error('💥 App: Erro crítico:', error);
            this.showNotification(`💥 Erro: ${error.message}`, 'error');
        } finally {
            // ✅ CORREÇÃO: Restaurar interface
            this.setSyncButtonState(false);
            this.showLoading(false);
        }
    }

    // ✅ CORREÇÃO: Função para animar o botão durante sincronização
    setSyncButtonState(syncing) {
        try {
            // ✅ Botão do dashboard
            const forceSyncBtn = document.getElementById('force-sync');
            if (forceSyncBtn) {
                if (syncing) {
                    forceSyncBtn.classList.add('btn-syncing');
                    forceSyncBtn.innerHTML = '<i class="fas fa-spinner"></i> Sincronizando...';
                    forceSyncBtn.disabled = true;
                } else {
                    forceSyncBtn.classList.remove('btn-syncing');
                    forceSyncBtn.innerHTML = '<i class="fas fa-sync"></i> Sincronizar';
                    forceSyncBtn.disabled = false;
                }
            }

            // ✅ Botão da página de clientes
            const syncCustomersBtn = document.getElementById('sync-customers-page-btn');
            if (syncCustomersBtn) {
                if (syncing) {
                    syncCustomersBtn.classList.add('btn-syncing');
                    syncCustomersBtn.innerHTML = '<i class="fas fa-spinner"></i> Sincronizando...';
                    syncCustomersBtn.disabled = true;
                } else {
                    syncCustomersBtn.classList.remove('btn-syncing');
                    syncCustomersBtn.innerHTML = '<i class="fas fa-sync"></i> Sincronizar Clientes';
                    syncCustomersBtn.disabled = false;
                }
            }

            // ✅ Atualizar status geral
            this.updateSyncStatus(syncing ? 'syncing' : 'success');
            
        } catch (error) {
            console.error('❌ Erro ao atualizar estado do botão:', error);
        }
    }

    // ✅ CORREÇÃO: Função para atualizar o status visual
    updateSyncStatus(status) {
        try {
            const syncStatusElement = document.getElementById('sync-status');
            if (syncStatusElement) {
                syncStatusElement.className = `sync-status ${status}`;
                syncStatusElement.textContent = 
                    status === 'success' ? 'Sincronizado' : 
                    status === 'error' ? 'Erro' : 'Sincronizando';
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading(true, 'Carregando dashboard...');
            
            const [statsResponse, metricsResponse] = await Promise.all([
                api.getDashboardStats(),
                api.getDashboardMetrics()
            ]);

            if (statsResponse.success) {
                this.updateDashboardStats(statsResponse.data);
            }

            if (metricsResponse.success) {
                this.updateDashboardMetrics(metricsResponse.data);
            }

        } catch (error) {
            console.error('❌ Erro ao carregar dashboard:', error);
            this.showNotification('Erro ao carregar dados do dashboard', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateDashboardStats(stats) {
        try {
            if (!stats) return;
            
            const elements = {
                'total-sales': stats.sales_today?.count ?? 0,
                'total-revenue': `R$ ${(stats.sales_today?.total ?? 0).toFixed(2)}`,
                'low-stock': stats.low_stock?.length ?? 0,
                'total-customers': stats.total_customers ?? 0
            };

            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });

            if (stats.recent_sales) {
                this.updateRecentSales(stats.recent_sales);
            }

            if (stats.weekly_sales) {
                this.updateSalesChart(stats.weekly_sales);
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas:', error);
        }
    }

    updateDashboardMetrics(metrics) {
        try {
            if (!metrics) return;

            const elements = {
                'average-ticket': `R$ ${(metrics.average_ticket || 0).toFixed(2)}`,
                'conversion-rate': `${metrics.conversion_rate || 0}%`,
                'top-product': metrics.top_product || 'N/A'
            };

            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });

        } catch (error) {
            console.error('❌ Erro ao atualizar métricas:', error);
        }
    }

    updateRecentSales(recentSales) {
        try {
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
                        <span class="sale-date">${new Date(sale.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div class="sale-amount">R$ ${parseFloat(sale.total_amount).toFixed(2)}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('❌ Erro ao atualizar vendas recentes:', error);
        }
    }

    updateSalesChart(weeklySales) {
        try {
            const canvas = document.getElementById('sales-chart');
            if (!canvas || !weeklySales) return;

            const ctx = canvas.getContext('2d');
            
            const labels = weeklySales.map(item => {
                const date = new Date(item.date);
                return date.toLocaleDateString('pt-BR', { weekday: 'short' });
            });
            
            const data = weeklySales.map(item => item.amount);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (window.salesChartInstance) {
                window.salesChartInstance.destroy();
            }

            if (typeof Chart !== 'undefined') {
                window.salesChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Vendas (R$)',
                            data: data,
                            borderColor: '#4361ee',
                            backgroundColor: 'rgba(67, 97, 238, 0.1)',
                            borderWidth: 2,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return 'R$ ' + value;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar gráfico:', error);
        }
    }

    // =============================================
    // ✅ MÓDULO DE VENDAS COMPLETO E FUNCIONAL
    // =============================================

    async loadSales() {
        try {
            console.log('🛒 Carregando vendas...');
            const response = await api.getSales();
            
            if (response.success) {
                this.sales = response.data || response.sales || [];
                console.log(`✅ ${this.sales.length} vendas carregadas`);
                this.renderSales();
                this.updateSalesStats();
            } else {
                throw new Error(response.error || 'Erro ao carregar vendas');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar vendas:', error);
            this.sales = [];
            this.renderSales();
            this.showNotification('Erro ao carregar vendas: ' + error.message, 'error');
        }
    }

    renderSales() {
        try {
            const tbody = document.getElementById('sales-table-body');
            if (!tbody) {
                console.log('❌ Tabela de vendas não encontrada');
                return;
            }

            if (!this.sales || this.sales.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="empty-state">
                            <i class="fas fa-shopping-cart"></i>
                            <p>Nenhuma venda encontrada</p>
                            <button class="btn btn-primary btn-sm" onclick="app.showSaleModal()">
                                <i class="fas fa-plus"></i> Realizar Primeira Venda
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }

            console.log('🎨 Renderizando vendas:', this.sales);

            tbody.innerHTML = this.sales.map(sale => {
                const saleDate = new Date(sale.created_at || sale.sale_date);
                const itemsCount = sale.items_count || (sale.items ? sale.items.length : 0);
                const totalAmount = parseFloat(sale.total_amount || sale.total || 0).toFixed(2);
                const customerName = sale.customer_name || 'Cliente não identificado';
                const paymentMethod = this.getPaymentMethodLabel(sale.payment_method);
                const status = this.getSaleStatus(sale.status);

                return `
                    <tr>
                        <td>
                            <strong>${sale.sale_code || 'N/A'}</strong>
                        </td>
                        <td>${customerName}</td>
                        <td>
                            ${saleDate.toLocaleDateString('pt-BR')}
                            <br><small class="text-muted">${saleDate.toLocaleTimeString('pt-BR')}</small>
                        </td>
                        <td>
                            <span class="badge badge-outline">${itemsCount} itens</span>
                        </td>
                        <td>
                            <strong>R$ ${totalAmount}</strong>
                        </td>
                        <td>${paymentMethod}</td>
                        <td>
                            <span class="badge ${status.class}">${status.text}</span>
                        </td>
                        <td>
                            <button class="btn btn-outline btn-sm" onclick="app.viewSaleDetails(${sale.id})" title="Detalhes">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="app.printSaleReceipt(${sale.id})" title="Imprimir">
                                <i class="fas fa-print"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            console.log('✅ Vendas renderizadas com sucesso');

        } catch (error) {
            console.error('❌ Erro ao renderizar vendas:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erro ao carregar vendas</p>
                        <button class="btn btn-outline btn-sm" onclick="app.loadSales()">
                            <i class="fas fa-redo"></i> Tentar Novamente
                        </button>
                    </td>
                </tr>
            `;
        }
    }

    updateSalesStats() {
        try {
            const today = new Date().toDateString();
            const todaySales = this.sales.filter(sale => {
                const saleDate = new Date(sale.created_at || sale.sale_date).toDateString();
                return saleDate === today;
            });

            const todayCount = todaySales.length;
            const todayRevenue = todaySales.reduce((sum, sale) => 
                sum + parseFloat(sale.total_amount || sale.total || 0), 0
            );
            const avgTicket = todayCount > 0 ? todayRevenue / todayCount : 0;

            // Atualizar elementos da interface
            const countElement = document.getElementById('sales-today-count');
            const revenueElement = document.getElementById('sales-today-revenue');
            const avgElement = document.getElementById('sales-avg-ticket');

            if (countElement) countElement.textContent = todayCount;
            if (revenueElement) revenueElement.textContent = `R$ ${todayRevenue.toFixed(2)}`;
            if (avgElement) avgElement.textContent = `R$ ${avgTicket.toFixed(2)}`;

        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas de vendas:', error);
        }
    }

    getPaymentMethodLabel(method) {
        const methods = {
            'dinheiro': 'Dinheiro',
            'cartao_credito': 'Cartão Crédito',
            'cartao_debito': 'Cartão Débito',
            'pix': 'PIX',
            'cartao': 'Cartão',
            'credit': 'Cartão Crédito',
            'debit': 'Cartão Débito'
        };
        return methods[method] || method || 'Não informado';
    }

    getSaleStatus(status) {
        const statusMap = {
            'completed': { class: 'badge-success', text: 'Concluída' },
            'pending': { class: 'badge-warning', text: 'Pendente' },
            'cancelled': { class: 'badge-danger', text: 'Cancelada' }
        };
        return statusMap[status] || { class: 'badge-secondary', text: 'Desconhecido' };
    }

    // ✅ MODAL DE VENDA COMPLETO
    showSaleModal() {
        try {
            this.closeAllModals();
            
            const modalHtml = `
                <div class="modal-overlay active" id="sale-modal">
                    <div class="modal-content xlarge">
                        <div class="modal-header">
                            <h3>Nova Venda</h3>
                            <button type="button" class="modal-close" onclick="app.closeModal('sale-modal')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="sale-container">
                                <!-- Cliente e Informações -->
                                <div class="sale-info-section">
                                    <div class="form-group">
                                        <label for="sale-customer">Cliente (Opcional)</label>
                                        <select id="sale-customer" class="form-control">
                                            <option value="">Selecione um cliente</option>
                                            ${this.customers.map(customer => `
                                                <option value="${customer.id}">${customer.name}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="sale-payment">Método de Pagamento *</label>
                                            <select id="sale-payment" class="form-control" required>
                                                <option value="">Selecione...</option>
                                                <option value="dinheiro">Dinheiro</option>
                                                <option value="cartao_credito">Cartão de Crédito</option>
                                                <option value="cartao_debito">Cartão de Débito</option>
                                                <option value="pix">PIX</option>
                                            </select>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label for="sale-observations">Observações</label>
                                            <input type="text" id="sale-observations" class="form-control" placeholder="Observações opcionais...">
                                        </div>
                                    </div>
                                </div>

                                <!-- Adicionar Produtos -->
                                <div class="sale-products-section">
                                    <div class="section-header">
                                        <h4>Produtos da Venda</h4>
                                        <button type="button" class="btn btn-outline btn-sm" onclick="app.showProductSelectionModal()">
                                            <i class="fas fa-plus"></i> Adicionar Produto
                                        </button>
                                    </div>
                                    
                                    <div class="sale-items-container">
                                        <table class="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Produto</th>
                                                    <th>Quantidade</th>
                                                    <th>Preço Unit.</th>
                                                    <th>Total</th>
                                                    <th>Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody id="sale-items-body">
                                                <tr>
                                                    <td colspan="5" class="empty-state">
                                                        <i class="fas fa-boxes"></i>
                                                        <p>Nenhum produto adicionado</p>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <!-- Resumo e Total -->
                                <div class="sale-summary-section">
                                    <div class="sale-totals">
                                        <div class="total-line">
                                            <span>Subtotal:</span>
                                            <span id="sale-subtotal">R$ 0,00</span>
                                        </div>
                                        <div class="total-line">
                                            <span>Total:</span>
                                            <span id="sale-total-amount" class="total-amount">R$ 0,00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="app.closeModal('sale-modal')">
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="app.finalizeSale()">
                                <i class="fas fa-check"></i> Finalizar Venda
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Inicializar a venda
            this.currentSale = {
                items: [],
                customer_id: null,
                payment_method: '',
                observations: ''
            };
            
            this.renderSaleItems();
            
        } catch (error) {
            console.error('❌ Erro ao abrir modal de venda:', error);
            this.showNotification('Erro ao abrir formulário de venda', 'error');
        }
    }

    showProductSelectionModal() {
        try {
            this.closeModal('product-selection-modal');

            const availableProducts = this.products.filter(p => p.is_active === 1 && (p.current_stock > 0));
            
            const modalHtml = `
                <div class="modal-overlay active" id="product-selection-modal">
                    <div class="modal-content large">
                        <div class="modal-header">
                            <h3>Selecionar Produtos (${availableProducts.length} disponíveis)</h3>
                            <div class="header-actions">
                                <button type="button" class="btn btn-outline btn-sm" onclick="app.closeModal('product-selection-modal')">
                                    <i class="fas fa-arrow-left"></i> Voltar para Venda
                                </button>
                                <button type="button" class="modal-close" onclick="app.closeModal('product-selection-modal')">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <input type="text" id="product-search-modal" class="form-control" 
                                       placeholder="Digite para buscar produtos..." onkeyup="app.filterProductsModal(this.value)">
                            </div>
                            
                            <div class="products-grid-modal" id="products-modal-list">
                                ${availableProducts.map(product => `
                                    <div class="product-card-modal" onclick="app.addProductToSale(${product.id})">
                                        <div class="product-info">
                                            <strong>${product.name}</strong>
                                            ${product.description ? `<div class="product-description">${product.description}</div>` : ''}
                                            <div class="product-details">
                                                <span class="stock ${product.current_stock < 10 ? 'low-stock' : ''}">
                                                    Estoque: ${product.current_stock}
                                                </span>
                                                <span class="price">R$ ${parseFloat(product.price).toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div class="product-action">
                                            <i class="fas fa-plus"></i>
                                        </div>
                                    </div>
                                `).join('')}
                                
                                ${availableProducts.length === 0 ? `
                                    <div class="empty-state">
                                        <i class="fas fa-boxes"></i>
                                        <p>Nenhum produto disponível em estoque</p>
                                        <button class="btn btn-primary btn-sm" onclick="app.closeModal('product-selection-modal')">
                                            <i class="fas fa-arrow-left"></i> Voltar
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <div class="selection-stats">
                                <strong>${this.currentSale.items.length} produtos</strong> adicionados à venda
                            </div>
                            <button type="button" class="btn btn-primary" onclick="app.closeModal('product-selection-modal')">
                                <i class="fas fa-check"></i> Concluir Seleção
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            setTimeout(() => {
                const searchField = document.getElementById('product-search-modal');
                if (searchField) searchField.focus();
            }, 200);

        } catch (error) {
            console.error('❌ Erro ao abrir modal de seleção:', error);
            this.showNotification('Erro ao abrir seleção de produtos', 'error');
        }
    }

    filterProductsModal(searchTerm) {
        try {
            const productCards = document.querySelectorAll('.product-card-modal');
            const searchLower = searchTerm.toLowerCase();
            
            productCards.forEach(card => {
                const productName = card.querySelector('strong').textContent.toLowerCase();
                const productDescription = card.querySelector('.product-description')?.textContent.toLowerCase() || '';
                
                if (productName.includes(searchLower) || productDescription.includes(searchLower)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        } catch (error) {
            console.error('❌ Erro ao filtrar produtos:', error);
        }
    }

    addProductToSale(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            if (!product) {
                this.showNotification('Produto não encontrado', 'error');
                return;
            }

            if (product.current_stock <= 0) {
                this.showNotification('Produto sem estoque disponível', 'error');
                return;
            }

            // Verificar se o produto já está na venda
            const existingItemIndex = this.currentSale.items.findIndex(item => item.product_id === productId);
            
            if (existingItemIndex >= 0) {
                // Aumentar quantidade se houver estoque
                const currentItem = this.currentSale.items[existingItemIndex];
                if (currentItem.quantity < product.current_stock) {
                    currentItem.quantity += 1;
                    currentItem.total = currentItem.quantity * currentItem.unit_price;
                    this.showNotification(`${product.name} quantidade aumentada para ${currentItem.quantity}`, 'success');
                } else {
                    this.showNotification('Estoque insuficiente para este produto', 'error');
                    return;
                }
            } else {
                // Adicionar novo item
                this.currentSale.items.push({
                    product_id: product.id,
                    product_name: product.name,
                    quantity: 1,
                    unit_price: parseFloat(product.price),
                    total: parseFloat(product.price)
                });
                this.showNotification(`${product.name} adicionado à venda`, 'success');
            }

            this.renderSaleItems();
            this.updateSaleTotal();

            setTimeout(() => {
                const searchField = document.getElementById('product-search-modal');
                if (searchField) searchField.focus();
            }, 100);

        } catch (error) {
            console.error('❌ Erro ao adicionar produto à venda:', error);
            this.showNotification('Erro ao adicionar produto', 'error');
        }
    }

    renderSaleItems() {
        try {
            const tbody = document.getElementById('sale-items-body');
            if (!tbody) return;

            if (!this.currentSale.items || this.currentSale.items.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-state">
                            <i class="fas fa-boxes"></i>
                            <p>Nenhum produto adicionado</p>
                            <small>Clique em "Adicionar Produto" para começar</small>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = this.currentSale.items.map((item, index) => {
                const product = this.products.find(p => p.id === item.product_id);
                const maxQuantity = product ? product.current_stock : 0;
                const isLowStock = maxQuantity < 10;

                return `
                    <tr>
                        <td>
                            <strong>${item.product_name}</strong>
                            <br>
                            <small class="text-muted ${isLowStock ? 'text-warning' : ''}">
                                Estoque: ${maxQuantity} ${isLowStock ? '⚠️' : ''}
                            </small>
                        </td>
                        <td>
                            <div class="quantity-controls">
                                <button type="button" class="qty-btn" onclick="app.updateSaleItemQuantity(${index}, ${item.quantity - 1})" 
                                        ${item.quantity <= 1 ? 'disabled' : ''}>
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${maxQuantity}"
                                       onchange="app.updateSaleItemQuantity(${index}, parseInt(this.value))"
                                       onblur="app.validateSaleItemQuantity(${index}, this)">
                                <button type="button" class="qty-btn" onclick="app.updateSaleItemQuantity(${index}, ${item.quantity + 1})"
                                        ${item.quantity >= maxQuantity ? 'disabled' : ''}>
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </td>
                        <td>R$ ${item.unit_price.toFixed(2)}</td>
                        <td><strong>R$ ${item.total.toFixed(2)}</strong></td>
                        <td>
                            <button class="btn btn-outline btn-sm" onclick="app.removeSaleItem(${index})" title="Remover">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

        } catch (error) {
            console.error('❌ Erro ao renderizar itens da venda:', error);
        }
    }

    updateSaleItemQuantity(itemIndex, newQuantity) {
        try {
            const item = this.currentSale.items[itemIndex];
            const product = this.products.find(p => p.id === item.product_id);
            
            if (!product) {
                this.showNotification('Produto não encontrado', 'error');
                return;
            }

            if (newQuantity < 1) {
                newQuantity = 1;
            }

            if (newQuantity > product.current_stock) {
                this.showNotification(`Quantidade indisponível. Estoque: ${product.current_stock}`, 'error');
                return;
            }

            item.quantity = newQuantity;
            item.total = item.quantity * item.unit_price;

            this.renderSaleItems();
            this.updateSaleTotal();

        } catch (error) {
            console.error('❌ Erro ao atualizar quantidade:', error);
            this.showNotification('Erro ao atualizar quantidade', 'error');
        }
    }

    validateSaleItemQuantity(itemIndex, inputElement) {
        try {
            const newQuantity = parseInt(inputElement.value);
            this.updateSaleItemQuantity(itemIndex, newQuantity);
        } catch (error) {
            console.error('❌ Erro ao validar quantidade:', error);
        }
    }

    removeSaleItem(itemIndex) {
        try {
            const item = this.currentSale.items[itemIndex];
            this.currentSale.items.splice(itemIndex, 1);
            this.renderSaleItems();
            this.updateSaleTotal();
            this.showNotification(`${item.product_name} removido da venda`, 'info');
        } catch (error) {
            console.error('❌ Erro ao remover item:', error);
            this.showNotification('Erro ao remover produto', 'error');
        }
    }

    updateSaleTotal() {
        try {
            const subtotal = this.currentSale.items.reduce((sum, item) => sum + item.total, 0);
            
            const subtotalElement = document.getElementById('sale-subtotal');
            const totalElement = document.getElementById('sale-total-amount');
            
            if (subtotalElement) subtotalElement.textContent = `R$ ${subtotal.toFixed(2)}`;
            if (totalElement) totalElement.textContent = `R$ ${subtotal.toFixed(2)}`;

        } catch (error) {
            console.error('❌ Erro ao calcular total:', error);
        }
    }

    async finalizeSale() {
        try {
            // Coletar dados do formulário
            const customerSelect = document.getElementById('sale-customer');
            const paymentSelect = document.getElementById('sale-payment');
            const observationsInput = document.getElementById('sale-observations');

            this.currentSale.customer_id = customerSelect?.value ? parseInt(customerSelect.value) : null;
            this.currentSale.payment_method = paymentSelect?.value || '';
            this.currentSale.observations = observationsInput?.value || '';

            // Validações
            if (!this.currentSale.payment_method) {
                this.showNotification('Selecione o método de pagamento', 'error');
                return;
            }

            if (this.currentSale.items.length === 0) {
                this.showNotification('Adicione pelo menos um produto à venda', 'error');
                return;
            }

            // Validar estoque
            for (const item of this.currentSale.items) {
                const product = this.products.find(p => p.id === item.product_id);
                if (!product) {
                    this.showNotification(`Produto "${item.product_name}" não encontrado`, 'error');
                    return;
                }
                if (item.quantity > product.current_stock) {
                    this.showNotification(`Estoque insuficiente para "${item.product_name}". Disponível: ${product.current_stock}`, 'error');
                    return;
                }
            }

            console.log('📤 Finalizando venda:', this.currentSale);

            this.showLoading(true, 'Processando venda...');

            const result = await api.createSale(this.currentSale);
            
            if (result && result.success) {
                this.showNotification('Venda realizada com sucesso!', 'success');
                this.closeModal('sale-modal');
                
                // Recarregar dados
                await this.loadSales();
                await this.loadProducts();
                await this.loadDashboardData();
                
            } else {
                throw new Error(result?.error || 'Erro desconhecido ao processar venda');
            }

        } catch (error) {
            console.error('❌ Erro ao finalizar venda:', error);
            this.showNotification('Erro ao finalizar venda: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async viewSaleDetails(saleId) {
        try {
            console.log('👀 Visualizando venda:', saleId);
            
            this.showLoading(true, 'Carregando detalhes da venda...');
            
            const response = await api.getSaleById(saleId);
            
            if (response.success) {
                this.showSaleDetailsModal(response.data);
            } else {
                throw new Error(response.error || 'Erro ao carregar venda');
            }
        } catch (error) {
            console.error('❌ Erro ao visualizar venda:', error);
            this.showNotification('Erro ao carregar detalhes da venda', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showSaleDetailsModal(sale) {
        try {
            this.closeAllModals();

            const modalHtml = `
                <div class="modal-overlay active" id="sale-details-modal">
                    <div class="modal-content large">
                        <div class="modal-header">
                            <h3>Detalhes da Venda #${sale.sale_code}</h3>
                            <button type="button" class="modal-close" onclick="app.closeModal('sale-details-modal')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="sale-details">
                                <div class="detail-section">
                                    <h4>Informações da Venda</h4>
                                    <div class="detail-grid">
                                        <div class="detail-item">
                                            <label>Data:</label>
                                            <span>${new Date(sale.created_at).toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Cliente:</label>
                                            <span>${sale.customer_name || 'Não informado'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Pagamento:</label>
                                            <span>${this.getPaymentMethodLabel(sale.payment_method)}</span>
                                        </div>
                                        <div class="detail-item">
                                            <label>Total:</label>
                                            <span class="total-amount">R$ ${parseFloat(sale.total_amount).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="detail-section">
                                    <h4>Itens da Venda</h4>
                                    <div class="table-container">
                                        <table class="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Produto</th>
                                                    <th>Quantidade</th>
                                                    <th>Preço Unit.</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${(sale.items || []).map(item => `
                                                    <tr>
                                                        <td>${item.product_name}</td>
                                                        <td>${item.quantity}</td>
                                                        <td>R$ ${parseFloat(item.unit_price).toFixed(2)}</td>
                                                        <td>R$ ${parseFloat(item.total_price || item.quantity * item.unit_price).toFixed(2)}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="app.closeModal('sale-details-modal')">
                                Fechar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="app.printSaleReceipt(${sale.id})">
                                <i class="fas fa-print"></i> Imprimir Comprovante
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

        } catch (error) {
            console.error('❌ Erro ao mostrar detalhes da venda:', error);
            this.showNotification('Erro ao exibir detalhes', 'error');
        }
    }

    async printSaleReceipt(saleId) {
        try {
            console.log('🖨️ Gerando comprovante para venda:', saleId);
            
            this.showLoading(true, 'Gerando comprovante...');
            
            const response = await api.getSaleById(saleId);
            
            if (response.success) {
                const sale = response.data;
                this.showPrintReceiptModal(sale);
            } else {
                throw new Error(response.error || 'Erro ao carregar venda para impressão');
            }
        } catch (error) {
            console.error('❌ Erro ao gerar comprovante:', error);
            this.showNotification('Erro ao gerar comprovante: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showPrintReceiptModal(sale) {
        try {
            this.closeAllModals();

            const receiptHtml = `
                <div class="modal-overlay active" id="print-receipt-modal">
                    <div class="modal-content print-receipt">
                        <div class="receipt-header">
                            <div class="receipt-logo">
                                <i class="fas fa-store"></i>
                                <h2>Garagem 67</h2>
                            </div>
                            <p>Bar e Conveniência</p>
                            <p>CNPJ: 12.345.678/0001-99</p>
                            <p>Endereço: Rua Exemplo, 123 - Centro</p>
                            <p>Telefone: (67) 99999-9999</p>
                        </div>
                        
                        <div class="receipt-body">
                            <div class="receipt-info">
                                <h3>COMPROVANTE DE VENDA</h3>
                                <div class="receipt-details">
                                    <div class="receipt-row">
                                        <span class="label">Código:</span>
                                        <span class="value">${sale.sale_code || 'N/A'}</span>
                                    </div>
                                    <div class="receipt-row">
                                        <span class="label">Data:</span>
                                        <span class="value">${new Date(sale.created_at).toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div class="receipt-row">
                                        <span class="label">Cliente:</span>
                                        <span class="value">${sale.customer_name || 'Consumidor'}</span>
                                    </div>
                                    <div class="receipt-row">
                                        <span class="label">Pagamento:</span>
                                        <span class="value">${this.getPaymentMethodLabel(sale.payment_method)}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="receipt-items">
                                <table class="receipt-table">
                                    <thead>
                                        <tr>
                                            <th>Produto</th>
                                            <th>Qtd</th>
                                            <th>Preço</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${(sale.items || []).map(item => `
                                            <tr>
                                                <td class="product-name">${item.product_name}</td>
                                                <td class="quantity">${item.quantity}</td>
                                                <td class="price">R$ ${parseFloat(item.unit_price).toFixed(2)}</td>
                                                <td class="total">R$ ${parseFloat(item.total_price || item.quantity * item.unit_price).toFixed(2)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>

                            <div class="receipt-totals">
                                <div class="receipt-row total">
                                    <span class="label">TOTAL:</span>
                                    <span class="value">R$ ${parseFloat(sale.total_amount).toFixed(2)}</span>
                                </div>
                            </div>

                            ${sale.observations ? `
                                <div class="receipt-observations">
                                    <strong>Observações:</strong>
                                    <p>${sale.observations}</p>
                                </div>
                            ` : ''}
                        </div>

                        <div class="receipt-footer">
                            <p>Obrigado pela preferência!</p>
                            <p>Volte sempre!</p>
                            <div class="receipt-qr">
                                <div class="qr-placeholder">
                                    <i class="fas fa-qrcode"></i>
                                    <span>Código da Venda: ${sale.sale_code}</span>
                                </div>
                            </div>
                        </div>

                        <div class="receipt-actions">
                            <button type="button" class="btn btn-outline" onclick="app.closeModal('print-receipt-modal')">
                                Fechar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="app.printReceipt()">
                                <i class="fas fa-print"></i> Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', receiptHtml);

        } catch (error) {
            console.error('❌ Erro ao mostrar comprovante:', error);
            this.showNotification('Erro ao gerar comprovante', 'error');
        }
    }

    printReceipt() {
        try {
            const receiptElement = document.querySelector('.print-receipt');
            if (!receiptElement) {
                this.showNotification('Comprovante não encontrado', 'error');
                return;
            }

            // Criar uma nova janela para impressão
            const printWindow = window.open('', '_blank');
            const receiptContent = receiptElement.innerHTML;
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Comprovante de Venda - Garagem 67</title>
                    <style>
                        body {
                            font-family: 'Courier New', monospace;
                            margin: 0;
                            padding: 10px;
                            font-size: 12px;
                            color: #000;
                        }
                        .print-receipt {
                            width: 80mm;
                            max-width: 80mm;
                            margin: 0 auto;
                        }
                        .receipt-header {
                            text-align: center;
                            border-bottom: 1px dashed #000;
                            padding-bottom: 10px;
                            margin-bottom: 10px;
                        }
                        .receipt-logo {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            margin-bottom: 5px;
                        }
                        .receipt-logo i {
                            font-size: 20px;
                            color: #4361ee;
                        }
                        .receipt-logo h2 {
                            margin: 0;
                            font-size: 16px;
                            color: #4361ee;
                        }
                        .receipt-header p {
                            margin: 2px 0;
                            font-size: 10px;
                        }
                        .receipt-info h3 {
                            text-align: center;
                            margin: 10px 0;
                            font-size: 12px;
                            border-bottom: 1px solid #000;
                            padding-bottom: 5px;
                        }
                        .receipt-details {
                            margin-bottom: 10px;
                        }
                        .receipt-row {
                            display: flex;
                            justify-content: space-between;
                            margin: 3px 0;
                        }
                        .receipt-row.total {
                            border-top: 2px solid #000;
                            padding-top: 5px;
                            margin-top: 5px;
                            font-weight: bold;
                            font-size: 14px;
                        }
                        .receipt-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 10px 0;
                        }
                        .receipt-table th {
                            border-bottom: 1px solid #000;
                            padding: 4px 2px;
                            text-align: left;
                            font-weight: bold;
                        }
                        .receipt-table td {
                            padding: 3px 2px;
                            border-bottom: 1px dashed #ddd;
                        }
                        .product-name {
                            max-width: 40mm;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }
                        .quantity, .price, .total {
                            text-align: center;
                            width: 15mm;
                        }
                        .receipt-observations {
                            margin: 10px 0;
                            padding: 5px;
                            border: 1px dashed #000;
                            font-size: 10px;
                        }
                        .receipt-footer {
                            text-align: center;
                            margin-top: 15px;
                            border-top: 1px dashed #000;
                            padding-top: 10px;
                        }
                        .receipt-qr {
                            margin: 10px 0;
                        }
                        .qr-placeholder {
                            border: 1px dashed #000;
                            padding: 10px;
                            text-align: center;
                            font-size: 10px;
                        }
                        .receipt-actions {
                            display: none;
                        }
                        @media print {
                            body {
                                margin: 0;
                                padding: 0;
                            }
                            .print-receipt {
                                width: 80mm !important;
                                max-width: 80mm !important;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-receipt">
                        ${receiptContent}
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() {
                                window.close();
                            }, 1000);
                        };
                    </script>
                </body>
                </html>
            `);

            printWindow.document.close();

        } catch (error) {
            console.error('❌ Erro ao imprimir comprovante:', error);
            this.showNotification('Erro ao imprimir comprovante', 'error');
        }
    }

    // =============================================
    // MÓDULO DE PRODUTOS
    // =============================================

    async loadProducts() {
        try {
            console.log('📦 Carregando produtos...');
            const response = await api.getProducts();
            
            if (response.success) {
                this.products = response.products || response.data || [];
                console.log(`✅ ${this.products.length} produtos carregados`);
                this.renderProducts();
            } else {
                throw new Error(response.error || 'Erro ao carregar produtos');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar produtos:', error);
            this.products = [];
            this.renderProducts();
            this.showNotification('Erro ao carregar produtos: ' + error.message, 'error');
        }
    }

    renderProducts() {
        try {
            const tbody = document.getElementById('products-table-body');
            if (!tbody) {
                console.log('❌ Tabela de produtos não encontrada');
                return;
            }

            if (!this.products || this.products.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-state">
                            <i class="fas fa-boxes"></i>
                            <p>Nenhum produto cadastrado</p>
                            <button class="btn btn-primary btn-sm" onclick="app.showProductModal()">
                                <i class="fas fa-plus"></i> Cadastrar Primeiro Produto
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }

            console.log('🎨 Renderizando produtos:', this.products);

            tbody.innerHTML = this.products.map(product => {
                const stock = product.current_stock || product.available_stock || 0;
                const category = product.category_name || 'Geral';
                const price = parseFloat(product.price || 0).toFixed(2);
                
                return `
                    <tr>
                        <td>
                            <strong>${product.name || 'Sem nome'}</strong>
                            ${product.description ? `<br><small class="text-muted">${product.description}</small>` : ''}
                        </td>
                        <td>${category}</td>
                        <td>R$ ${price}</td>
                        <td>
                            <span class="${stock < 10 ? 'text-warning' : 'text-success'}">
                                <strong>${stock}</strong>
                            </span>
                        </td>
                        <td>
                            <span class="badge ${product.is_active === 1 ? 'badge-success' : 'badge-secondary'}">
                                ${product.is_active === 1 ? 'Ativo' : 'Inativo'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-outline btn-sm" onclick="app.editProduct(${product.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="app.deleteProduct(${product.id})" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            console.log('✅ Produtos renderizados com sucesso');

        } catch (error) {
            console.error('❌ Erro ao renderizar produtos:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erro ao carregar produtos</p>
                        <button class="btn btn-outline btn-sm" onclick="app.loadProducts()">
                            <i class="fas fa-redo"></i> Tentar Novamente
                        </button>
                    </td>
                </tr>
            `;
        }
    }

    showProductModal() {
        try {
            this.closeAllModals();
            
            const modalHtml = `
                <div class="modal-overlay active" id="product-modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Novo Produto</h3>
                            <button type="button" class="modal-close" onclick="app.closeModal('product-modal')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="product-form">
                                <div class="form-group">
                                    <label for="product-name">Nome do Produto *</label>
                                    <input type="text" id="product-name" class="form-control" placeholder="Ex: Coca-Cola 350ml" required>
                                </div>
                                <div class="form-group">
                                    <label for="product-price">Preço (R$) *</label>
                                    <input type="number" id="product-price" class="form-control" step="0.01" min="0.01" placeholder="0.00" required>
                                </div>
                                <div class="form-group">
                                    <label for="product-stock">Estoque Inicial *</label>
                                    <input type="number" id="product-stock" class="form-control" min="0" value="0" required>
                                </div>
                                <div class="form-group">
                                    <label for="product-category">Categoria *</label>
                                    <select id="product-category" class="form-control" required>
                                        <option value="">Selecione uma categoria</option>
                                        <option value="1">Bebidas</option>
                                        <option value="2">Snacks</option>
                                        <option value="3">Tabacaria</option>
                                        <option value="4">Conveniência</option>
                                        <option value="5">Outros</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="app.closeModal('product-modal')">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="app.createProduct()">
                                <i class="fas fa-save"></i> Salvar Produto
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            setTimeout(() => {
                const nameField = document.getElementById('product-name');
                if (nameField) nameField.focus();
            }, 100);
            
        } catch (error) {
            console.error('❌ Erro ao abrir modal de produto:', error);
            this.showNotification('Erro ao abrir formulário', 'error');
        }
    }

    async createProduct() {
        try {
            const name = document.getElementById('product-name')?.value.trim();
            const price = parseFloat(document.getElementById('product-price')?.value);
            const stock = parseInt(document.getElementById('product-stock')?.value) || 0;
            const category_id = parseInt(document.getElementById('product-category')?.value);

            console.log('📝 Dados do produto:', { name, price, stock, category_id });

            if (!name) {
                this.showNotification('Nome do produto é obrigatório', 'error');
                return;
            }

            if (isNaN(price) || price <= 0) {
                this.showNotification('Preço deve ser maior que zero', 'error');
                return;
            }

            if (isNaN(stock) || stock < 0) {
                this.showNotification('Estoque deve ser um número positivo', 'error');
                return;
            }

            if (isNaN(category_id) || category_id <= 0) {
                this.showNotification('Selecione uma categoria válida', 'error');
                return;
            }

            const productData = {
                name: name,
                price: price,
                category_id: category_id,
                stock_initial: stock
            };

            console.log('📤 Enviando produto:', productData);

            this.showLoading(true, 'Salvando produto...');

            const result = await api.createProduct(productData);
            
            if (result && result.success) {
                this.showNotification('Produto criado com sucesso!', 'success');
                this.closeModal('product-modal');
                
                await this.loadProducts();
                this.loadDashboardData();
            } else {
                throw new Error(result?.error || 'Erro desconhecido');
            }
        } catch (error) {
            console.error('❌ Erro ao criar produto:', error);
            this.showNotification('Erro ao criar produto: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async editProduct(productId) {
        try {
            console.log('✏️ Editando produto:', productId);
            
            this.showLoading(true, 'Carregando dados do produto...');
            
            const response = await api.getProductById(productId);
            
            if (response.success) {
                const product = response.data;
                this.showEditProductModal(product);
            } else {
                throw new Error(response.error || 'Erro ao carregar produto');
            }
        } catch (error) {
            console.error('❌ Erro ao editar produto:', error);
            this.showNotification('Erro ao carregar produto: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showEditProductModal(product) {
        try {
            this.closeAllModals();
            
            const modalHtml = `
                <div class="modal-overlay active" id="edit-product-modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Editar Produto</h3>
                            <button type="button" class="modal-close" onclick="app.closeModal('edit-product-modal')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-product-form">
                                <input type="hidden" id="edit-product-id" value="${product.id}">
                                <div class="form-group">
                                    <label for="edit-product-name">Nome do Produto *</label>
                                    <input type="text" id="edit-product-name" class="form-control" 
                                           value="${product.name || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label for="edit-product-price">Preço (R$) *</label>
                                    <input type="number" id="edit-product-price" class="form-control" 
                                           step="0.01" min="0.01" value="${parseFloat(product.price || 0).toFixed(2)}" required>
                                </div>
                                <div class="form-group">
                                    <label for="edit-product-stock">Estoque Atual</label>
                                    <input type="number" id="edit-product-stock" class="form-control" 
                                           min="0" value="${product.current_stock || 0}" readonly
                                           style="background-color: #f8f9fa;">
                                    <small class="text-muted">Para alterar o estoque, use a página de inventário</small>
                                </div>
                                <div class="form-group">
                                    <label for="edit-product-category">Categoria *</label>
                                    <select id="edit-product-category" class="form-control" required>
                                        <option value="">Selecione uma categoria</option>
                                        <option value="1" ${product.category_id == 1 ? 'selected' : ''}>Bebidas</option>
                                        <option value="2" ${product.category_id == 2 ? 'selected' : ''}>Snacks</option>
                                        <option value="3" ${product.category_id == 3 ? 'selected' : ''}>Tabacaria</option>
                                        <option value="4" ${product.category_id == 4 ? 'selected' : ''}>Conveniência</option>
                                        <option value="5" ${product.category_id == 5 ? 'selected' : ''}>Outros</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="edit-product-description">Descrição</label>
                                    <textarea id="edit-product-description" class="form-control" 
                                              rows="3" placeholder="Descrição opcional do produto">${product.description || ''}</textarea>
                                </div>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="edit-product-active" ${product.is_active === 1 ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                        Produto ativo
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="app.closeModal('edit-product-modal')">
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-danger" onclick="app.deleteProduct(${product.id})" 
                                    style="margin-right: auto;">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                            <button type="button" class="btn btn-primary" onclick="app.updateProduct()">
                                <i class="fas fa-save"></i> Atualizar Produto
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            setTimeout(() => {
                const nameField = document.getElementById('edit-product-name');
                if (nameField) nameField.focus();
            }, 100);
            
        } catch (error) {
            console.error('❌ Erro ao abrir modal de edição:', error);
            this.showNotification('Erro ao abrir formulário de edição', 'error');
        }
    }

    async updateProduct() {
        try {
            const productId = document.getElementById('edit-product-id')?.value;
            const name = document.getElementById('edit-product-name')?.value.trim();
            const price = parseFloat(document.getElementById('edit-product-price')?.value);
            const category_id = parseInt(document.getElementById('edit-product-category')?.value);
            const description = document.getElementById('edit-product-description')?.value.trim();
            const is_active = document.getElementById('edit-product-active')?.checked ? 1 : 0;

            console.log('📝 Dados do produto para atualizar:', { 
                productId, name, price, category_id, description, is_active 
            });

            if (!name) {
                this.showNotification('Nome do produto é obrigatório', 'error');
                return;
            }

            if (isNaN(price) || price <= 0) {
                this.showNotification('Preço deve ser maior que zero', 'error');
                return;
            }

            if (isNaN(category_id) || category_id <= 0) {
                this.showNotification('Selecione uma categoria válida', 'error');
                return;
            }

            const productData = {
                name: name,
                price: price,
                category_id: category_id,
                description: description,
                is_active: is_active
            };

            console.log('📤 Atualizando produto:', productData);

            this.showLoading(true, 'Atualizando produto...');

            const result = await api.updateProduct(productId, productData);
            
            if (result && result.success) {
                this.showNotification('Produto atualizado com sucesso!', 'success');
                this.closeModal('edit-product-modal');
                
                await this.loadProducts();
                
            } else {
                throw new Error(result?.error || 'Erro desconhecido ao atualizar');
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar produto:', error);
            this.showNotification('Erro ao atualizar produto: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteProduct(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            if (!product) {
                this.showNotification('Produto não encontrado', 'error');
                return;
            }

            const confirmMessage = `Tem certeza que deseja excluir o produto "${product.name}"?\n\nEsta ação não pode ser desfeita.`;
            
            if (!confirm(confirmMessage)) {
                return;
            }

            this.showLoading(true, 'Excluindo produto...');

            const result = await api.deleteProduct(productId);
            
            if (result && result.success) {
                this.showNotification('Produto excluído com sucesso!', 'success');
                this.closeModal('edit-product-modal');
                
                await this.loadProducts();
                
            } else {
                throw new Error(result?.error || 'Erro desconhecido ao excluir');
            }
        } catch (error) {
            console.error('❌ Erro ao excluir produto:', error);
            this.showNotification('Erro ao excluir produto: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // =============================================
    // MÓDULO DE CLIENTES
    // =============================================

    async loadCustomers() {
        try {
            this.customers = [
                {
                    id: 1,
                    name: 'Cliente Exemplo 1',
                    email: 'cliente1@email.com',
                    phone: '(67) 99999-9999',
                    last_sync: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Cliente Exemplo 2',
                    email: 'cliente2@email.com', 
                    phone: '(67) 98888-8888',
                    last_sync: new Date().toISOString()
                }
            ];
            this.renderCustomers();
        } catch (error) {
            console.error('❌ Erro ao carregar clientes:', error);
            this.customers = [];
            this.renderCustomers();
        }
    }

    renderCustomers() {
        try {
            const tbody = document.getElementById('customers-table-body');
            if (!tbody) return;

            if (this.customers.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="empty-state">
                            <i class="fas fa-users"></i>
                            <p>Nenhum cliente encontrado</p>
                            <button class="btn btn-primary btn-sm" onclick="app.syncCustomers()">
                                <i class="fas fa-sync"></i> Sincronizar Clientes
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = this.customers.map(customer => `
                <tr>
                    <td>
                        <strong>${customer.name}</strong>
                        <br><small class="text-muted">ID: ${customer.id}</small>
                    </td>
                    <td>${customer.email || 'N/A'}</td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td>${new Date(customer.last_sync).toLocaleDateString('pt-BR')}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('❌ Erro ao renderizar clientes:', error);
        }
    }

    // =============================================
    // FUNÇÕES UTILITÁRIAS
    // =============================================

    async loadReports() {
        try {
            console.log('📊 Carregando dados para relatórios...');
        } catch (error) {
            console.error('❌ Erro ao carregar relatórios:', error);
        }
    }

    refreshDashboard() {
        console.log('🔄 Atualizando dashboard...');
        this.loadDashboardData();
        this.showNotification('Dashboard atualizado', 'success');
    }

    closeModal(modalId) {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.remove();
            }
        } catch (error) {
            console.error('❌ Erro ao fechar modal:', error);
        }
    }

    closeAllModals() {
        try {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.remove();
            });
        } catch (error) {
            console.error('❌ Erro ao fechar modais:', error);
        }
    }

    showNotification(message, type = 'info') {
        try {
            console.log(`💬 Notificação [${type}]: ${message}`);
            
            const notification = document.createElement('div');
            notification.className = `notification ${type} show`;
            notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-icon">
                        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
                    </div>
                    <div class="notification-message">${message}</div>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

            document.body.appendChild(notification);

            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        } catch (error) {
            console.error('❌ Erro ao mostrar notificação:', error);
        }
    }

    showLoading(show, message = 'Carregando...') {
        try {
            const overlay = document.getElementById('loading-overlay');
            const messageElement = document.getElementById('loading-message');
            
            if (overlay && messageElement) {
                if (show) {
                    messageElement.textContent = message;
                    overlay.style.display = 'flex';
                    setTimeout(() => {
                        overlay.style.opacity = '1';
                    }, 10);
                } else {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.style.display = 'none';
                    }, 300);
                }
            }
        } catch (error) {
            console.error('❌ Erro ao mostrar loading:', error);
        }
    }

    async debugReloadProducts() {
        console.log('🐛 DEBUG: Recarregando produtos...');
        await this.loadProducts();
        
        console.log('📦 Produtos carregados:', this.products);
        
        if (this.products && this.products.length > 0) {
            this.showNotification(`✅ ${this.products.length} produtos carregados`, 'success');
        } else {
            this.showNotification('❌ Nenhum produto carregado', 'error');
        }
    }
}

console.log('✅ DOM pronto - Criando EnhancedApp Corrigido...');
document.addEventListener('DOMContentLoaded', function() {
    try {
        window.app = new EnhancedApp();
        console.log('🎯 EnhancedApp Corrigido criado com sucesso!');
    } catch (error) {
        console.error('💥 Erro crítico na criação do EnhancedApp:', error);
    }
});