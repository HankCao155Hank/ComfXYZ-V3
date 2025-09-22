const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createGeminiNanoBananaWorkflow() {
  try {
    console.log('🚀 开始创建 Gemini Nano Banana 图片编辑工作流...');

    // 创建新的工作流
    const workflow = await prisma.workflow.create({
      data: {
        name: 'Gemini Nano Banana图片编辑',
        description: '使用Gemini Nano Banana进行图片编辑和生成',
        workflowId: 'gemini-nano-banana-image-edit',
        nodeData: JSON.stringify({
          provider: 'nano_banana',
          prompt: '请编辑这张图片，使其更加美观',
          image_urls: []
        }),
        curlRequest: JSON.stringify({
          workflow_id: 'gemini-nano-banana-image-edit',
          prompt: {
            provider: 'nano_banana',
            prompt: '请编辑这张图片，使其更加美观',
            image_urls: []
          },
        })
      }
    });

    console.log(`✅ 创建Gemini Nano Banana工作流: ${workflow.name} (ID: ${workflow.id})`);
    console.log(`🎉 成功创建了 1 个 Gemini Nano Banana 图片编辑工作流！`);
    
    return { success: true, data: workflow };
  } catch (error) {
    console.error('❌ 创建 Gemini Nano Banana 工作流失败:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createGeminiNanoBananaWorkflow()
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

module.exports = { createGeminiNanoBananaWorkflow };
