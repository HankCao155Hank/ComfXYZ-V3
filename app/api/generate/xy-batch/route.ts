import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateImage } from '@/lib/comfy';

interface XYBatchConfig {
  workflowId: string;
  xAxisNode: string; // 节点ID
  xAxisInput: string; // 输入字段名
  xAxisValues: string[];
  yAxisNode: string; // 节点ID
  yAxisInput: string; // 输入字段名
  yAxisValues: string[];
  defaultParams: Record<string, Record<string, unknown>>; // 其他节点的默认值
}

// 统一的参数组合接口
interface ParameterCombination {
  xValue: string;
  yValue: string;
  xIndex: number;
  yIndex: number;
  images: string[]; // 只包含当前组合的图片
  otherParams: Record<string, unknown>; // 其他参数
  generationId?: string; // 生成任务ID
}

// 任务队列管理器
class TaskQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;
  private concurrency = 1; // 并发数，避免API限制

  async addTask(task: () => Promise<void>) {
    this.queue.push(task);
    if (!this.running) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.running = true;
    while (this.queue.length > 0) {
      const tasks = this.queue.splice(0, this.concurrency);
      await Promise.allSettled(tasks.map(task => task()));
      
      // 添加延迟避免API限制
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    this.running = false;
  }
}

const taskQueue = new TaskQueue();

// 创建参数组合的辅助函数
function createParameterCombination(
  xValue: string,
  yValue: string,
  xIndex: number,
  yIndex: number,
  xAxisInput: string,
  yAxisInput: string,
  defaultParams: Record<string, Record<string, unknown>>,
  // _nodeData: Record<string, unknown> // 暂时未使用
): ParameterCombination {
  // 收集图片URL
  const images: string[] = [];
  
  // 检查X轴是否为图片字段
  const isXAxisImage = xAxisInput.startsWith('image') || xAxisInput === 'image_urls';
  // 检查Y轴是否为图片字段
  const isYAxisImage = yAxisInput.startsWith('image') || yAxisInput === 'image_urls';
  
  // 添加X轴图片（仅当X轴是图片字段时）
  if (isXAxisImage && xValue && xValue.trim() !== '') {
    images.push(xValue.trim());
    console.log(`添加X轴图片: ${xValue.trim()}`);
  }
  
  // 添加Y轴图片（仅当Y轴是图片字段时）
  if (isYAxisImage && yValue && yValue.trim() !== '') {
    images.push(yValue.trim());
    console.log(`添加Y轴图片: ${yValue.trim()}`);
  }
  
  // 收集默认参数中的图片
  Object.entries(defaultParams).forEach(([nodeId, inputs]) => {
    if (inputs && typeof inputs === 'object') {
      Object.entries(inputs).forEach(([inputKey, value]) => {
        // 收集图片字段，但排除XY轴字段
        // 只有当XY轴字段是图片字段时才排除，文本字段不影响默认参数图片收集
        const isExcludedField = (inputKey === xAxisInput && isXAxisImage) || 
                               (inputKey === yAxisInput && isYAxisImage);
        
        if (!isExcludedField && 
            (inputKey.startsWith('image') || inputKey === 'image_urls') &&
            value && typeof value === 'string' && value.trim() !== '') {
          images.push(value.trim());
          console.log(`添加默认参数图片 (${nodeId}.${inputKey}): ${value.trim()}`);
        }
      });
    }
  });
  
  console.log(`组合 ${xIndex}-${yIndex} 收集到的图片总数: ${images.length}`, images);
  
  // 收集其他参数（排除图片字段）
  const otherParams: Record<string, unknown> = {};
  
  // 添加X轴参数（如果不是图片字段）
  if (!isXAxisImage && xValue && xValue.trim() !== '') {
    otherParams[xAxisInput] = xValue.trim();
    console.log(`添加X轴参数 (${xAxisInput}): ${xValue.trim()}`);
  }
  
  // 添加Y轴参数（如果不是图片字段）
  if (!isYAxisImage && yValue && yValue.trim() !== '') {
    otherParams[yAxisInput] = yValue.trim();
    console.log(`添加Y轴参数 (${yAxisInput}): ${yValue.trim()}`);
  }
  
  // 应用默认参数（排除XY轴字段和图片字段）
  Object.entries(defaultParams).forEach(([, inputs]) => {
    if (inputs && typeof inputs === 'object') {
      Object.entries(inputs).forEach(([inputKey, value]) => {
        // 排除XY轴字段和所有图片字段
        if (inputKey !== xAxisInput && 
            inputKey !== yAxisInput && 
            !inputKey.startsWith('image') && 
            inputKey !== 'image_urls' &&
            !inputKey.includes('image')) {
          otherParams[inputKey] = value;
        }
      });
    }
  });
  
  return {
    xValue,
    yValue,
    xIndex,
    yIndex,
    images,
    otherParams
  };
}

