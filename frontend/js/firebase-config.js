// frontend/js/firebase-config.js - CONFIGURAÇÃO OFICIAL GARAGEM67 - ATUALIZADO
console.log('🔥 Carregando Firebase Config para Sales Manager...');

class FirebaseConfig {
    constructor() {
        // 🔥 CONFIGURAÇÃO DO FIREBASE DA GARAGEM67 (OFICIAL)
        this.config = {
            apiKey: "AIzaSyBbgzZ21aPFHmeoeahk40eMllzEfCcI7BQ",
            authDomain: "garagem67-c38cf.firebaseapp.com",
            projectId: "garagem67-c38cf",
            storageBucket: "garagem67-c38cf.firebasestorage.app",
            messagingSenderId: "579533283807",
            appId: "1:579533283807:web:576c2e605fd10b3003646a",
            measurementId: "G-DJBE38Q37W"
        };

        this.appSettings = {
            storeName: "Garagem 67",
            storePhone: "67998668032",
            storeCity: "Ivinhema",
            storeState: "MS",
            currency: "BRL"
        };

        this.isInitialized = false;
        this.initializationPromise = null;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async initializeFirebase() {
        if (this.isInitialized) {
            return true;
        }

        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = new Promise(async (resolve, reject) => {
            try {
                console.log('🚀 Inicializando Firebase para Sales Manager...');
                
                // Verifica se o Firebase está disponível
                if (typeof firebase === 'undefined') {
                    console.error('❌ Firebase SDK não carregado');
                    await this.loadFirebaseSDK();
                }

                // Inicializa o Firebase
                const app = firebase.initializeApp(this.config, 'SalesManagerSync');
                
                // Configurações otimizadas para sincronização
                const firestoreSettings = {
                    experimentalForceLongPolling: true,
                    merge: true
                };

                this.firestore = app.firestore();
                this.firestore.settings(firestoreSettings);
                
                this.auth = app.auth();
                this.storage = app.storage();
                
                this.isInitialized = true;
                this.retryCount = 0;
                
                console.log('✅ Firebase inicializado com sucesso para Sales Manager!');
                resolve(true);

            } catch (error) {
                console.error('❌ Erro ao inicializar Firebase:', error);
                
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    const delay = Math.pow(2, this.retryCount) * 1000;
                    console.log(`🔄 Tentativa ${this.retryCount}/${this.maxRetries} em ${delay}ms`);
                    
                    setTimeout(() => {
                        this.initializationPromise = null;
                        this.initializeFirebase().then(resolve).catch(reject);
                    }, delay);
                } else {
                    this.initializationPromise = null;
                    console.error('💥 Máximo de tentativas excedido. Modo offline ativado.');
                    reject(new Error('Falha na conexão Firebase após múltiplas tentativas'));
                }
            }
        });

        return this.initializationPromise;
    }

    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            if (typeof firebase !== 'undefined') {
                resolve();
                return;
            }

            console.log('📦 Carregando Firebase SDK dinamicamente...');
            
            const scriptApp = document.createElement('script');
            scriptApp.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js';
            scriptApp.onload = () => {
                const scriptFirestore = document.createElement('script');
                scriptFirestore.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore-compat.js';
                scriptFirestore.onload = () => {
                    const scriptAuth = document.createElement('script');
                    scriptAuth.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth-compat.js';
                    scriptAuth.onload = resolve;
                    scriptAuth.onerror = reject;
                    document.head.appendChild(scriptAuth);
                };
                scriptFirestore.onerror = reject;
                document.head.appendChild(scriptFirestore);
            };
            scriptApp.onerror = reject;
            document.head.appendChild(scriptApp);
        });
    }

    getFirestore() {
        if (!this.isInitialized) {
            throw new Error('Firebase não inicializado');
        }
        return this.firestore;
    }

    getAuth() {
        if (!this.isInitialized) {
            throw new Error('Firebase não inicializado');
        }
        return this.auth;
    }

    getStorage() {
        if (!this.isInitialized) {
            throw new Error('Firebase não inicializado');
        }
        return this.storage;
    }

    getFirebaseConfig() {
        return this.config;
    }

    getAppSettings() {
        return this.appSettings;
    }

    validateConfig() {
        const required = ['apiKey', 'authDomain', 'projectId'];
        const missing = required.filter(key => !this.config[key]);
        
        if (missing.length > 0) {
            console.error('❌ Configuração incompleta. Faltando:', missing);
            return false;
        }

        console.log('✅ Configuração validada');
        return true;
    }

    // 🔄 Método específico para sincronização de clientes
    async syncCustomersFromGaragem67() {
        try {
            await this.initializeFirebase();
            const db = this.getFirestore();
            
            // ⚠️ PRECISO SABER: Qual é o nome da coleção de clientes na Garagem67?
            // Vou tentar algumas possibilidades:
            const possibleCollections = ['customers', 'users', 'clientes', 'garagem67_customers'];
            
            let customers = [];
            
            for (const collectionName of possibleCollections) {
                try {
                    console.log(`🔍 Buscando clientes na coleção: ${collectionName}`);
                    const snapshot = await db.collection(collectionName).get();
                    
                    if (!snapshot.empty) {
                        snapshot.forEach(doc => {
                            const customerData = doc.data();
                            customers.push({
                                firebase_id: doc.id,
                                collection: collectionName,
                                ...customerData,
                                last_sync: new Date().toISOString()
                            });
                        });
                        console.log(`✅ ${customers.length} clientes encontrados em ${collectionName}`);
                        break;
                    }
                } catch (error) {
                    console.log(`❌ Coleção ${collectionName} não encontrada:`, error.message);
                }
            }
            
            return customers;
            
        } catch (error) {
            console.error('❌ Erro na sincronização de clientes:', error);
            throw error;
        }
    }

    // 🔍 Buscar cliente específico por telefone (método alternativo)
    async findCustomerByPhone(phone) {
        try {
            await this.initializeFirebase();
            const db = this.getFirestore();
            
            const possibleCollections = ['customers', 'users', 'clientes'];
            
            for (const collectionName of possibleCollections) {
                try {
                    const querySnapshot = await db.collection(collectionName)
                        .where('phone', '==', phone)
                        .get();
                    
                    if (!querySnapshot.empty) {
                        const customers = [];
                        querySnapshot.forEach(doc => {
                            customers.push({
                                firebase_id: doc.id,
                                collection: collectionName,
                                ...doc.data()
                            });
                        });
                        return customers;
                    }
                } catch (error) {
                    console.log(`ℹ️ Busca em ${collectionName} falhou:`, error.message);
                }
            }
            
            return [];
            
        } catch (error) {
            console.error('❌ Erro ao buscar cliente por telefone:', error);
            return [];
        }
    }

    cleanup() {
        if (this.isInitialized) {
            try {
                const app = firebase.app('SalesManagerSync');
                app.delete();
                console.log('🧹 Firebase Sales Manager cleanup realizado');
            } catch (error) {
                console.warn('⚠️ Erro no cleanup do Firebase:', error);
            }
        }
        this.isInitialized = false;
        this.initializationPromise = null;
    }
}

// Cria instância global para Sales Manager
window.firebaseConfigSalesManager = new FirebaseConfig();

// Valida imediatamente
window.firebaseConfigSalesManager.validateConfig();

console.log('🎯 Firebase Config para Sales Manager carregado e pronto');