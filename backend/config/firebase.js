const admin = require('firebase-admin');

let firebaseInitialized = false;
let firebaseAdmin = null;

try {
  // Verificar se as variáveis de ambiente necessárias estão disponíveis
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY
  } = process.env;

  // Verificar se temos uma chave privada válida (não é a chave de exemplo)
  const hasValidPrivateKey = FIREBASE_PRIVATE_KEY && 
                            !FIREBASE_PRIVATE_KEY.includes('TEST_KEY_FOR_DEVELOPMENT_ONLY') &&
                            FIREBASE_PRIVATE_KEY.length > 100;

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && hasValidPrivateKey) {
    // Substituir \n por quebras de linha reais na chave privada
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    const serviceAccount = {
      type: "service_account",
      project_id: FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: "googleapis.com"
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${FIREBASE_PROJECT_ID}.firebaseio.com`
    });

    firebaseInitialized = true;
    firebaseAdmin = admin;
    console.log('✅ Firebase Admin inicializado com variáveis de ambiente');
    
  } else {
    console.log('🔧 Modo desenvolvimento: Firebase não configurado com credenciais válidas');
    console.log('ℹ️  Usando dados mockados para clientes');
  }
} catch (error) {
  console.log('⚠️  Firebase não disponível. Modo desenvolvimento:', error.message);
  console.log('ℹ️  O sistema funcionará com dados mockados');
}

// Função para verificar se o Firebase está disponível
function isFirebaseAvailable() {
  return firebaseInitialized;
}

// Função para obter a instância do Firebase Admin
function getFirebaseAdmin() {
  return firebaseAdmin;
}

module.exports = {
  isFirebaseAvailable,
  getFirebaseAdmin,
  firebaseAdmin: firebaseInitialized ? admin : null
};