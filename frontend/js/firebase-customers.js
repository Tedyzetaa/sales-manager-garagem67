// frontend/js/firebase-customers.js - SISTEMA COMPLETO DE CLIENTES
class FirebaseCustomers {
    constructor() {
        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            await this.waitForFirebase();
            this.initialized = true;
            console.log('✅ Firebase Customers inicializado');
            
            // Ouvir mudanças de autenticação
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    this.onUserLogin(user);
                }
            });
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Firebase Customers:', error);
        }
    }

    waitForFirebase() {
        return new Promise((resolve, reject) => {
            const checkFirebase = () => {
                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    // 👤 Quando usuário faz login
    async onUserLogin(user) {
        console.log('👤 Usuário logado, verificando dados...', user.uid);
        
        // 1. Verificar se já existe no Firestore
        const existingCustomer = await this.getCustomerFromFirestore(user.uid);
        
        if (!existingCustomer.success) {
            // 2. Se não existe, criar com dados básicos
            const basicData = {
                nome: user.displayName || user.email.split('@')[0],
                email: user.email,
                user_id: user.uid,
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                updated_at: firebase.firestore.FieldValue.serverTimestamp(),
                ativo: true,
                origem: 'site_garagem67'
            };
            
            await this.saveCustomerToFirestore(user.uid, basicData);
            console.log('✅ Cliente básico criado no Firestore');
        } else {
            console.log('✅ Cliente já existe no Firestore');
        }
        
        // 3. Sincronizar dados locais se existirem
        await this.syncLocalDataToFirestore(user.uid);
    }

    // 💾 Salvar cliente no Firestore
    async saveCustomerToFirestore(customerId, customerData) {
        try {
            const db = firebase.firestore();
            const customerRef = db.collection('customers').doc(customerId);

            const customerDoc = {
                ...customerData,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            };

            await customerRef.set(customerDoc, { merge: true });
            console.log('✅ Cliente salvo no Firestore:', customerId);
            return { success: true, customerId: customerId };

        } catch (error) {
            console.error('❌ Erro ao salvar cliente no Firestore:', error);
            return { success: false, error: error.message };
        }
    }

    // 📥 Buscar cliente do Firestore
    async getCustomerFromFirestore(customerId) {
        try {
            const db = firebase.firestore();
            const customerDoc = await db.collection('customers').doc(customerId).get();

            if (customerDoc.exists) {
                const data = customerDoc.data();
                return { success: true, data: data };
            } else {
                return { success: false, error: 'Cliente não encontrado' };
            }

        } catch (error) {
            console.error('❌ Erro ao buscar cliente do Firestore:', error);
            return { success: false, error: error.message };
        }
    }

    // 🔄 Sincronizar dados locais com Firestore
    async syncLocalDataToFirestore(customerId) {
        try {
            const localData = this.getLocalCustomerData();
            if (!localData) {
                console.log('ℹ️ Nenhum dado local para sincronizar');
                return { success: false, error: 'Nenhum dado local' };
            }

            // Preparar dados para Firestore
            const firestoreData = {
                nome: localData.nome || '',
                email: localData.email || '',
                telefone: localData.telefone || '',
                cpf: localData.cpf || '',
                endereco: localData.endereco || '',
                cidade: localData.cidade || 'Ivinhema',
                estado: localData.estado || 'MS',
                cep: localData.cep || '',
                complemento: localData.complemento || '',
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Salvar no Firestore
            const result = await this.saveCustomerToFirestore(customerId, firestoreData);
            
            if (result.success) {
                console.log('✅ Dados locais sincronizados com Firestore');
                // Limpar dados locais após sincronização bem-sucedida
                localStorage.removeItem('garagem67_user_data');
            }
            
            return result;

        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            return { success: false, error: error.message };
        }
    }

    // 📋 Quando usuário preenche o formulário de endereço
    async onAddressFormSubmit(formData) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.log('⚠️ Usuário não logado, salvando localmente');
                this.saveLocalCustomerData(formData);
                return { success: true, savedLocally: true };
            }

            // Salvar no Firestore
            const result = await this.saveCustomerToFirestore(user.uid, formData);
            
            if (result.success) {
                console.log('✅ Endereço salvo no Firestore');
            }
            
            return result;

        } catch (error) {
            console.error('❌ Erro ao salvar endereço:', error);
            return { success: false, error: error.message };
        }
    }

    // 💾 Salvar dados localmente (fallback)
    saveLocalCustomerData(customerData) {
        try {
            localStorage.setItem('garagem67_user_data', JSON.stringify(customerData));
            console.log('💾 Dados salvos localmente:', customerData);
        } catch (error) {
            console.error('❌ Erro ao salvar dados localmente:', error);
        }
    }

    // 📥 Buscar dados locais
    getLocalCustomerData() {
        try {
            const userData = localStorage.getItem('garagem67_user_data');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('❌ Erro ao carregar dados locais:', error);
            return null;
        }
    }

    // 🔍 Verificar se cliente tem dados completos
    async hasCompleteData(customerId) {
        try {
            const result = await this.getCustomerFromFirestore(customerId);
            
            if (result.success) {
                const data = result.data;
                return !!(data.telefone && data.endereco && data.cpf);
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }
}

// Inicializar globalmente
document.addEventListener('DOMContentLoaded', function() {
    window.firebaseCustomers = new FirebaseCustomers();
    console.log('🎯 Sistema de Clientes Firebase carregado');
});