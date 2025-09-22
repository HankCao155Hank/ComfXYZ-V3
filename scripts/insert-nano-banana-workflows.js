const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertNanoBananaWorkflows() {
  try {
    console.log('🚀 开始插入 Nano Banana 工作流...');

    const workflows = [
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
    ];

    for (const workflowData of workflows) {
      // 先检查是否已存在
      const existing = await prisma.workflow.findUnique({
        where: { workflowId: workflowData.workflowId }
      });

      if (existing) {
        console.log(`⚠️  工作流已存在: ${workflowData.name}`);
        continue;
      }

      const workflow = await prisma.workflow.create({
        data: workflowData
      });

      console.log(`✅ 创建工作流: ${workflow.name} (ID: ${workflow.id})`);
    }

    console.log('🎉 Nano Banana 工作流插入完成！');

    // 验证插入结果
    const count = await prisma.workflow.count({
      where: {
        workflowId: {
          startsWith: 'nano-banana-'
        }
      }
    });

    console.log(`📊 数据库中现有 ${count} 个 Nano Banana 工作流`);

  } catch (error) {
    console.error('❌ 插入 Nano Banana 工作流失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行脚本
insertNanoBananaWorkflows()
  .then(() => {
    console.log('✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
