// firebase-config.js - Configuração simplificada para desenvolvimento
console.log('🔥 firebase-config.js carregado');

const firebaseConfig = {
    apiKey: "AIzaSyBbgzZ21aPFHmeoeahk40eMllzEfCcI7BQ",
    authDomain: "garagem67-c38cf.firebaseapp.com",
    projectId: "garagem67-c38cf",
    storageBucket: "garagem67-c38cf.firebasestorage.app",
    messagingSenderId: "579533283807",
    appId: "1:579533283807:web:576c2e605fd10b3003646a"
};

// Inicializar Firebase apenas se o SDK estiver disponível
if (typeof firebase !== 'undefined' && firebase.app) {
    try {
        // Tentar inicializar o Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase inicializado com sucesso');
        } else {
            console.log('✅ Firebase já estava inicializado');
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
    }
} else {
    console.log('⚠️ Firebase SDK não disponível - modo offline');
}

// Configuração global para o app
window.firebaseConfig = {
    initializeFirebase: () => {
        return new Promise((resolve) => {
            console.log('🔄 Inicializando Firebase...');
            // Simular inicialização bem-sucedida
            setTimeout(() => {
                console.log('✅ Firebase "inicializado" (modo desenvolvimento)');
                resolve(true);
            }, 1000);
        });
    },
    
    getFirestore: () => {
        console.log('📁 Obtendo Firestore (modo desenvolvimento)');
        return {
            collection: () => ({
                get: () => Promise.resolve({ forEach: (cb) => cb() }),
                doc: () => ({ get: () => Promise.resolve({ data: () => ({}) }) })
            })
        };
    },
    
    getAuth: () => {
        console.log('🔐 Obtendo Auth (modo desenvolvimento)');
        return {
            currentUser: null,
            onAuthStateChanged: (callback) => {
                setTimeout(() => callback(null), 100);
                return () => {};
            }
        };
    },
    
    getStorage: () => {
        console.log('💾 Obtendo Storage (modo desenvolvimento)');
        return {
            ref: () => ({
                put: () => Promise.resolve(),
                getDownloadURL: () => Promise.resolve('')
            })
        };
    }
};

console.log('🎯 firebase-config.js carregado com sucesso - Modo Desenvolvimento Ativo');