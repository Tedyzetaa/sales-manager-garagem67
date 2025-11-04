class CacheManager {
    constructor() {
        this.cache = new Map();
        this.maxSize = 100;
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    set(key, data, ttl = 300000) {
        this.cleanup();
        
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl,
            timestamp: Date.now()
        });
        
        console.log(`💾 Cache salvo: ${key} (TTL: ${ttl}ms)`);
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            console.log(`💾 Cache miss: ${key}`);
            return null;
        }
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            console.log(`💾 Cache expirado: ${key}`);
            return null;
        }
        
        console.log(`💾 Cache hit: ${key}`);
        return item.data;
    }

    delete(key) {
        this.cache.delete(key);
        console.log(`💾 Cache removido: ${key}`);
    }

    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} itens expirados removidos do cache`);
        }
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            keys: Array.from(this.cache.keys())
        };
    }

    clear() {
        this.cache.clear();
        console.log('💾 Cache limpo completamente');
    }
}

window.cacheManager = new CacheManager();