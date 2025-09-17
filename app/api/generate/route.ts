import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateImage } from '@/lib/comfy';

const prisma = new PrismaClient();

// POST - 执行单个工作流生成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, customParams } = body;

    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: '工作流ID不能为空' },
        { status: 400 }
      );
    }

    // 获取工作流配置
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    });

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: '工作流不存在' },
        { status: 404 }
      );
    }

    // 使用传入的节点参数数据
    const promptData = customParams || ((workflow as any).nodeData ? JSON.parse((workflow as any).nodeData) : {});

    // 创建生成记录
    const generation = await prisma.generation.create({
      data: {
        workflowId,
        status: 'pending'
      }
    });

    // 异步执行生成任务
    generateImageAsync(generation.id, (workflow as any).workflowId, promptData);

    return NextResponse.json({ 
      success: true, 
      data: { generationId: generation.id } 
    });
  } catch (error) {
    console.error('启动生成任务失败:', error);
    return NextResponse.json(
      { success: false, error: '启动生成任务失败' },
      { status: 500 }
    );
  }
}

// 异步生成图像函数
async function generateImageAsync(generationId: string, workflowId: string, promptData: Record<string, Record<string, unknown>>) {
  try {
    // 更新状态为运行中
    await prisma.generation.update({
      where: { id: generationId },
      data: { status: 'running' }
    });

    // 生成图像
    const blobUrl = await generateImage(workflowId, promptData);

    // 更新为完成状态
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'completed',
        blobUrl,
        completedAt: new Date()
      }
    });
  } catch (error) {
    console.error(`生成任务 ${generationId} 失败:`, error);
    
    // 更新为失败状态
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'failed',
        errorMsg: error instanceof Error ? error.message : String(error),
        completedAt: new Date()
      }
    });
  }
}
