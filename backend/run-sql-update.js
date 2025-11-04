// backend/run-sql-update.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔄 Executando atualização do banco de dados...');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
    // Ler e executar o arquivo SQL
    const sql = fs.readFileSync(path.join(__dirname, 'update_customers_table.sql'), 'utf8');
    
    // Executar cada comando separadamente
    const commands = sql.split(';').filter(cmd => cmd.trim());
    
    commands.forEach(command => {
        if (command.trim().toUpperCase().startsWith('SELECT') || 
            command.trim().toUpperCase().startsWith('PRAGMA')) {
            // Para SELECT e PRAGMA, mostrar resultados
            console.log(`\n🔍 Executando: ${command.trim().substring(0, 50)}...`);
            const result = db.prepare(command).all();
            if (result.length > 0) {
                console.log('📊 Resultado:', result);
            }
        } else {
            // Para outros comandos (CREATE, ALTER, etc)
            console.log(`\n⚡ Executando: ${command.trim().substring(0, 50)}...`);
            db.exec(command);
        }
    });
    
    console.log('✅ Atualização do banco de dados concluída com sucesso!');
} catch (error) {
    console.error('❌ Erro ao executar atualização:', error);
} finally {
    db.close();
}