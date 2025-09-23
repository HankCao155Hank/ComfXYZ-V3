// 备份管理脚本
const fs = require('fs');
const path = require('path');

function listBackups() {
  console.log('📋 数据库备份列表\n');
  
  const backupDir = path.join(__dirname, '../backups');
  
  if (!fs.existsSync(backupDir)) {
    console.log('❌ 备份目录不存在');
    return;
  }

  const files = fs.readdirSync(backupDir);
  const backupFiles = files
    .filter(file => file.startsWith('database-backup-') && file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: stats.size,
        date: stats.mtime,
        sizeFormatted: (stats.size / (1024 * 1024)).toFixed(2) + ' MB'
      };
    })
    .sort((a, b) => b.date - a.date);

  if (backupFiles.length === 0) {
    console.log('📭 没有找到备份文件');
    return;
  }

  console.log(`📊 找到 ${backupFiles.length} 个备份文件:\n`);
  
  backupFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name}`);
    console.log(`   大小: ${file.sizeFormatted}`);
    console.log(`   日期: ${file.date.toLocaleString()}`);
    console.log(`   路径: ${file.path}\n`);
  });

  // 显示SQLite备份文件
  const dbBackupFiles = files
    .filter(file => file.startsWith('dev.db-backup-'))
    .sort();

  if (dbBackupFiles.length > 0) {
    console.log('💾 SQLite数据库备份文件:\n');
    dbBackupFiles.forEach((file, index) => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const sizeFormatted = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
      
      console.log(`${index + 1}. ${file}`);
      console.log(`   大小: ${sizeFormatted}`);
      console.log(`   日期: ${stats.mtime.toLocaleString()}\n`);
    });
  }

  // 计算总大小
  const totalSize = backupFiles.reduce((sum, file) => sum + file.size, 0);
  const totalSizeFormatted = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`📊 总计: ${backupFiles.length} 个备份文件, 总大小: ${totalSizeFormatted} MB`);
}

function cleanupOldBackups(keepCount = 5) {
  console.log(`🧹 清理旧备份文件 (保留最近 ${keepCount} 个)\n`);
  
  const backupDir = path.join(__dirname, '../backups');
  
  if (!fs.existsSync(backupDir)) {
    console.log('❌ 备份目录不存在');
    return;
  }

  const files = fs.readdirSync(backupDir);
  const backupFiles = files
    .filter(file => file.startsWith('database-backup-') && file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        date: stats.mtime
      };
    })
    .sort((a, b) => b.date - a.date);

  if (backupFiles.length <= keepCount) {
    console.log(`✅ 备份文件数量 (${backupFiles.length}) 不超过保留数量 (${keepCount}), 无需清理`);
    return;
  }

  const filesToDelete = backupFiles.slice(keepCount);
  
  console.log(`📊 将删除 ${filesToDelete.length} 个旧备份文件:\n`);
  
  let deletedCount = 0;
  let deletedSize = 0;
  
  filesToDelete.forEach(file => {
    try {
      const stats = fs.statSync(file.path);
      fs.unlinkSync(file.path);
      deletedCount++;
      deletedSize += stats.size;
      console.log(`✅ 已删除: ${file.name}`);
    } catch (error) {
      console.log(`❌ 删除失败: ${file.name} - ${error.message}`);
    }
  });

  console.log(`\n📊 清理完成:`);
  console.log(`   删除文件: ${deletedCount} 个`);
  console.log(`   释放空间: ${(deletedSize / (1024 * 1024)).toFixed(2)} MB`);
}

function showUsage() {
  console.log('🔧 备份管理工具\n');
  console.log('使用方法:');
  console.log('  node scripts/manage-backups.js list              # 列出所有备份');
  console.log('  node scripts/manage-backups.js cleanup [数量]    # 清理旧备份 (默认保留5个)');
  console.log('  node scripts/manage-backups.js backup            # 创建新备份');
  console.log('  node scripts/manage-backups.js restore <文件>    # 恢复备份');
  console.log('\n示例:');
  console.log('  node scripts/manage-backups.js list');
  console.log('  node scripts/manage-backups.js cleanup 3');
  console.log('  node scripts/manage-backups.js backup');
  console.log('  node scripts/manage-backups.js restore backups/database-backup-2025-09-23T02-41-40-995Z.json');
}

// 主函数
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'list':
      listBackups();
      break;
      
    case 'cleanup':
      const keepCount = arg ? parseInt(arg) : 5;
      if (isNaN(keepCount) || keepCount < 1) {
        console.log('❌ 保留数量必须是正整数');
        process.exit(1);
      }
      cleanupOldBackups(keepCount);
      break;
      
    case 'backup':
      console.log('🚀 创建新备份...\n');
      const { backupDatabase } = require('./backup-database');
      await backupDatabase();
      break;
      
    case 'restore':
      if (!arg) {
        console.log('❌ 请提供备份文件路径');
        process.exit(1);
      }
      console.log('🔄 恢复备份...\n');
      const { restoreDatabase } = require('./restore-database');
      await restoreDatabase(arg);
      break;
      
    default:
      showUsage();
      break;
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { listBackups, cleanupOldBackups };
