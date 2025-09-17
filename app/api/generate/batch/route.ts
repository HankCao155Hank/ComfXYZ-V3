import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateImage } from '@/lib/comfy';

const prisma = new PrismaClient();

// POST - 批量执行工作流生成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowIds, batchParams } = body;

    if (!workflowIds || !Array.isArray(workflowIds) || workflowIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '工作流ID列表不能为空' },
        { status: 400 }
      );
    }

    // 获取所有工作流配置
    const workflows = await prisma.workflow.findMany({
      where: {
        id: {
          in: workflowIds
        }
      }
    });

    if (workflows.length !== workflowIds.length) {
      return NextResponse.json(
        { success: false, error: '部分工作流不存在' },
        { status: 404 }
      );
    }

    // 为每个工作流创建生成记录
    const generations = [];
    for (const workflow of workflows) {
      // 解析工作流的节点数据
      const nodeData = workflow.nodeData ? JSON.parse(workflow.nodeData) : {};
      
      // 如果有批量参数，应用到节点数据中
      let promptData = nodeData;
      if (batchParams) {
        // 这里可以根据需要合并批量参数到节点数据中
        // 暂时使用原始的节点数据
        promptData = nodeData;
      }

      const generation = await prisma.generation.create({
        data: {
          workflowId: workflow.id,
          status: 'pending'
        }
      });

      generations.push({ generationId: generation.id, workflowName: workflow.name });

      // 异步执行生成任务（添加延迟避免API限制）
      setTimeout(() => {
        generateImageAsync(generation.id, workflow.workflowId, promptData);
      }, generations.length * 2000); // 每个任务间隔2秒
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        batchId: Date.now().toString(),
        generations 
      } 
    });
  } catch (error) {
    console.error('启动批量生成任务失败:', error);
    return NextResponse.json(
      { success: false, error: '启动批量生成任务失败' },
      { status: 500 }
    );
  }
}

// 异步生成图像函数
async function generateImageAsync(generationId: string, workflowId: string, promptData: Record<string, any>) {
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
    console.error(`批量生成任务 ${generationId} 失败:`, error);
    
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
