const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createNanoBananaWorkflows() {
  try {
    console.log('🚀 开始创建 Nano Banana 工作流...');

    const workflows = [
      {
        name: 'Nano Banana 基础生成',
        description: '使用谷歌 Nano Banana 进行基础图像生成',
        workflowId: 'nano-banana-basic',
        nodeData: {
          provider: 'nano_banana',
          prompt: '一只可爱的小猫在花园里玩耍，卡通风格，高质量',
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
        },
      },
      {
        name: 'Nano Banana 高质量生成',
        description: '使用谷歌 Nano Banana 生成高质量图像',
        workflowId: 'nano-banana-high-quality',
        nodeData: {
          provider: 'nano_banana',
          prompt: '一张超现实主义风格的数字艺术作品，描绘了一个漂浮在宇宙中的古老图书馆，细节丰富，光影效果出色',
          temperature: 0.7,
          topK: 20,
          topP: 0.8,
        },
      },
      {
        name: 'Nano Banana 艺术风格',
        description: '使用谷歌 Nano Banana 生成艺术风格图像',
        workflowId: 'nano-banana-art-style',
        nodeData: {
          provider: 'nano_banana',
          prompt: '一幅印象派风格的风景画，阳光透过树叶洒在小路上，色彩斑斓，笔触粗犷',
          temperature: 1.0,
          topK: 50,
          topP: 0.99,
        },
      },
      {
        name: 'Nano Banana 动漫风格',
        description: '使用谷歌 Nano Banana 生成动漫风格图像',
        workflowId: 'nano-banana-anime-style',
        nodeData: {
          provider: 'nano_banana',
          prompt: '一个穿着校服的动漫女孩，站在樱花树下，背景是日式校园，细节精致，色彩鲜明',
          temperature: 0.8,
          topK: 30,
          topP: 0.9,
        },
      },
    ];

    const createdWorkflows = [];

    for (const workflowData of workflows) {
      const workflow = await prisma.workflow.upsert({
        where: { workflowId: workflowData.workflowId },
        update: {
          name: workflowData.name,
          description: workflowData.description,
          curlRequest: JSON.stringify({
            workflow_id: workflowData.workflowId,
            prompt: workflowData.nodeData,
          }),
          nodeData: JSON.stringify(workflowData.nodeData)
        },
        create: {
          name: workflowData.name,
          description: workflowData.description,
          curlRequest: JSON.stringify({
            workflow_id: workflowData.workflowId,
            prompt: workflowData.nodeData,
          }),
          workflowId: workflowData.workflowId,
          nodeData: JSON.stringify(workflowData.nodeData)
        }
      });

      createdWorkflows.push(workflow);
      console.log(`✅ 创建/更新工作流: ${workflow.name}`);
    }

    console.log(`🎉 成功创建/更新了 ${createdWorkflows.length} 个 Nano Banana 工作流！`);
    return { success: true, data: createdWorkflows };
  } catch (error) {
    console.error('❌ 创建 Nano Banana 工作流失败:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createNanoBananaWorkflows()
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

module.exports = { createNanoBananaWorkflows };
