const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteNanoBananaWorkflows() {
  try {
    console.log('🗑️ 开始删除指定的 Nano Banana 工作流...');

    // 要删除的工作流名称
    const workflowsToDelete = [
      'Nano Banana 动漫风格',
      'Nano Banana 艺术风格', 
      'Nano Banana 高质量生成'
    ];

    let deletedCount = 0;

    for (const workflowName of workflowsToDelete) {
      try {
        // 查找工作流
        const workflow = await prisma.workflow.findFirst({
          where: {
            name: workflowName
          }
        });

        if (workflow) {
          // 删除工作流
          await prisma.workflow.delete({
            where: {
              id: workflow.id
            }
          });
          
          console.log(`✅ 已删除工作流: ${workflowName} (ID: ${workflow.id})`);
          deletedCount++;
        } else {
          console.log(`⚠️  未找到工作流: ${workflowName}`);
        }
      } catch (error) {
        console.error(`❌ 删除工作流 ${workflowName} 失败:`, error.message);
      }
    }

    console.log(`🎉 删除完成！共删除了 ${deletedCount} 个工作流`);

    // 验证删除结果
    const remainingWorkflows = await prisma.workflow.findMany({
      where: {
        name: {
          contains: 'Nano Banana'
        }
      },
      select: {
        id: true,
        name: true,
        workflowId: true
      }
    });

    console.log('📊 剩余的 Nano Banana 工作流:');
    if (remainingWorkflows.length === 0) {
      console.log('  无');
    } else {
      remainingWorkflows.forEach(workflow => {
        console.log(`  - ${workflow.name} (${workflow.workflowId})`);
      });
    }

    return { success: true, deletedCount };
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
        console.error('❌ 脚本执行失败');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ 脚本执行出错:', error);
      process.exit(1);
    });
}

module.exports = { deleteNanoBananaWorkflows };