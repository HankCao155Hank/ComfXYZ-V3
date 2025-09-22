// 创建工作流脚本
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createWorkflows() {
  console.log('🚀 开始创建工作流...\n');

  try {
    // 1. 创建豆包 Seedream 工作流
    console.log('📝 创建豆包 Seedream 工作流...');
    const doubaoWorkflow = await prisma.workflow.create({
      data: {
        name: '豆包 Seedream 图像生成',
        description: '使用豆包 Seedream 模型生成高质量图像，支持多种尺寸比例',
        curlRequest: JSON.stringify({
          provider: 'doubao_seedream',
          prompt: '一只可爱的小猫在花园里玩耍',
          negative_prompt: '模糊, 低质量, 变形',
          size: '1024x1024',
          seed: 12345
        }),
        workflowId: 'doubao-seedream-workflow',
        nodeData: JSON.stringify({
          provider: 'doubao_seedream',
          prompt: '一只可爱的小猫在花园里玩耍',
          negative_prompt: '模糊, 低质量, 变形',
          size: '1024x1024',
          seed: 12345
        })
      }
    });
    console.log('✅ 豆包 Seedream 工作流创建成功:', doubaoWorkflow.id);

    // 2. 创建通义千问图像生成工作流
    console.log('\n📝 创建通义千问图像生成工作流...');
    const qwenWorkflow = await prisma.workflow.create({
      data: {
        name: '通义千问图像生成',
        description: '使用阿里云通义千问图像生成模型，支持多种尺寸比例',
        curlRequest: JSON.stringify({
          provider: 'qwen_image',
          prompt: '一只聪明的小狗在公园里奔跑',
          negative_prompt: '模糊, 低质量, 变形',
          size: '1328*1328',
          seed: 54321
        }),
        workflowId: 'qwen-image-workflow',
        nodeData: JSON.stringify({
          provider: 'qwen_image',
          prompt: '一只聪明的小狗在公园里奔跑',
          negative_prompt: '模糊, 低质量, 变形',
          size: '1328*1328',
          seed: 54321
        })
      }
    });
    console.log('✅ 通义千问图像生成工作流创建成功:', qwenWorkflow.id);

    // 3. 创建美图 AI 工作流
    console.log('\n📝 创建美图 AI 工作流...');
    const meituWorkflow = await prisma.workflow.create({
      data: {
        name: '美图 AI 图像编辑',
        description: '使用美图 AI 开放平台进行图像修复和编辑',
        curlRequest: JSON.stringify({
          provider: 'meitu',
          prompt: '将背景替换为海滩场景',
          image_url: 'https://example.com/image.jpg',
          mask_url: 'https://example.com/mask.jpg'
        }),
        workflowId: 'meitu-ai-workflow',
        nodeData: JSON.stringify({
          provider: 'meitu',
          prompt: '将背景替换为海滩场景',
          image_url: 'https://example.com/image.jpg',
          mask_url: 'https://example.com/mask.jpg'
        })
      }
    });
    console.log('✅ 美图 AI 工作流创建成功:', meituWorkflow.id);

    console.log('\n🎉 所有工作流创建完成！');
    console.log('\n📊 创建的工作流:');
    console.log('1. 豆包 Seedream 图像生成');
    console.log('2. 通义千问图像生成');
    console.log('3. 美图 AI 图像编辑');

  } catch (error) {
    console.error('❌ 创建工作流失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
if (require.main === module) {
  createWorkflows().catch(console.error);
}

module.exports = { createWorkflows };
