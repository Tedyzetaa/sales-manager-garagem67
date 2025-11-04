class DashboardManager {
    constructor() {
        this.charts = new Map();
        this.updateInterval = null;
        this.realTimeEnabled = true;
    }

    startRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            if (app.currentPage === 'dashboard') {
                this.refreshData();
            }
        }, 30000);

        console.log('🔄 Atualizações em tempo real ativadas');
    }

    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('🔄 Atualizações em tempo real desativadas');
    }

    async refreshData() {
        try {
            await app.loadDashboardData();
            console.log('📊 Dashboard atualizado em tempo real');
        } catch (error) {
            console.error('❌ Erro ao atualizar dashboard:', error);
        }
    }

    initializeAdvancedCharts() {
        // Pode ser expandido para mais gráficos
        console.log('📊 Gráficos avançados inicializados');
    }

    updateCharts(data) {
        // Atualizar gráficos com novos dados
        if (data && app.salesChart) {
            app.updateSalesChart(data.dailySales);
        }
    }
}

window.dashboardManager = new DashboardManager();