// POST - XY轴批量生成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, xAxisNode, xAxisInput, xAxisValues, yAxisNode, yAxisInput, yAxisValues, defaultParams }: XYBatchConfig = body;

    if (!workflowId || !xAxisNode || !xAxisInput || !yAxisNode || !yAxisInput) {
      return NextResponse.json(
        { success: false, error: '参数不完整' },
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

    // 解析节点数据
    const nodeData = (workflow as { nodeData?: string }).nodeData ? JSON.parse((workflow as { nodeData: string }).nodeData) : {};
    console.log("工作流节点数据:", JSON.stringify(nodeData, null, 2));
    console.log("X轴配置:", { node: xAxisNode, input: xAxisInput, values: xAxisValues });
    console.log("Y轴配置:", { node: yAxisNode, input: yAxisInput, values: yAxisValues });
    console.log("默认参数:", JSON.stringify(defaultParams, null, 2));

    // 生成所有参数组合
    const combinations: ParameterCombination[] = [];
    
    for (let yIndex = 0; yIndex < yAxisValues.length; yIndex++) {
      for (let xIndex = 0; xIndex < xAxisValues.length; xIndex++) {
        const xValue = xAxisValues[xIndex];
        const yValue = yAxisValues[yIndex];
        
        // 创建参数组合
        const combination = createParameterCombination(
          xValue, yValue, xIndex, yIndex,
          xAxisInput, yAxisInput,
          defaultParams
        );
        
        combinations.push(combination);
        console.log(`组合 ${xIndex}-${yIndex}:`, combination);
      }
    }

    // 创建批次记录
    const batchId = `xy-batch-${Date.now()}`;
    const generations = [];

    for (const combination of combinations) {
      const generation = await prisma.generation.create({
        data: {
          workflowId,
          status: 'pending'
        }
      });

      // 更新组合的生成ID
      combination.generationId = generation.id;

      generations.push({
        generationId: generation.id,
        xIndex: combination.xIndex,
        yIndex: combination.yIndex,
        xValue: combination.xValue,
        yValue: combination.yValue
      });

      // 使用任务队列管理异步任务
      taskQueue.addTask(async () => {
        await generateImageAsync(generation.id, workflowId, combination);
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        batchId,
        totalCombinations: combinations.length,
        xAxisCount: xAxisValues.length,
        yAxisCount: yAxisValues.length,
        xAxisNode,
        xAxisInput,
        yAxisNode,
        yAxisInput,
        generations 
      } 
    });
  } catch (error) {
    console.error('启动XY轴批量生成失败:', error);
    return NextResponse.json(
      { success: false, error: '启动XY轴批量生成失败' },
      { status: 500 }
    );
  }
}

// 异步生成图像函数
async function generateImageAsync(generationId: string, workflowId: string, combination: ParameterCombination) {
  try {
    console.log(`开始处理生成任务 ${generationId}:`, combination);
    
    // 更新状态为运行中
    await prisma.generation.update({
      where: { id: generationId },
      data: { status: 'running' }
    });

    // 获取工作流信息以确定provider
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    });

    if (!workflow) {
      throw new Error('工作流不存在');
    }

    const workflowData = JSON.parse(workflow.nodeData);
    
    // 检查是否是Nano Banana工作流
    if (workflowData.provider === 'nano_banana') {
      await generateNanoBananaImage(generationId, combination, workflowData);
    } else {
      await generateComfyUIImage(generationId, workflowId, combination);
    }
  } catch (error) {
    console.error(`XY批量生成任务 ${generationId} 失败:`, error);
    
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

// Nano Banana 图像生成
async function generateNanoBananaImage(generationId: string, combination: ParameterCombination, workflowData: Record<string, unknown>) {
  // 获取提示词
  let prompt = '';
  if (combination.otherParams.prompt && typeof combination.otherParams.prompt === 'string') {
    prompt = combination.otherParams.prompt;
  } else if (workflowData.prompt && typeof workflowData.prompt === 'string') {
    prompt = workflowData.prompt;
  }
  
  // 验证必需参数
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('提示词不能为空');
  }
  
  if (combination.images.length === 0) {
    throw new Error('至少需要提供一张输入图像');
  }
  
  const apiParams = {
    prompt: prompt.trim(),
    image_urls: combination.images,
    model: 'nano-banana' as const
  };

  console.log(`组合 ${combination.xIndex}-${combination.yIndex} 的API参数:`, apiParams);
  
  // 直接调用 Nano Banana API
  const { generateNanoBananaImage: generateNanoBanana } = await import('@/lib/image-gen/nano_banana');
  const result = await generateNanoBanana({
    prompt: apiParams.prompt,
    image_urls: apiParams.image_urls
  });

  if (!result.success) {
    throw new Error(result.error || 'Nano Banana 图像生成失败');
  }

  // 更新为完成状态
  await prisma.generation.update({
    where: { id: generationId },
    data: {
      status: 'completed',
      blobUrl: result.url,
      completedAt: new Date()
    }
  });
}

// ComfyUI 图像生成
async function generateComfyUIImage(generationId: string, workflowId: string, combination: ParameterCombination) {
  // 获取工作流信息以获取正确的workflowId
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId }
  });

  if (!workflow) {
    throw new Error('工作流不存在');
  }

  // 构建ComfyUI参数
  const comfyParams = {
    ...combination.otherParams,
    images: combination.images
  };
  
  // 使用工作流的业务ID而不是数据库主键
  const blobUrl = await generateImage(workflow.workflowId, comfyParams);

  // 更新为完成状态
  await prisma.generation.update({
    where: { id: generationId },
    data: {
      status: 'completed',
      blobUrl,
      completedAt: new Date()
    }
  });
}