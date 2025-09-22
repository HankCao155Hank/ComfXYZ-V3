const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createNanoBananaWorkflows() {
  try {
    console.log('🚀 开始创建 Nano Banana 工作流...');

    // 创建基础 Nano Banana 工作流
    const basicWorkflow = await prisma.workflow.upsert({
      where: { workflowId: 'nano-banana-basic' },
      update: {},
      create: {
        name: 'Nano Banana 基础生成',
        description: '使用谷歌 Nano Banana 进行基础图像生成，支持创意设计和自然语言描述',
        curlRequest: '',
        workflowId: 'nano-banana-basic',
        nodeData: JSON.stringify({
          provider: 'nano_banana',
          prompt: '一张可爱风格的贴纸，描绘了一只开心的小熊猫戴着迷你竹叶帽，正在咀嚼一片绿色竹叶。设计采用粗壮、干净的描边，简单的赛璐璐上色，配色鲜艳。背景必须为白色。',
          negative_prompt: '',
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          size: 'auto'
        })
      }
    });

    console.log('✅ 创建基础 Nano Banana 工作流:', basicWorkflow.name);

    // 创建高质量 Nano Banana 工作流
    const highQualityWorkflow = await prisma.workflow.upsert({
      where: { workflowId: 'nano-banana-high-quality' },
      update: {},
      create: {
        name: 'Nano Banana 高质量生成',
        description: '使用谷歌 Nano Banana 进行高质量图像生成，优化参数设置',
        curlRequest: '',
        workflowId: 'nano-banana-high-quality',
        nodeData: JSON.stringify({
          provider: 'nano_banana',
          prompt: 'professional photography, high resolution, detailed, masterpiece, best quality, 8K, ultra realistic, cinematic lighting',
          negative_prompt: 'low quality, blurry, distorted, pixelated, amateur',
          temperature: 0.7,
          topK: 20,
          topP: 0.8,
          size: 'auto'
        })
      }
    });

    console.log('✅ 创建高质量 Nano Banana 工作流:', highQualityWorkflow.name);

    // 创建艺术风格 Nano Banana 工作流
    const artisticWorkflow = await prisma.workflow.upsert({
      where: { workflowId: 'nano-banana-artistic' },
      update: {},
      create: {
        name: 'Nano Banana 艺术风格',
        description: '使用谷歌 Nano Banana 生成艺术风格图像，适合创意设计',
        curlRequest: '',
        workflowId: 'nano-banana-artistic',
        nodeData: JSON.stringify({
          provider: 'nano_banana',
          prompt: 'digital art, concept art, fantasy, magical, ethereal, soft lighting, vibrant colors, artistic composition',
          negative_prompt: 'photorealistic, realistic, photograph',
          temperature: 1.2,
          topK: 35,
          topP: 0.9,
          size: 'auto'
        })
      }
    });

    console.log('✅ 创建艺术风格 Nano Banana 工作流:', artisticWorkflow.name);

    // 创建动漫风格 Nano Banana 工作流
    const animeWorkflow = await prisma.workflow.upsert({
      where: { workflowId: 'nano-banana-anime' },
      update: {},
      create: {
        name: 'Nano Banana 动漫风格',
        description: '使用谷歌 Nano Banana 生成动漫风格图像',
        curlRequest: '',
        workflowId: 'nano-banana-anime',
        nodeData: JSON.stringify({
          provider: 'nano_banana',
          prompt: 'anime style, manga, japanese animation, kawaii, cute character, clean lines, vibrant colors, cel shading',
          negative_prompt: 'realistic, photorealistic, western animation',
          temperature: 0.8,
          topK: 30,
          topP: 0.85,
          size: 'auto'
        })
      }
    });

    console.log('✅ 创建动漫风格 Nano Banana 工作流:', animeWorkflow.name);

    console.log('🎉 所有 Nano Banana 工作流创建完成！');
    console.log('📋 创建的工作流:');
    console.log('  - Nano Banana 基础生成');
    console.log('  - Nano Banana 高质量生成');
    console.log('  - Nano Banana 艺术风格');
    console.log('  - Nano Banana 动漫风格');

  } catch (error) {
    console.error('❌ 创建 Nano Banana 工作流失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createNanoBananaWorkflows()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { createNanoBananaWorkflows };

