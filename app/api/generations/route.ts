import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - 获取生成记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (workflowId) where.workflowId = workflowId;
    if (status) where.status = status;

    const generations = await prisma.generation.findMany({
      where,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.generation.count({ where });

    // 转换BigInt为字符串以便JSON序列化
    const serializedGenerations = generations.map(gen => ({
      ...gen,
      actualSeed: gen.actualSeed ? gen.actualSeed.toString() : null
    }));

    return NextResponse.json({ 
      success: true, 
      data: {
        generations: serializedGenerations,
        total,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('获取生成记录失败:', error);
    return NextResponse.json(
      { success: false, error: '获取生成记录失败' },
      { status: 500 }
    );
  }
}
