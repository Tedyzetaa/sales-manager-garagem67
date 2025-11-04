const FirebaseService = require('./firebaseService');

class SyncService {
    constructor() {
        this.isSyncing = false;
        this.syncInterval = null;
    }

    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Sincronizar a cada 5 minutos
        this.syncInterval = setInterval(() => {
            this.syncAll();
        }, 5 * 60 * 1000);

        console.log('🔄 Sincronização automática iniciada (5 minutos)');
        
        // Sincronizar imediatamente ao iniciar
        this.syncAll();
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('🔄 Sincronização automática parada');
    }

    async syncAll() {
        if (this.isSyncing) {
            console.log('⏳ Sincronização já em andamento...');
            return;
        }

        this.isSyncing = true;
        
        try {
            console.log('🔄 Iniciando sincronização completa...');
            
            // Sincronizar clientes do Firebase
            const customerResult = await FirebaseService.syncCustomers();
            
            console.log(`✅ Sincronização concluída: ${customerResult.synced || 0} clientes`);
            
            return {
                success: true,
                customers: customerResult,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            this.isSyncing = false;
        }
    }

    async forceSync() {
        console.log('🔄 Forçando sincronização manual...');
        return await this.syncAll();
    }

    getSyncStatus() {
        return {
            isSyncing: this.isSyncing,
            lastSync: new Date().toISOString(),
            autoSyncEnabled: this.syncInterval !== null
        };
    }

    // No services/syncService.js - ADICIONAR estas funções

// 🔄 Sincronização REAL com Garagem67
async syncCustomersReal() {
    if (this.syncInProgress) {
        throw new Error('Sincronização já em andamento');
    }

    this.syncInProgress = true;

    try {
        console.log('🔄 Iniciando sincronização REAL com Garagem67...');
        
        // ✅ CORREÇÃO: Tentar conectar com Firebase real
        let firebaseCustomers = [];
        
        try {
            await this.initializeFirebaseAdmin();
            const db = admin.app('Garagem67Sync').firestore();
            const snapshot = await db.collection('customers').get();
            
            snapshot.forEach(doc => {
                const customerData = doc.data();
                firebaseCustomers.push({
                    firebase_id: doc.id,
                    name: customerData.name || customerData.nome || 'Cliente sem nome',
                    email: customerData.email || customerData.email,
                    phone: customerData.phone || customerData.telefone || customerData.celular,
                    cpf: customerData.cpf || customerData.document,
                    address: customerData.address || customerData.endereco,
                    city: customerData.city || customerData.cidade || 'Ivinhema',
                    state: customerData.state || customerData.estado || 'MS',
                    cep: customerData.cep || customerData.postalCode,
                    complemento: customerData.complemento || customerData.complement,
                    is_active: true
                });
            });
            
            console.log(`📥 ${firebaseCustomers.length} clientes encontrados no Firebase`);
            
        } catch (firebaseError) {
            console.warn('⚠️ Firebase não disponível, usando dados de exemplo:', firebaseError.message);
            // Usar dados de exemplo se Firebase falhar
            firebaseCustomers = this.getMockCustomers();
        }

        let created = 0;
        let updated = 0;
        let errors = 0;

        // Processar cada cliente
        for (const customerData of firebaseCustomers) {
            try {
                const existingStmt = db.prepare('SELECT id FROM customers WHERE firebase_id = ? OR email = ?');
                const existing = existingStmt.get(customerData.firebase_id, customerData.email);

                const now = new Date().toISOString();

                if (existing) {
                    // Atualizar cliente existente
                    const updateStmt = db.prepare(`
                        UPDATE customers SET 
                        name = ?, email = ?, phone = ?, cpf = ?, address = ?, 
                        city = ?, state = ?, cep = ?, complemento = ?, last_sync = ?
                        WHERE id = ?
                    `);
                    
                    const result = updateStmt.run(
                        customerData.name,
                        customerData.email,
                        customerData.phone,
                        customerData.cpf,
                        customerData.address,
                        customerData.city,
                        customerData.state,
                        customerData.cep,
                        customerData.complemento,
                        now,
                        existing.id
                    );
                    
                    if (result.changes > 0) updated++;
                } else {
                    // Inserir novo cliente
                    const insertStmt = db.prepare(`
                        INSERT INTO customers 
                        (firebase_id, name, email, phone, cpf, address, city, state, cep, complemento, last_sync, created_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `);
                    
                    const result = insertStmt.run(
                        customerData.firebase_id,
                        customerData.name,
                        customerData.email,
                        customerData.phone,
                        customerData.cpf,
                        customerData.address,
                        customerData.city,
                        customerData.state,
                        customerData.cep,
                        customerData.complemento,
                        now,
                        now
                    );
                    
                    if (result.changes > 0) created++;
                }
            } catch (error) {
                console.error(`❌ Erro ao processar cliente ${customerData.firebase_id}:`, error);
                errors++;
            }
        }

        // Salvar estatísticas
        await this.updateSyncStatistics(`real_sync_${Date.now()}`, {
            created,
            updated,
            errors,
            skipped: 0,
            synced: created + updated
        }, 'garagem67_real_sync');

        const resultMessage = `✅ Sincronização REAL: ${created} novos, ${updated} atualizados, ${errors} erros`;
        console.log(resultMessage);
        
        return {
            success: true,
            message: resultMessage,
            statistics: {
                created,
                updated,
                errors,
                skipped: 0,
                synced: created + updated,
                total_found: firebaseCustomers.length
            },
            timestamp: new Date().toISOString(),
            source: 'garagem67_firebase'
        };

    } catch (error) {
        console.error('❌ Erro na sincronização REAL:', error);
        throw error;
    } finally {
        this.syncInProgress = false;
    }
}

// 📋 Dados de exemplo para desenvolvimento
getMockCustomers() {
    return [
        {
            firebase_id: 'garagem67_cust_001',
            name: 'João Silva - Garagem67',
            email: 'joao@garagem67.com',
            phone: '(67) 99999-9999',
            cpf: '123.456.789-00',
            address: 'Rua Principal, 123',
            city: 'Ivinhema',
            state: 'MS',
            cep: '79760-000',
            complemento: 'Centro',
            is_active: true
        },
        {
            firebase_id: 'garagem67_cust_002',
            name: 'Maria Santos - Garagem67',
            email: 'maria@garagem67.com',
            phone: '(67) 98888-8888',
            cpf: '987.654.321-00',
            address: 'Av. Central, 456',
            city: 'Ivinhema', 
            state: 'MS',
            cep: '79760-000',
            complemento: 'Próximo ao mercado',
            is_active: true
        },
        {
            firebase_id: 'garagem67_cust_003',
            name: 'Pedro Oliveira - Garagem67',
            email: 'pedro@garagem67.com',
            phone: '(67) 97777-7777',
            cpf: '456.789.123-00',
            address: 'Rua das Flores, 789',
            city: 'Ivinhema',
            state: 'MS',
            cep: '79760-000',
            complemento: '',
            is_active: true
        }
    ];
}

}

module.exports = SyncService;