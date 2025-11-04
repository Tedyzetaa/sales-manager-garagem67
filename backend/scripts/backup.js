const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function backupDatabase() {
  const databasePath = path.join(__dirname, '../database/sales_manager.db');
  const backupDir = path.join(__dirname, '../backups');
  
  // Criar diretório de backups se não existir
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `sales_manager_${timestamp}.db`);

  try {
    // Copiar arquivo do banco de dados
    fs.copyFileSync(databasePath, backupPath);
    
    // Compactar o backup (opcional)
    const compressedPath = `${backupPath}.gz`;
    exec(`gzip -c ${backupPath} > ${compressedPath}`, (error) => {
      if (error) {
        console.log('⚠️  Não foi possível compactar o backup:', error.message);
      } else {
        // Remover arquivo não compactado após compressão
        fs.unlinkSync(backupPath);
        console.log(`✅ Backup criado e compactado: ${compressedPath}`);
      }
    });

    // Limitar número de backups (manter apenas os 10 mais recentes)
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('sales_manager_') && file.endsWith('.db.gz'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time)
      .map(file => file.name);

    // Remover backups antigos
    if (files.length > 10) {
      const filesToDelete = files.slice(10);
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join(backupDir, file));
        console.log(`🗑️  Backup antigo removido: ${file}`);
      });
    }

    return {
      success: true,
      backupPath: compressedPath,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Se executado diretamente, fazer backup
if (require.main === module) {
  console.log('💾 Iniciando backup do banco de dados...');
  const result = backupDatabase();
  if (result.success) {
    console.log('✅ Backup concluído com sucesso');
  } else {
    console.log('❌ Falha no backup:', result.error);
  }
}

module.exports = backupDatabase;