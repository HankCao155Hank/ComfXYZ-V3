import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 删除单个生成记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "需要登录才能删除记录" },
        { status: 401 }
      );
    }

    const { id: generationId } = await params;
    if (!generationId) {
      return NextResponse.json(
        { error: "缺少生成记录ID" },
        { status: 400 }
      );
    }

    // 查找生成记录
    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
      include: { workflow: true }
    });

    if (!generation) {
      return NextResponse.json(
        { error: "生成记录不存在" },
        { status: 404 }
      );
    }

    // 检查权限：只有工作流的所有者才能删除
    if (generation.workflow.userId && generation.workflow.userId !== session.user.id) {
      return NextResponse.json(
        { error: "权限不足，无法删除此记录" },
        { status: 403 }
      );
    }

    // 删除生成记录
    await prisma.generation.delete({
      where: { id: generationId }
    });

    return NextResponse.json(
      { success: true, message: "生成记录已删除" },
      { status: 200 }
    );
  } catch (error) {
    console.error("删除生成记录失败:", error);
    return NextResponse.json(
      { error: "删除失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// 批量删除生成记录
export async function POST(
  request: NextRequest
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "需要登录才能删除记录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, generationIds } = body;

    if (action === "batchDelete" && Array.isArray(generationIds)) {
      // 批量删除
      const deletedCount = await prisma.generation.deleteMany({
        where: {
          id: { in: generationIds },
          workflow: {
            userId: session.user.id // 只删除当前用户的工作流记录
          }
        }
      });

      return NextResponse.json(
        { 
          success: true, 
          message: `已删除 ${deletedCount.count} 条记录`,
          deletedCount: deletedCount.count
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "无效的操作" },
      { status: 400 }
    );
  } catch (error) {
    console.error("批量删除生成记录失败:", error);
    return NextResponse.json(
      { error: "删除失败，请稍后重试" },
      { status: 500 }
    );
  }
}
