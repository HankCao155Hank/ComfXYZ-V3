const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteNanoBananaWorkflows() {
  try {
    console.log('🗑️ 开始删除现有的 Nano Banana 工作流...');

    // 删除所有Nano Banana工作流
    const result = await prisma.workflow.deleteMany({
      where: {
        workflowId: {
          startsWith: 'nano-banana'
        }
      }
    });

    console.log(`✅ 成功删除了 ${result.count} 个 Nano Banana 工作流`);
    return { success: true, deletedCount: result.count };
  } catch (error) {
    console.error('❌ 删除 Nano Banana 工作流失败:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  deleteNanoBananaWorkflows()
    .then(result => {
      if (result.success) {
        console.log('✅ 脚本执行成功');
        process.exit(0);
      } else {
        console.error('❌ 脚本执行失败:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ 脚本执行出错:', error);
      process.exit(1);
    });
}

module.exports = { deleteNanoBananaWorkflows };
