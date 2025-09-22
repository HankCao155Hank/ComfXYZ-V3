import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - 创建 Nano Banana 工作流
export async function POST(_request: NextRequest) {
  try {
    console.log('🚀 开始创建 Nano Banana 工作流...');

    const workflows = [
      {
        name: 'Nano Banana 基础生成',
        description: '使用谷歌 Nano Banana 进行基础图像生成，支持创意设计和自然语言描述',
        workflowId: 'nano-banana-basic',
        nodeData: {
          provider: 'nano_banana',
          prompt: '一张可爱风格的贴纸，描绘了一只开心的小熊猫戴着迷你竹叶帽，正在咀嚼一片绿色竹叶。设计采用粗壮、干净的描边，简单的赛璐璐上色，配色鲜艳。背景必须为白色。',
          negative_prompt: '',
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          size: 'auto'
        }
      },
      {
        name: 'Nano Banana 高质量生成',
        description: '使用谷歌 Nano Banana 进行高质量图像生成，优化参数设置',
        workflowId: 'nano-banana-high-quality',
        nodeData: {
          provider: 'nano_banana',
          prompt: 'professional photography, high resolution, detailed, masterpiece, best quality, 8K, ultra realistic, cinematic lighting',
          negative_prompt: 'low quality, blurry, distorted, pixelated, amateur',
          temperature: 0.7,
          topK: 20,
          topP: 0.8,
          size: 'auto'
        }
      },
      {
        name: 'Nano Banana 艺术风格',
        description: '使用谷歌 Nano Banana 生成艺术风格图像，适合创意设计',
        workflowId: 'nano-banana-artistic',
        nodeData: {
          provider: 'nano_banana',
          prompt: 'digital art, concept art, fantasy, magical, ethereal, soft lighting, vibrant colors, artistic composition',
          negative_prompt: 'photorealistic, realistic, photograph',
          temperature: 1.2,
          topK: 35,
          topP: 0.9,
          size: 'auto'
        }
      },
      {
        name: 'Nano Banana 动漫风格',
        description: '使用谷歌 Nano Banana 生成动漫风格图像',
        workflowId: 'nano-banana-anime',
        nodeData: {
          provider: 'nano_banana',
          prompt: 'anime style, manga, japanese animation, kawaii, cute character, clean lines, vibrant colors, cel shading',
          negative_prompt: 'realistic, photorealistic, western animation',
          temperature: 0.8,
          topK: 30,
          topP: 0.85,
          size: 'auto'
        }
      }
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

    console.log('🎉 所有 Nano Banana 工作流创建完成！');

    return NextResponse.json({ 
      success: true, 
      message: 'Nano Banana 工作流创建成功',
      data: createdWorkflows 
    });

  } catch (error) {
    console.error('❌ 创建 Nano Banana 工作流失败:', error);
    return NextResponse.json(
      { success: false, error: '创建 Nano Banana 工作流失败' },
      { status: 500 }
    );
  }
}

// GET - 获取所有 Nano Banana 工作流
export async function GET() {
  try {
    const workflows = await prisma.workflow.findMany({
      where: {
        workflowId: {
          startsWith: 'nano-banana-'
        }
      },
      include: {
        generations: {
          orderBy: { startedAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const serializedWorkflows = workflows.map((workflow: { nodeData?: string | null }) => ({
      ...workflow,
      nodeData: workflow.nodeData ? JSON.parse(workflow.nodeData) : null
    }));

    return NextResponse.json({ success: true, data: serializedWorkflows });
  } catch (error) {
    console.error('获取 Nano Banana 工作流失败:', error);
    return NextResponse.json(
      { success: false, error: '获取 Nano Banana 工作流失败' },
      { status: 500 }
    );
  }
}

