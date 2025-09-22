import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateImage, callAPI } from '@/lib/comfy';

// POST - 执行单个工作流生成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, customParams, provider, ...apiParams } = body;

    // 获取工作流配置（如果提供了 workflowId）
    let workflow = null;
    if (workflowId) {
      workflow = await prisma.workflow.findUnique({
        where: { id: workflowId }
      });

      if (!workflow) {
        return NextResponse.json(
          { success: false, error: '工作流不存在' },
          { status: 404 }
        );
      }
    }

    // 确定使用的 API 提供商
    let apiProvider = provider;
    
    // 如果没有直接指定 provider，尝试从工作流数据中获取
    if (!apiProvider && workflow) {
      const workflowData = (workflow as { nodeData?: string }).nodeData ? 
        JSON.parse((workflow as { nodeData: string }).nodeData) : {};
      apiProvider = workflowData.provider;
    }
    
    // 如果还是没有，使用默认值
    if (!apiProvider) {
      apiProvider = process.env.API_PROVIDER || 'wuwen';
    }

    // 如果是直接返回结果的 API（美图、通义千问、豆包、Nano Banana），保存到数据库并返回结果
    if (['meitu', 'qwen_image', 'doubao_seedream', 'nano_banana'].includes(apiProvider)) {
      try {
        // 使用工作流数据或传入的参数
        const params = customParams || (workflow ? JSON.parse((workflow as { nodeData: string }).nodeData) : apiParams);
        
        // 为其他模型创建或获取虚拟工作流
        let targetWorkflowId = workflowId;
        if (!targetWorkflowId) {
          // 查找或创建虚拟工作流
          let virtualWorkflow = await prisma.workflow.findFirst({
            where: { name: '其他模型生成' }
          });
          
          if (!virtualWorkflow) {
            virtualWorkflow = await prisma.workflow.create({
              data: {
                name: '其他模型生成',
                description: '其他AI模型的生成记录',
                curlRequest: '',
                workflowId: 'other-models',
                nodeData: '{}'
              }
            });
          }
          targetWorkflowId = virtualWorkflow.id;
        }

        // 创建生成记录
        const generation = await prisma.generation.create({
          data: {
            workflowId: targetWorkflowId,
            status: 'pending'
          }
        });

        try {
          // 更新状态为运行中
          await prisma.generation.update({
            where: { id: generation.id },
            data: { status: 'running' }
          });

          // 调用API生成图像
          const resultUrl = await callAPI(apiProvider, params);
          
          // 更新为完成状态
          await prisma.generation.update({
            where: { id: generation.id },
            data: {
              status: 'completed',
              blobUrl: resultUrl,
              completedAt: new Date(),
              actualPrompt: params.prompt || '',
              actualNegativePrompt: params.negative_prompt || params.negativePrompt || '',
              actualWidth: params.width || (params.size ? parseInt(params.size.split('x')[0]) : undefined),
              actualHeight: params.height || (params.size ? parseInt(params.size.split('x')[1]) : undefined),
              actualSeed: params.seed ? params.seed.toString() : undefined
            }
          });

          return NextResponse.json({
            success: true,
            imageUrls: [resultUrl],
            generationId: generation.id
          });
        } catch (apiError) {
          // 更新为失败状态
          await prisma.generation.update({
            where: { id: generation.id },
            data: {
              status: 'failed',
              errorMsg: apiError instanceof Error ? apiError.message : String(apiError),
              completedAt: new Date()
            }
          });
          throw apiError;
        }
      } catch (error) {
        console.error(`${apiProvider} API 调用失败:`, error);
        return NextResponse.json(
          { success: false, error: error instanceof Error ? error.message : `${apiProvider} API 调用失败` },
          { status: 500 }
        );
      }
    }

    // 无问芯穹 API 的原有逻辑
    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: '工作流ID不能为空' },
        { status: 400 }
      );
    }

    // 使用传入的节点参数数据
    const promptData = customParams || ((workflow as { nodeData?: string }).nodeData ? JSON.parse((workflow as { nodeData: string }).nodeData) : {});

    // 创建生成记录
    const generation = await prisma.generation.create({
      data: {
        workflowId,
        status: 'pending'
      }
    });

    // 异步执行生成任务
    generateImageAsync(generation.id, (workflow as { workflowId: string }).workflowId, promptData);

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
