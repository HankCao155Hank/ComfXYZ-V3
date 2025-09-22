const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSingleNanoBananaWorkflow() {
  try {
    console.log('🚀 开始创建单个 Nano Banana 工作流...');

    // 先删除所有现有的Nano Banana工作流
    await prisma.workflow.deleteMany({
      where: {
        workflowId: {
          startsWith: 'nano-banana'
        }
      }
    });
    console.log('🗑️ 清理了现有的Nano Banana工作流');

    // 创建一个整合的Nano Banana工作流
    const workflow = await prisma.workflow.create({
      data: {
        name: 'Nano Banana 智能生成',
        description: '使用谷歌 Nano Banana 进行智能图像生成，支持多种风格和参数调节',
        workflowId: 'nano-banana-unified',
        nodeData: JSON.stringify({
          provider: 'nano_banana',
          prompt: '一只可爱的小猫在花园里玩耍，卡通风格，高质量',
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
        }),
        curlRequest: JSON.stringify({
          workflow_id: 'nano-banana-unified',
          prompt: {
            provider: 'nano_banana',
            prompt: '一只可爱的小猫在花园里玩耍，卡通风格，高质量',
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
          },
        })
      }
    });

    console.log(`✅ 创建整合工作流: ${workflow.name} (ID: ${workflow.id})`);
    console.log(`🎉 成功创建了 1 个整合的 Nano Banana 工作流！`);
    
    return { success: true, data: workflow };
  } catch (error) {
    console.error('❌ 创建 Nano Banana 工作流失败:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createSingleNanoBananaWorkflow()
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

module.exports = { createSingleNanoBananaWorkflow };
