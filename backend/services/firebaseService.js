const { getFirebaseAdmin, isFirebaseAvailable } = require('../config/firebase');
const db = require('../config/database');

class FirebaseService {
  // Verificar se o Firebase está disponível
  static isFirebaseAvailable() {
    return isFirebaseAvailable();
  }

  // Sincronizar clientes do Firebase
  static async syncCustomers() {
    try {
      const admin = getFirebaseAdmin();
      
      // Verificar se o Firebase está disponível
      if (!this.isFirebaseAvailable() || !admin) {
        console.log('🔧 Modo desenvolvimento: Simulando sincronização de clientes');
        
        // Gerar alguns clientes de exemplo para desenvolvimento
        const mockCustomers = [
          {
            firebase_uid: 'user_001',
            name: 'João Silva',
            email: 'joao@email.com',
            phone: '(67) 99999-9999'
          },
          {
            firebase_uid: 'user_002', 
            name: 'Maria Santos',
            email: 'maria@email.com',
            phone: '(67) 98888-8888'
          },
          {
            firebase_uid: 'user_003',
            name: 'Pedro Oliveira',
            email: 'pedro@email.com',
            phone: '(67) 97777-7777'
          },
          {
            firebase_uid: 'user_004',
            name: 'Ana Costa',
            email: 'ana@email.com',
            phone: '(67) 96666-6666'
          },
          {
            firebase_uid: 'user_005',
            name: 'Carlos Souza',
            email: 'carlos@email.com',
            phone: '(67) 95555-5555'
          }
        ];

        let syncedCount = 0;
        let errorCount = 0;

        for (const customerData of mockCustomers) {
          try {
            // Verificar se cliente já existe (usando better-sqlite3 corretamente)
            const selectStmt = db.prepare('SELECT id FROM customers WHERE firebase_uid = ?');
            const existingCustomer = selectStmt.get(customerData.firebase_uid);

            const now = new Date().toISOString();

            if (existingCustomer) {
              // Tentar atualizar cliente existente
              try {
                const updateStmt = db.prepare(`
                  UPDATE customers SET 
                  name = ?, email = ?, phone = ?, last_sync = ?, updated_at = ?
                  WHERE firebase_uid = ?
                `);
                updateStmt.run(
                  customerData.name,
                  customerData.email,
                  customerData.phone,
                  now,
                  now,
                  customerData.firebase_uid
                );
                syncedCount++;
                console.log(`✅ Cliente atualizado: ${customerData.name}`);
              } catch (updateError) {
                // Se falhar, tentar sem updated_at
                console.log('🔄 Tentando atualizar sem updated_at...');
                const updateStmt = db.prepare(`
                  UPDATE customers SET 
                  name = ?, email = ?, phone = ?, last_sync = ?
                  WHERE firebase_uid = ?
                `);
                updateStmt.run(
                  customerData.name,
                  customerData.email,
                  customerData.phone,
                  now,
                  customerData.firebase_uid
                );
                syncedCount++;
                console.log(`✅ Cliente atualizado (sem updated_at): ${customerData.name}`);
              }
            } else {
              // Tentar inserir novo cliente
              try {
                const insertStmt = db.prepare(`
                  INSERT INTO customers (firebase_uid, name, email, phone, last_sync, created_at, updated_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                `);
                insertStmt.run(
                  customerData.firebase_uid,
                  customerData.name,
                  customerData.email,
                  customerData.phone,
                  now,
                  now,
                  now
                );
                syncedCount++;
                console.log(`✅ Cliente criado: ${customerData.name}`);
              } catch (insertError) {
                // Se falhar, tentar sem updated_at
                console.log('🔄 Tentando inserir sem updated_at...');
                const insertStmt = db.prepare(`
                  INSERT INTO customers (firebase_uid, name, email, phone, last_sync, created_at) 
                  VALUES (?, ?, ?, ?, ?, ?)
                `);
                insertStmt.run(
                  customerData.firebase_uid,
                  customerData.name,
                  customerData.email,
                  customerData.phone,
                  now,
                  now
                );
                syncedCount++;
                console.log(`✅ Cliente criado (sem updated_at): ${customerData.name}`);
              }
            }
          } catch (error) {
            console.error(`❌ Erro ao sincronizar cliente ${customerData.firebase_uid}:`, error.message);
            errorCount++;
          }
        }

        console.log(`✅ Sincronização simulada: ${syncedCount} clientes processados, ${errorCount} erros`);
        return {
          success: true,
          synced: syncedCount,
          errors: errorCount,
          total: mockCustomers.length,
          mode: 'development'
        };
      }

      console.log('🔄 Sincronizando clientes do Firebase...');
      
      // Buscar usuários do Firebase Auth (produção)
      const listUsersResult = await admin.auth().listUsers(1000);
      const firebaseUsers = listUsersResult.users;
      
      let syncedCount = 0;
      let errorCount = 0;

      for (const user of firebaseUsers) {
        try {
          // Verificar se cliente já existe
          const selectStmt = db.prepare('SELECT id FROM customers WHERE firebase_uid = ?');
          const existingCustomer = selectStmt.get(user.uid);

          const customerData = {
            firebase_uid: user.uid,
            name: user.displayName || (user.email ? user.email.split('@')[0] : 'Usuário sem nome'),
            email: user.email || null,
            phone: user.phoneNumber || null,
            last_sync: new Date().toISOString()
          };

          const now = new Date().toISOString();

          if (existingCustomer) {
            // Atualizar cliente existente
            const updateStmt = db.prepare(`
              UPDATE customers SET 
              name = ?, email = ?, phone = ?, last_sync = ?, updated_at = ?
              WHERE firebase_uid = ?
            `);
            updateStmt.run(
              customerData.name,
              customerData.email,
              customerData.phone,
              customerData.last_sync,
              now,
              customerData.firebase_uid
            );
          } else {
            // Inserir novo cliente
            const insertStmt = db.prepare(`
              INSERT INTO customers (firebase_uid, name, email, phone, last_sync, created_at, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            insertStmt.run(
              customerData.firebase_uid,
              customerData.name,
              customerData.email,
              customerData.phone,
              customerData.last_sync,
              now,
              now
            );
          }

          syncedCount++;
          console.log(`✅ Cliente sincronizado: ${customerData.name}`);
        } catch (error) {
          console.error(`❌ Erro ao sincronizar usuário ${user.uid}:`, error.message);
          errorCount++;
        }
      }

      console.log(`✅ Sincronização concluída: ${syncedCount} clientes sincronizados, ${errorCount} erros`);
      return {
        success: true,
        synced: syncedCount,
        errors: errorCount,
        total: firebaseUsers.length,
        mode: 'production'
      };

    } catch (error) {
      console.error('❌ Erro na sincronização de clientes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Buscar cliente por UID do Firebase
  static async getCustomerByUid(firebaseUid) {
    try {
      const stmt = db.prepare('SELECT * FROM customers WHERE firebase_uid = ?');
      return stmt.get(firebaseUid);
    } catch (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      throw error;
    }
  }

  // Buscar todos os clientes
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
}

module.exports = FirebaseService;