class SyncManager {
    constructor() {
        this.isSyncing = false;
        this.lastSync = null;
        this.syncInterval = null;
        this.autoSyncEnabled = true;
    }

    startBackgroundSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(() => {
            if (this.autoSyncEnabled && !this.isSyncing) {
                this.autoSync();
            }
        }, 300000);

        console.log('🔄 Sincronização em segundo plano ativada');
    }

    stopBackgroundSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('🔄 Sincronização em segundo plano desativada');
    }

    async autoSync() {
        if (this.isSyncing) {
            console.log('🔄 Sincronização já em andamento...');
            return;
        }

        this.isSyncing = true;
        
        try {
            console.log('🔄 Iniciando sincronização automática...');
            
            await api.syncCustomers();
            
            this.lastSync = new Date();
            this.updateSyncStatus();
            
            console.log('✅ Sincronização automática concluída');
            
        } catch (error) {
            console.error('❌ Erro na sincronização automática:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    async forceSync() {
        this.isSyncing = true;
        app.showLoading(true, 'Sincronizando dados...');
        
        try {
            const response = await api.forceSync();
            
            if (response.success) {
                this.lastSync = new Date();
                this.updateSyncStatus();
                
                app.showNotification('Sincronização forçada concluída com sucesso', 'success');
                app.refreshDashboard();
                
            } else {
                throw new Error(response.error || 'Erro na sincronização');
            }
            
        } catch (error) {
            console.error('❌ Erro na sincronização forçada:', error);
            app.showNotification('Erro na sincronização: ' + error.message, 'error');
        } finally {
            this.isSyncing = false;
            app.showLoading(false);
        }
    }

    updateSyncStatus() {
        const statusElement = document.getElementById('sync-status');
        
        if (statusElement) {
            statusElement.textContent = this.isSyncing ? 'Sincronizando...' : 'Sincronizado';
            statusElement.className = this.isSyncing ? 'sync-status syncing' : 'sync-status synced';
        }
    }

    getSyncStatus() {
        return {
            isSyncing: this.isSyncing,
            lastSync: this.lastSync,
            autoSyncEnabled: this.autoSyncEnabled
        };
    }

    enableAutoSync() {
        this.autoSyncEnabled = true;
        this.startBackgroundSync();
    }

    disableAutoSync() {
        this.autoSyncEnabled = false;
        this.stopBackgroundSync();
    }
}

window.syncManager = new SyncManager();