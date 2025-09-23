// 数据库备份脚本
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backupDatabase() {
  console.log('🚀 开始备份数据库...\n');

  try {
    // 创建备份目录
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('📁 创建备份目录:', backupDir);
    }

    // 生成备份文件名（包含时间戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `database-backup-${timestamp}.json`;
    const backupFilePath = path.join(backupDir, backupFileName);

    console.log('📊 开始导出数据...');

    // 导出所有工作流数据
    const workflows = await prisma.workflow.findMany({
      include: {
        generations: {
          orderBy: { startedAt: 'desc' }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 导出所有生成记录
    const generations = await prisma.generation.findMany({
      orderBy: { startedAt: 'desc' }
    });

    // 导出所有用户数据
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // 导出会话数据
    const sessions = await prisma.session.findMany();

    // 导出账户数据
    const accounts = await prisma.account.findMany();

    // 导出验证令牌数据
    const verificationTokens = await prisma.verificationToken.findMany();

    // 构建备份数据
    const backupData = {
      metadata: {
        backupDate: new Date().toISOString(),
        version: '1.0',
        totalWorkflows: workflows.length,
        totalGenerations: generations.length,
        totalUsers: users.length,
        totalSessions: sessions.length,
        totalAccounts: accounts.length,
        totalVerificationTokens: verificationTokens.length
      },
      data: {
        workflows,
        generations,
        users,
        sessions,
        accounts,
        verificationTokens
      }
    };

    // 写入备份文件
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

    console.log('✅ 数据库备份完成！');
    console.log('\n📊 备份统计:');
    console.log(`   工作流: ${workflows.length} 个`);
    console.log(`   生成记录: ${generations.length} 个`);
    console.log(`   用户: ${users.length} 个`);
    console.log(`   会话: ${sessions.length} 个`);
    console.log(`   账户: ${accounts.length} 个`);
    console.log(`   验证令牌: ${verificationTokens.length} 个`);
    
    console.log('\n📁 备份文件位置:');
    console.log(`   ${backupFilePath}`);
    
    // 计算文件大小
    const stats = fs.statSync(backupFilePath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   文件大小: ${fileSizeInMB} MB`);

    // 同时备份SQLite数据库文件
    const dbSourcePath = path.join(__dirname, '../prisma/dev.db');
    const dbBackupPath = path.join(backupDir, `dev.db-backup-${timestamp}`);
    
    if (fs.existsSync(dbSourcePath)) {
      fs.copyFileSync(dbSourcePath, dbBackupPath);
      console.log(`\n💾 SQLite数据库文件已备份到: ${dbBackupPath}`);
    }

    // 列出所有备份文件
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('database-backup-'))
      .sort()
      .reverse();
    
    console.log('\n📋 历史备份文件:');
    backupFiles.slice(0, 5).forEach((file, index) => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / (1024 * 1024)).toFixed(2);
      const date = stats.mtime.toLocaleString();
      console.log(`   ${index + 1}. ${file} (${size} MB, ${date})`);
    });

    if (backupFiles.length > 5) {
      console.log(`   ... 还有 ${backupFiles.length - 5} 个备份文件`);
    }

    console.log('\n🎉 备份完成！');

  } catch (error) {
    console.error('❌ 备份失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行备份
if (require.main === module) {
  backupDatabase().catch(console.error);
}

module.exports = { backupDatabase };
