class LocalStorageService {
    constructor() {
        this.prefix = 'sales_manager_';
    }

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

    getUserData() {
        return this.get('user_data', null);
    }

    saveUserData(userData) {
        return this.set('user_data', userData);
    }

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

    getLastSync(key) {
        return this.get(`last_sync_${key}`, null);
    }

    setLastSync(key, timestamp = new Date().toISOString()) {
        return this.set(`last_sync_${key}`, timestamp);
    }

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
}

window.localStorageService = new LocalStorageService();