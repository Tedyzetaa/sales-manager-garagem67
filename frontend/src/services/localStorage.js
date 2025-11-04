class LocalStorageService {
    constructor() {
        this.prefix = 'sales_manager_';
    }

    // Métodos básicos
    set(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serializedValue);
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar no localStorage:', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (error) {
            console.error('❌ Erro ao ler do localStorage:', error);
            return defaultValue;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('❌ Erro ao remover do localStorage:', error);
            return false;
        }
    }

    clear() {
        try {
            // Remove apenas as chaves do prefixo do Sales Manager
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log('🗑️ localStorage limpo');
            return true;
        } catch (error) {
            console.error('❌ Erro ao limpar localStorage:', error);
            return false;
        }
    }

    // Métodos específicos da aplicação

    // 🛒 Carrinho de vendas
    getCart() {
        return this.get('cart', []);
    }

    saveCart(cart) {
        const success = this.set('cart', cart);
        if (success) {
            console.log('💾 Carrinho salvo:', cart.length, 'itens');
        }
        return success;
    }

    clearCart() {
        return this.remove('cart');
    }

    // 👤 Dados do usuário
    getUserData() {
        return this.get('user_data', null);
    }

    saveUserData(userData) {
        return this.set('user_data', userData);
    }

    // ⚙️ Configurações
    getSettings() {
        return this.get('settings', {
            theme: 'light',
            language: 'pt-BR',
            notifications: true,
            autoSync: true
        });
    }

    saveSettings(settings) {
        return this.set('settings', settings);
    }

    // 📊 Dados de cache
    getCachedData(key) {
        const cached = this.get(`cache_${key}`);
        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data, ttlMinutes = 5) {
        const cached = {
            data: data,
            expiry: Date.now() + (ttlMinutes * 60 * 1000)
        };
        return this.set(`cache_${key}`, cached);
    }

    // 🔄 Sincronização
    getLastSync(key) {
        return this.get(`last_sync_${key}`, null);
    }

    setLastSync(key, timestamp = new Date().toISOString()) {
        return this.set(`last_sync_${key}`, timestamp);
    }

    // 📈 Estatísticas locais
    getLocalStats() {
        return this.get('local_stats', {
            totalSales: 0,
            totalRevenue: 0,
            favoriteProducts: []
        });
    }

    updateLocalStats(newStats) {
        const currentStats = this.getLocalStats();
        const updatedStats = { ...currentStats, ...newStats };
        return this.set('local_stats', updatedStats);
    }

    // 🏪 Dados da loja
    getStoreInfo() {
        return this.get('store_info', {
            name: 'Garagem 67',
            phone: '(67) 99999-9999',
            address: 'Endereço da loja',
            logo: null
        });
    }

    saveStoreInfo(storeInfo) {
        return this.set('store_info', storeInfo);
    }

    // Métodos utilitários
    getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                keys.push(key.replace(this.prefix, ''));
            }
        }
        return keys;
    }

    getSize() {
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                const value = localStorage.getItem(key);
                totalSize += key.length + (value ? value.length : 0);
            }
        }
        return totalSize;
    }

    // Backup e restore
    createBackup() {
        const backup = {};
        const keys = this.getAllKeys();
        keys.forEach(key => {
            backup[key] = this.get(key);
        });
        return backup;
    }

    restoreBackup(backup) {
        try {
            Object.keys(backup).forEach(key => {
                this.set(key, backup[key]);
            });
            console.log('✅ Backup restaurado com sucesso');
            return true;
        } catch (error) {
            console.error('❌ Erro ao restaurar backup:', error);
            return false;
        }
    }

    // Limpeza de dados expirados
    cleanupExpired() {
        const keys = this.getAllKeys();
        let cleaned = 0;
        
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                const cached = this.get(key);
                if (cached && cached.expiry && cached.expiry < Date.now()) {
                    this.remove(key);
                    cleaned++;
                }
            }
        });
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} itens expirados removidos`);
        }
        
        return cleaned;
    }
}



// Instância global do serviço de localStorage
window.localStorageService = new LocalStorageService();

// Limpeza automática ao inicializar
window.localStorageService.cleanupExpired();

// Adicionar ao localStorageService.js
class CacheManager {
    constructor() {
        this.prefix = 'sales_manager_cache_';
        this.defaultTTL = 5 * 60 * 1000; // 5 minutos
    }

    set(key, data, ttl = this.defaultTTL) {
        const item = {
            data,
            expiry: Date.now() + ttl,
            timestamp: Date.now()
        };
        localStorageService.set(`${this.prefix}${key}`, item);
    }

    get(key) {
        const item = localStorageService.get(`${this.prefix}${key}`);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.remove(key);
            return null;
        }

        return item.data;
    }

    remove(key) {
        localStorageService.remove(`${this.prefix}${key}`);
    }

    clear() {
        const keys = localStorageService.getAllKeys();
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorageService.remove(key);
            }
        });
    }

    // Cache para dados frequentemente acessados
    async getWithCache(key, fetchFunction, ttl = this.defaultTTL) {
        const cached = this.get(key);
        if (cached) {
            return cached;
        }

        const freshData = await fetchFunction();
        this.set(key, freshData, ttl);
        return freshData;
    }
}

window.cacheManager = new CacheManager();