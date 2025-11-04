// frontend/js/sync-manager.js
class SyncManager {
    constructor() {
        this.syncInProgress = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkSyncStatus();
        this.loadSyncHistory();
    }

    bindEvents() {
        // Botão de sincronização completa
        document.getElementById('full-sync-btn')?.addEventListener('click', () => {
            this.fullSync();
        });

        // Botão de sincronização rápida
        document.getElementById('quick-sync-btn')?.addEventListener('click', () => {
            this.quickSync();
        });

        // Botão de download JSON
        document.getElementById('download-json-btn')?.addEventListener('click', () => {
            this.downloadEntregador67Json();
        });
    }

    // 🔄 Sincronização completa
    async fullSync() {
        if (this.syncInProgress) {
            this.showNotification('Sincronização já em andamento', 'warning');
            return;
        }

        this.setSyncState(true);
        
        try {
            this.showNotification('Iniciando sincronização completa...', 'info');
            
            const response = await this.apiPost('/api/sync/customers/full-sync');
            
            if (response.success) {
                this.showNotification(
                    `Sincronização concluída! ${response.data.statistics.synced} clientes processados`, 
                    'success'
                );
                this.updateSyncUI(response.data);
                this.loadSyncHistory();
            } else {
                throw new Error(response.error || 'Erro na sincronização');
            }
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            this.showNotification(`Erro na sincronização: ${error.message}`, 'error');
        } finally {
            this.setSyncState(false);
        }
    }

    // ⚡ Sincronização rápida
    async quickSync() {
        if (this.syncInProgress) {
            this.showNotification('Sincronização já em andamento', 'warning');
            return;
        }

        this.setSyncState(true);
        
        try {
            this.showNotification('Iniciando sincronização rápida...', 'info');
            
            const response = await this.apiPost('/api/sync/customers/quick-sync');
            
            if (response.success) {
                this.showNotification(
                    `Sincronização rápida concluída! ${response.data.newCustomers} novos clientes`, 
                    'success'
                );
                this.updateSyncUI(response.data);
                this.loadSyncHistory();
            } else {
                throw new Error(response.error || 'Erro na sincronização rápida');
            }
        } catch (error) {
            console.error('❌ Erro na sincronização rápida:', error);
            this.showNotification(`Erro na sincronização: ${error.message}`, 'error');
        } finally {
            this.setSyncState(false);
        }
    }

    // 📥 Download JSON Entregador67
    async downloadEntregador67Json() {
        try {
            const token = this.getToken();
            const response = await fetch('/api/sync/entregador67-json', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Falha no download');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `entregador67_customers_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showNotification('JSON baixado com sucesso!', 'success');
        } catch (error) {
            console.error('❌ Erro ao baixar JSON:', error);
            this.showNotification('Erro ao baixar JSON', 'error');
        }
    }

    // 📊 Verificar status da sincronização
    async checkSyncStatus() {
        try {
            const response = await this.apiGet('/api/sync/status');
            if (response.success) {
                this.updateStatusUI(response.data);
            }
        } catch (error) {
            console.error('❌ Erro ao verificar status:', error);
        }
    }

    // 📜 Carregar histórico de sincronizações
    async loadSyncHistory() {
        try {
            const response = await this.apiGet('/api/sync/history');
            if (response.success) {
                this.updateHistoryUI(response.data);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar histórico:', error);
        }
    }

    // 🎨 Atualizar UI do status
    updateStatusUI(status) {
        const statusElement = document.getElementById('sync-status');
        const lastSyncElement = document.getElementById('last-sync-time');
        
        if (statusElement) {
            if (status.syncInProgress) {
                statusElement.innerHTML = '<i class="fas fa-sync fa-spin"></i> Sincronizando...';
                statusElement.className = 'sync-status syncing';
            } else if (status.isInitialized) {
                statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Conectado';
                statusElement.className = 'sync-status connected';
            } else {
                statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Desconectado';
                statusElement.className = 'sync-status error';
            }
        }

        if (lastSyncElement) {
            lastSyncElement.textContent = status.lastSync ? 
                this.formatDate(status.lastSync) : 'Nunca';
        }
    }

    // 🎨 Atualizar UI com resultados
    updateSyncUI(syncData) {
        const statsElement = document.getElementById('sync-stats');
        if (statsElement && syncData.statistics) {
            statsElement.innerHTML = `
                <div class="stat-item">
                    <span class="stat-value">${syncData.statistics.created}</span>
                    <span class="stat-label">Novos</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${syncData.statistics.updated}</span>
                    <span class="stat-label">Atualizados</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${syncData.statistics.synced}</span>
                    <span class="stat-label">Total</span>
                </div>
            `;
        }
    }

    // 📜 Atualizar histórico na UI
    updateHistoryUI(history) {
        const historyElement = document.getElementById('sync-history');
        if (!historyElement) return;

        if (!history || history.length === 0) {
            historyElement.innerHTML = `
                <div class="history-placeholder">
                    <i class="fas fa-history"></i>
                    <p>Nenhuma sincronização realizada ainda</p>
                </div>
            `;
            return;
        }

        historyElement.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-session">
                    <strong>${item.session_id}</strong><br>
                    <small>${this.formatDate(item.sync_date)}</small>
                </div>
                <div class="history-stats">
                    <div class="history-stat">
                        <span class="count">${item.items_created}</span>
                        <span>Novos</span>
                    </div>
                    <div class="history-stat">
                        <span class="count">${item.items_updated}</span>
                        <span>Atualizados</span>
                    </div>
                    <div class="history-stat">
                        <span class="count">${item.total_synced}</span>
                        <span>Total</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 🔄 Controlar estado da sincronização
    setSyncState(inProgress) {
        this.syncInProgress = inProgress;
        
        const syncBtn = document.getElementById('full-sync-btn');
        const quickBtn = document.getElementById('quick-sync-btn');
        const downloadBtn = document.getElementById('download-json-btn');
        
        if (syncBtn) {
            syncBtn.disabled = inProgress;
            syncBtn.innerHTML = inProgress 
                ? '<i class="fas fa-sync fa-spin"></i> Sincronizando...' 
                : '<i class="fas fa-sync"></i> Sincronizar Tudo';
        }
        
        if (quickBtn) {
            quickBtn.disabled = inProgress;
        }

        if (downloadBtn) {
            downloadBtn.disabled = inProgress;
        }

        this.updateStatusUI({ syncInProgress: inProgress });
    }

    // 📅 Formatar data
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    }

    // 🔐 Obter token JWT
    getToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    // 🌐 API Helper - POST
    async apiPost(endpoint, data = {}) {
        const token = this.getToken();
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    // 🌐 API Helper - GET
    async apiGet(endpoint) {
        const token = this.getToken();
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await response.json();
    }

    // 💬 Mostrar notificação
    showNotification(message, type = 'info') {
        // Usar sistema de notificação existente ou fallback
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            // Fallback simples
            const alertClass = type === 'error' ? 'alert-danger' : 
                             type === 'success' ? 'alert-success' : 'alert-info';
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.syncManager = new SyncManager();
});