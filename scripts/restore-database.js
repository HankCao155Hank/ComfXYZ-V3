// 数据库恢复脚本
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreDatabase(backupFilePath) {
  console.log('🔄 开始恢复数据库...\n');

  try {
    // 检查备份文件是否存在
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`备份文件不存在: ${backupFilePath}`);
    }

    console.log('📖 读取备份文件:', backupFilePath);
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    // 验证备份文件格式
    if (!backupData.metadata || !backupData.data) {
      throw new Error('备份文件格式无效');
    }

    console.log('📊 备份文件信息:');
    console.log(`   备份日期: ${backupData.metadata.backupDate}`);
    console.log(`   版本: ${backupData.metadata.version}`);
    console.log(`   工作流: ${backupData.metadata.totalWorkflows} 个`);
    console.log(`   生成记录: ${backupData.metadata.totalGenerations} 个`);
    console.log(`   用户: ${backupData.metadata.totalUsers} 个`);

    // 确认恢复操作
    console.log('\n⚠️  警告: 此操作将清除当前数据库中的所有数据！');
    console.log('请确保您已经备份了当前数据。');
    
    // 在实际环境中，这里应该添加用户确认逻辑
    // const readline = require('readline');
    // const rl = readline.createInterface({
    //   input: process.stdin,
    //   output: process.stdout
    // });
    // const answer = await new Promise(resolve => rl.question('确定要继续恢复吗？(yes/no): ', resolve));
    // rl.close();
    // if (answer.toLowerCase() !== 'yes') {
    //   console.log('❌ 恢复操作已取消');
    //   return;
    // }

    console.log('\n🗑️  清除现有数据...');

    // 删除现有数据（按依赖关系顺序）
    await prisma.generation.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.workflow.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ 现有数据已清除');

    console.log('\n📥 开始恢复数据...');

    // 恢复用户数据
    if (backupData.data.users && backupData.data.users.length > 0) {
      console.log(`   恢复 ${backupData.data.users.length} 个用户...`);
      for (const user of backupData.data.users) {
        await prisma.user.create({
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        });
      }
    }

    // 恢复工作流数据
    if (backupData.data.workflows && backupData.data.workflows.length > 0) {
      console.log(`   恢复 ${backupData.data.workflows.length} 个工作流...`);
      for (const workflow of backupData.data.workflows) {
        await prisma.workflow.create({
          data: {
            id: workflow.id,
            name: workflow.name,
            description: workflow.description,
            curlRequest: workflow.curlRequest,
            workflowId: workflow.workflowId,
            nodeData: workflow.nodeData,
            userId: workflow.userId,
            createdAt: new Date(workflow.createdAt),
            updatedAt: new Date(workflow.updatedAt)
          }
        });
      }
    }

    // 恢复生成记录数据
    if (backupData.data.generations && backupData.data.generations.length > 0) {
      console.log(`   恢复 ${backupData.data.generations.length} 个生成记录...`);
      for (const generation of backupData.data.generations) {
        await prisma.generation.create({
          data: {
            id: generation.id,
            workflowId: generation.workflowId,
            status: generation.status,
            blobUrl: generation.blobUrl,
            errorMsg: generation.errorMsg,
            actualPrompt: generation.actualPrompt,
            actualNegativePrompt: generation.actualNegativePrompt,
            actualWidth: generation.actualWidth,
            actualHeight: generation.actualHeight,
            actualSteps: generation.actualSteps,
            actualCfg: generation.actualCfg,
            actualSeed: generation.actualSeed ? BigInt(generation.actualSeed) : null,
            startedAt: new Date(generation.startedAt),
            completedAt: generation.completedAt ? new Date(generation.completedAt) : null
          }
        });
      }
    }

    // 恢复会话数据
    if (backupData.data.sessions && backupData.data.sessions.length > 0) {
      console.log(`   恢复 ${backupData.data.sessions.length} 个会话...`);
      for (const session of backupData.data.sessions) {
        await prisma.session.create({
          data: {
            id: session.id,
            userId: session.userId,
            expires: new Date(session.expires)
          }
        });
      }
    }

    // 恢复账户数据
    if (backupData.data.accounts && backupData.data.accounts.length > 0) {
      console.log(`   恢复 ${backupData.data.accounts.length} 个账户...`);
      for (const account of backupData.data.accounts) {
        await prisma.account.create({
          data: {
            id: account.id,
            userId: account.userId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state
          }
        });
      }
    }

    // 恢复验证令牌数据
    if (backupData.data.verificationTokens && backupData.data.verificationTokens.length > 0) {
      console.log(`   恢复 ${backupData.data.verificationTokens.length} 个验证令牌...`);
      for (const token of backupData.data.verificationTokens) {
        await prisma.verificationToken.create({
          data: {
            identifier: token.identifier,
            token: token.token,
            expires: new Date(token.expires)
          }
        });
      }
    }

    console.log('\n✅ 数据库恢复完成！');

    // 验证恢复结果
    const workflowCount = await prisma.workflow.count();
    const generationCount = await prisma.generation.count();
    const userCount = await prisma.user.count();

    console.log('\n📊 恢复结果验证:');
    console.log(`   工作流: ${workflowCount} 个`);
    console.log(`   生成记录: ${generationCount} 个`);
    console.log(`   用户: ${userCount} 个`);

    console.log('\n🎉 恢复完成！');

  } catch (error) {
    console.error('❌ 恢复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 获取命令行参数
const backupFilePath = process.argv[2];

if (!backupFilePath) {
  console.log('❌ 请提供备份文件路径');
  console.log('使用方法: node scripts/restore-database.js <备份文件路径>');
  console.log('示例: node scripts/restore-database.js backups/database-backup-2025-09-23T02-41-40-995Z.json');
  process.exit(1);
}

// 运行恢复
if (require.main === module) {
  restoreDatabase(backupFilePath).catch(console.error);
}

module.exports = { restoreDatabase };
