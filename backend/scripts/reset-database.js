const fs = require('fs');
const path = require('path');

function resetDatabase() {
  try {
    const databaseDir = path.join(__dirname, '../database');
    const databasePath = path.join(databaseDir, 'sales_manager.db');
    const backupDir = path.join(__dirname, '../database/backups');

    // Criar diretório de backups se não existir
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Verificar se o arquivo do banco existe
    if (fs.existsSync(databasePath)) {
      // Criar backup antes de resetar
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `backup_before_reset_${timestamp}.db`);
      
      fs.copyFileSync(databasePath, backupPath);
      console.log(`💾 Backup criado: ${backupPath}`);
      
      // Remover arquivo do banco
      fs.unlinkSync(databasePath);
      console.log('🗑️  Banco de dados antigo removido');
    } else {
      console.log('ℹ️  Nenhum banco de dados existente encontrado para resetar');
    }

    // Criar novo banco de dados
    console.log('🔄 Criando novo banco de dados...');
    require('../config/database');
    
    console.log('✅ Banco de dados resetado com sucesso!');
    console.log('🔑 Credenciais padrão:');
    console.log('   Usuário: admin');
    console.log('   Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro ao resetar banco de dados:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase;