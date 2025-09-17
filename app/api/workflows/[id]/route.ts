import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - 获取单个工作流详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id },
      include: {
        generations: {
          orderBy: { startedAt: 'desc' }
        }
      }
    });

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: '工作流不存在' },
        { status: 404 }
      );
    }

    // 转换JSON字符串为对象
    const serializedWorkflow = {
      ...workflow,
      nodeData: workflow.nodeData ? JSON.parse(workflow.nodeData) : null,
      generations: workflow.generations?.map((gen: { actualSeed?: bigint | null }) => ({
        ...gen,
        actualSeed: gen.actualSeed ? gen.actualSeed.toString() : null
      }))
    };

    return NextResponse.json({ success: true, data: serializedWorkflow });
  } catch (error) {
    console.error('获取工作流详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取工作流详情失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新工作流
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const body = await request.json();
    const {
      name,
      description,
      curlRequest
    } = body;

    // 解析curl请求
    const jsonMatch = curlRequest.match(/--data\s*'([\s\S]*?)'/);
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: '无法解析curl请求中的JSON数据' },
        { status: 400 }
      );
    }

    const jsonStr = jsonMatch[1];
    const requestData = JSON.parse(jsonStr);
    
    if (!requestData.workflow_id || !requestData.prompt) {
      return NextResponse.json(
        { success: false, error: 'curl请求中缺少workflow_id或prompt数据' },
        { status: 400 }
      );
    }

    const workflow = await prisma.workflow.update({
      where: { id: params.id },
      data: {
        name,
        description,
        curlRequest,
        workflowId: requestData.workflow_id,
        nodeData: JSON.stringify(requestData.prompt)
      }
    });

    return NextResponse.json({ success: true, data: workflow });
  } catch (error) {
    console.error('更新工作流失败:', error);
    return NextResponse.json(
      { success: false, error: '更新工作流失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除工作流
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    await prisma.workflow.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除工作流失败:', error);
    return NextResponse.json(
      { success: false, error: '删除工作流失败' },
      { status: 500 }
    );
  }
}
