const { getFirebaseAdmin, isFirebaseAvailable } = require('../config/firebase');
const db = require('../config/database');

class FirebaseService {
  // Verificar se o Firebase está disponível
  static isFirebaseAvailable() {
    return isFirebaseAvailable();
  }

  // Sincronizar clientes do Firebase - MÉTODO PRINCIPAL CORRIGIDO
  static async syncCustomers() {
    try {
      const admin = getFirebaseAdmin();
      
      // Verificar se o Firebase está disponível
      if (!this.isFirebaseAvailable() || !admin) {
        console.log('🔧 Modo desenvolvimento: Simulando sincronização de clientes');
        return await this.syncMockCustomers();
      }

      console.log('🔄 Sincronizando clientes do Firebase Auth...');
      
      // ✅ PRODUÇÃO: Buscar usuários reais do Firebase Auth
      const listUsersResult = await admin.auth().listUsers(1000);
      const firebaseUsers = listUsersResult.users;
      
      let created = 0;
      let updated = 0;
      let errorCount = 0;

      console.log(`📥 ${firebaseUsers.length} usuários encontrados no Firebase`);

      for (const user of firebaseUsers) {
        try {
          // ✅ CORREÇÃO: Dados do usuário Firebase
          const customerData = {
            firebase_uid: user.uid,
            name: user.displayName || (user.email ? user.email.split('@')[0] : `Usuário ${user.uid.substring(0, 8)}`),
            email: user.email || null,
            phone: user.phoneNumber || null,
            address: null,
            postal_code: null,
            city: null,
            state: null,
            last_sync_at: new Date().toISOString()
          };

          const now = new Date().toISOString();

          // ✅ CORREÇÃO: Verificar se cliente já existe pelo firebase_uid
          const selectStmt = db.prepare('SELECT id, name FROM customers WHERE firebase_uid = ?');
          const existingCustomer = selectStmt.get(user.uid);

          if (existingCustomer) {
            // ✅ CORREÇÃO: ATUALIZAR CLIENTE EXISTENTE
            try {
              const updateStmt = db.prepare(`
                UPDATE customers SET 
                name = ?, email = ?, phone = ?, last_sync_at = ?, updated_at = ?,
                sync_status = 'synced'
                WHERE firebase_uid = ?
              `);
              updateStmt.run(
                customerData.name,
                customerData.email,
                customerData.phone,
                customerData.last_sync_at,
                now,
                customerData.firebase_uid
              );
              updated++;
              console.log(`   🔄 Atualizado: ${customerData.name}`);
            } catch (updateError) {
              console.log('🔄 Tentando atualização alternativa...');
              const updateStmt = db.prepare(`
                UPDATE customers SET 
                name = ?, email = ?, phone = ?, last_sync_at = ?,
                sync_status = 'synced'
                WHERE firebase_uid = ?
              `);
              updateStmt.run(
                customerData.name,
                customerData.email,
                customerData.phone,
                customerData.last_sync_at,
                customerData.firebase_uid
              );
              updated++;
              console.log(`   🔄 Atualizado (alternativo): ${customerData.name}`);
            }
          } else {
            // ✅ CORREÇÃO: CRIAR NOVO CLIENTE
            try {
              const insertStmt = db.prepare(`
                INSERT INTO customers (
                  firebase_uid, name, email, phone, address, postal_code, city, state,
                  last_sync_at, created_at, updated_at, sync_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
              `);
              insertStmt.run(
                customerData.firebase_uid,
                customerData.name,
                customerData.email,
                customerData.phone,
                customerData.address,
                customerData.postal_code,
                customerData.city,
                customerData.state,
                customerData.last_sync_at,
                now,
                now
              );
              created++;
              console.log(`   ✅ Criado: ${customerData.name}`);
            } catch (insertError) {
              console.log('🔄 Tentando inserção alternativa...');
              const insertStmt = db.prepare(`
                INSERT INTO customers (
                  firebase_uid, name, email, phone, address, postal_code, city, state,
                  last_sync_at, created_at, sync_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
              `);
              insertStmt.run(
                customerData.firebase_uid,
                customerData.name,
                customerData.email,
                customerData.phone,
                customerData.address,
                customerData.postal_code,
                customerData.city,
                customerData.state,
                customerData.last_sync_at,
                now
              );
              created++;
              console.log(`   ✅ Criado (alternativo): ${customerData.name}`);
            }
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Erro ao sincronizar usuário ${user.uid}:`, error.message);
        }
      }

      console.log(`✅ Sincronização Firebase concluída: ${created} criados, ${updated} atualizados, ${errorCount} erros`);
      return {
        success: true,
        created,
        updated,
        errors: errorCount,
        synced: created + updated,
        total: firebaseUsers.length,
        mode: 'production'
      };

    } catch (error) {
      console.error('❌ Erro na sincronização de clientes Firebase:', error);
      return {
        success: false,
        error: error.message,
        mode: 'production'
      };
    }
  }

  // ✅ CORREÇÃO: Sincronização com dados mockados (fallback) - ESTRUTURA COMPATÍVEL
  static async syncMockCustomers() {
    try {
      console.log('🔧 Usando dados mockados para desenvolvimento...');
      
      const mockCustomers = [
        {
          firebase_uid: 'garagem67_user_001',
          name: 'João Silva',
          email: 'joao@garagem67.com',
          phone: '(67) 99999-9999',
          address: 'Rua A, 123',
          postal_code: '79000-000',
          city: 'Campo Grande',
          state: 'MS'
        },
        {
          firebase_uid: 'garagem67_user_002',
          name: 'Maria Santos',
          email: 'maria@garagem67.com', 
          phone: '(67) 98888-8888',
          address: 'Rua B, 456',
          postal_code: '79000-111',
          city: 'Campo Grande',
          state: 'MS'
        },
        {
          firebase_uid: 'garagem67_user_003',
          name: 'Pedro Oliveira',
          email: 'pedro@garagem67.com',
          phone: '(67) 97777-7777',
          address: 'Rua C, 789',
          postal_code: '79000-222',
          city: 'Campo Grande',
          state: 'MS'
        },
        {
          firebase_uid: 'garagem67_user_004',
          name: 'Ana Costa',
          email: 'ana@garagem67.com',
          phone: '(67) 96666-6666',
          address: 'Rua D, 321',
          postal_code: '79000-333',
          city: 'Campo Grande',
          state: 'MS'
        },
        {
          firebase_uid: 'garagem67_user_005',
          name: 'Carlos Souza',
          email: 'carlos@garagem67.com',
          phone: '(67) 95555-5555',
          address: 'Rua E, 654',
          postal_code: '79000-444',
          city: 'Campo Grande',
          state: 'MS'
        }
      ];

      let created = 0;
      let updated = 0;
      let errorCount = 0;

      for (const customerData of mockCustomers) {
        try {
          // ✅ CORREÇÃO: Verificar se cliente já existe
          const selectStmt = db.prepare('SELECT id, name FROM customers WHERE firebase_uid = ? OR email = ?');
          const existingCustomer = selectStmt.get(customerData.firebase_uid, customerData.email);

          const now = new Date().toISOString();

          if (existingCustomer) {
            // ✅ CORREÇÃO: ATUALIZAR CLIENTE EXISTENTE
            try {
              const updateStmt = db.prepare(`
                UPDATE customers SET 
                name = ?, email = ?, phone = ?, address = ?, postal_code = ?, city = ?, state = ?,
                last_sync_at = ?, updated_at = ?, sync_status = 'synced'
                WHERE firebase_uid = ?
              `);
              updateStmt.run(
                customerData.name,
                customerData.email,
                customerData.phone,
                customerData.address,
                customerData.postal_code,
                customerData.city,
                customerData.state,
                now,
                now,
                customerData.firebase_uid
              );
              updated++;
              console.log(`   🔄 Mock Atualizado: ${customerData.name}`);
            } catch (updateError) {
              console.log('🔄 Tentando atualização mock alternativa...');
              const updateStmt = db.prepare(`
                UPDATE customers SET 
                name = ?, email = ?, phone = ?, address = ?, postal_code = ?, city = ?, state = ?,
                last_sync_at = ?, sync_status = 'synced'
                WHERE firebase_uid = ?
              `);
              updateStmt.run(
                customerData.name,
                customerData.email,
                customerData.phone,
                customerData.address,
                customerData.postal_code,
                customerData.city,
                customerData.state,
                now,
                customerData.firebase_uid
              );
              updated++;
              console.log(`   🔄 Mock Atualizado (alternativo): ${customerData.name}`);
            }
          } else {
            // ✅ CORREÇÃO: CRIAR NOVO CLIENTE
            try {
              const insertStmt = db.prepare(`
                INSERT INTO customers (
                  firebase_uid, name, email, phone, address, postal_code, city, state,
                  last_sync_at, created_at, updated_at, sync_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
              `);
              insertStmt.run(
                customerData.firebase_uid,
                customerData.name,
                customerData.email,
                customerData.phone,
                customerData.address,
                customerData.postal_code,
                customerData.city,
                customerData.state,
                now,
                now,
                now
              );
              created++;
              console.log(`   ✅ Mock Criado: ${customerData.name}`);
            } catch (insertError) {
              console.log('🔄 Tentando inserção mock alternativa...');
              const insertStmt = db.prepare(`
                INSERT INTO customers (
                  firebase_uid, name, email, phone, address, postal_code, city, state,
                  last_sync_at, created_at, sync_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
              `);
              insertStmt.run(
                customerData.firebase_uid,
                customerData.name,
                customerData.email,
                customerData.phone,
                customerData.address,
                customerData.postal_code,
                customerData.city,
                customerData.state,
                now,
                now
              );
              created++;
              console.log(`   ✅ Mock Criado (alternativo): ${customerData.name}`);
            }
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Erro ao sincronizar mock cliente ${customerData.firebase_uid}:`, error.message);
        }
      }

      console.log(`✅ Sincronização Mock concluída: ${created} criados, ${updated} atualizados, ${errorCount} erros`);
      return {
        success: true,
        created,
        updated,
        errors: errorCount,
        synced: created + updated,
        total: mockCustomers.length,
        mode: 'development'
      };

    } catch (error) {
      console.error('❌ Erro na sincronização mock:', error);
      return {
        success: false,
        error: error.message,
        mode: 'development'
      };
    }
  }

  // ✅ MÉTODO: Buscar cliente por UID do Firebase
  static async getCustomerByUid(firebaseUid) {
    try {
      const stmt = db.prepare('SELECT * FROM customers WHERE firebase_uid = ?');
      return stmt.get(firebaseUid);
    } catch (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      throw error;
    }
  }

  // ✅ MÉTODO: Buscar todos os clientes
  static async getCustomers(search = '', page = 1, limit = 50) {
    try {
      let whereConditions = ['1=1'];
      let params = [];

      if (search) {
        whereConditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const offset = (page - 1) * limit;
      const whereClause = whereConditions.join(' AND ');

      // Buscar clientes
      const customersStmt = db.prepare(`
        SELECT * FROM customers 
        WHERE ${whereClause}
        ORDER BY name
        LIMIT ? OFFSET ?
      `);
      const customers = customersStmt.all(...params, limit, offset);

      // Contar total
      const countStmt = db.prepare(`SELECT COUNT(*) as total FROM customers WHERE ${whereClause}`);
      const countResult = countStmt.get(...params);

      return {
        customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      throw error;
    }
  }

  // ✅ MÉTODO: Verificar status do Firebase
  static getFirebaseStatus() {
    return {
      available: this.isFirebaseAvailable(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = FirebaseService;