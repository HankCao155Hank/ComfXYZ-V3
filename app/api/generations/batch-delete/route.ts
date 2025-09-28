import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "需要登录才能删除记录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { generationIds, statusFilter } = body;

    if (!Array.isArray(generationIds) || generationIds.length === 0) {
      return NextResponse.json(
        { error: "请选择要删除的记录" },
        { status: 400 }
      );
    }

    // 构建删除条件 - 允许删除没有关联工作流的记录，或者关联到当前用户工作流的记录，或者没有用户关联的工作流记录
    const whereCondition: {
      id: { in: string[] };
      OR: Array<{
        workflowId: null;
      } | {
        workflow: { userId: string };
      } | {
        workflow: { userId: null };
      }>;
      status?: string;
    } = {
      id: { in: generationIds },
      OR: [
        { workflowId: null }, // 没有关联工作流的记录
        { workflow: { userId: session.user.id } }, // 关联到当前用户工作流的记录
        { workflow: { userId: null } } // 关联到没有用户的工作流记录（系统默认工作流）
      ]
    };

    // 如果指定了状态过滤，添加状态条件
    if (statusFilter && statusFilter !== 'all') {
      whereCondition.status = statusFilter;
    }

    // 执行批量删除
    const deletedCount = await prisma.generation.deleteMany({
      where: whereCondition
    });

    return NextResponse.json(
      { 
        success: true, 
        message: `已删除 ${deletedCount.count} 条记录`,
        deletedCount: deletedCount.count
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("批量删除生成记录失败:", error);
    return NextResponse.json(
      { error: "删除失败，请稍后重试" },
      { status: 500 }
    );
  }
}
