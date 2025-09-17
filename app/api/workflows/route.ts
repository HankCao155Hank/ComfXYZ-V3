import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - 获取所有工作流
export async function GET() {
  try {
    const workflows = await prisma.workflow.findMany({
      include: {
        generations: {
          orderBy: { startedAt: 'desc' },
          take: 5 // 只取最近5个生成记录
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 转换JSON字符串为对象
    const serializedWorkflows = workflows.map((workflow: { nodeData?: string | null; generations: Array<{ actualSeed?: bigint | null }> }) => ({
      ...workflow,
      nodeData: workflow.nodeData ? JSON.parse(workflow.nodeData) : null,
      generations: workflow.generations.map((gen: { actualSeed?: bigint | null }) => ({
        ...gen,
        actualSeed: gen.actualSeed ? gen.actualSeed.toString() : null
      }))
    }));

    return NextResponse.json({ success: true, data: serializedWorkflows });
  } catch (error) {
    console.error('获取工作流失败:', error);
    return NextResponse.json(
      { success: false, error: '获取工作流失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新工作流
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      curlRequest
    } = body;

    if (!name || !curlRequest) {
      return NextResponse.json(
        { success: false, error: '名称和curl请求不能为空' },
        { status: 400 }
      );
    }

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

    const workflow = await prisma.workflow.create({
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
    console.error('创建工作流失败:', error);
    return NextResponse.json(
      { success: false, error: '创建工作流失败' },
      { status: 500 }
    );
  }
}
