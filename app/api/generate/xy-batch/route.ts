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
    const combinations = [];
    for (let yIndex = 0; yIndex < yAxisValues.length; yIndex++) {
      for (let xIndex = 0; xIndex < xAxisValues.length; xIndex++) {
        const xValue = xAxisValues[xIndex];
        const yValue = yAxisValues[yIndex];
        
            // 构建参数组合 - 使用与单个工作流完全相同的格式
            // 首先从工作流的原始nodeData开始，确保格式完全一致
            const combinedParams: Record<string, Record<string, unknown>> = JSON.parse(JSON.stringify(nodeData));
        
        // 验证节点是否存在且有对应的输入字段
        const validateNodeInput = (nodeId: string, inputKey: string) => {
          if (!nodeData[nodeId]) {
            console.warn(`节点 ${nodeId} 不存在于工作流中`);
            return false;
          }
          
          if (!nodeData[nodeId].inputs) {
            console.warn(`节点 ${nodeId} 没有输入字段`);
            return false;
          }
          
          if (!(inputKey in nodeData[nodeId].inputs)) {
            console.warn(`节点 ${nodeId} 没有输入字段 ${inputKey}`);
            return false;
          }
          
          return true;
        };
        
        // 应用默认参数（覆盖原始值）
        if (nodeData.provider === 'nano_banana') {
          // Nano Banana 使用扁平结构
          Object.entries(defaultParams).forEach(([nodeId, inputs]) => {
            if (inputs && typeof inputs === 'object') {
              Object.entries(inputs).forEach(([inputKey, value]) => {
                if (inputKey in inputs) {
                  combinedParams[inputKey] = value;
                }
              });
            }
          });
        } else {
          // 其他工作流使用嵌套结构
          Object.entries(defaultParams).forEach(([nodeId, inputs]) => {
            if (combinedParams[nodeId] && (combinedParams[nodeId] as { inputs?: Record<string, unknown> }).inputs) {
              Object.entries(inputs).forEach(([inputKey, value]) => {
                if (inputKey in (combinedParams[nodeId] as { inputs: Record<string, unknown> }).inputs) {
                  (combinedParams[nodeId] as { inputs: Record<string, unknown> }).inputs[inputKey] = value;
                }
              });
            }
          });
        }
        
        // 应用X轴参数（验证后）
        if (nodeData.provider === 'nano_banana') {
          // Nano Banana 使用扁平结构，但需要特殊处理图片字段
          if (xAxisInput.startsWith('image')) {
            // 对于图片字段，将X轴值作为单独的图片URL
            combinedParams[xAxisInput] = xValue;
          } else {
            // 对于非图片字段，直接设置
            combinedParams[xAxisInput] = xValue;
          }
        } else {
          // 其他工作流使用嵌套结构
          if (validateNodeInput(xAxisNode, xAxisInput)) {
            if (combinedParams[xAxisNode] && (combinedParams[xAxisNode] as { inputs?: Record<string, unknown> }).inputs) {
              (combinedParams[xAxisNode] as { inputs: Record<string, unknown> }).inputs[xAxisInput] = xValue;
            }
          } else {
            console.error(`跳过X轴参数设置: 节点 ${xAxisNode} 的输入 ${xAxisInput} 无效`);
          }
        }
        
        // 应用Y轴参数（验证后）
        if (nodeData.provider === 'nano_banana') {
          // Nano Banana 使用扁平结构，但需要特殊处理图片字段
          if (yAxisInput.startsWith('image')) {
            // 对于图片字段，将Y轴值作为单独的图片URL
            combinedParams[yAxisInput] = yValue;
          } else {
            // 对于非图片字段，直接设置
            combinedParams[yAxisInput] = yValue;
          }
        } else {
          // 其他工作流使用嵌套结构
          if (validateNodeInput(yAxisNode, yAxisInput)) {
            if (combinedParams[yAxisNode] && (combinedParams[yAxisNode] as { inputs?: Record<string, unknown> }).inputs) {
              (combinedParams[yAxisNode] as { inputs: Record<string, unknown> }).inputs[yAxisInput] = yValue;
            }
          } else {
            console.error(`跳过Y轴参数设置: 节点 ${yAxisNode} 的输入 ${yAxisInput} 无效`);
          }
        }
        
        console.log(`组合 ${xIndex}-${yIndex} 的最终参数:`, JSON.stringify(combinedParams, null, 2));
        
        combinations.push({
          xIndex,
          yIndex,
          xValue,
          yValue,
          workflowId: workflow.id, // 使用数据库主键 ID
          workflowBusinessId: (workflow as { workflowId: string }).workflowId, // 保存业务 ID 用于后续使用
          params: combinedParams
        });
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

      generations.push({
        generationId: generation.id,
        xIndex: combination.xIndex,
        yIndex: combination.yIndex,
        xValue: combination.xValue,
        yValue: combination.yValue
      });

      // 异步执行生成任务（添加延迟避免API限制）
      const delay = generations.length * 3000; // 每个任务间隔3秒
      setTimeout(() => {
        generateImageAsync(generation.id, combination.workflowId, combination.params);
      }, delay);
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
async function generateImageAsync(generationId: string, workflowId: string, promptData: Record<string, Record<string, unknown>>) {
  try {
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
      // 简化的 Nano Banana 参数处理
      let prompt = '';
      let image_urls = [];
      
      // 处理嵌套的提示词结构
      if (promptData.prompt && typeof promptData.prompt === 'object' && promptData.prompt.prompt) {
        prompt = promptData.prompt.prompt;
      } else if (typeof promptData.prompt === 'string') {
        prompt = promptData.prompt;
      }
      
      // 收集所有图片URL，包括默认参数和XY轴参数中的图片
      const allImageUrls = new Set<string>();
      
      // 1. 从默认参数中收集图片
      for (let i = 1; i <= 10; i++) { // 支持更多图片
        const imageKey = `image${i}`;
        if (promptData[imageKey] && typeof promptData[imageKey] === 'string' && promptData[imageKey].trim() !== '') {
          allImageUrls.add(promptData[imageKey].trim());
        }
      }
      
      // 2. 从嵌套结构中收集图片
      for (let i = 1; i <= 10; i++) {
        const imageKey = `image${i}`;
        if (promptData[imageKey] && typeof promptData[imageKey] === 'object' && promptData[imageKey][imageKey]) {
          const imageValue = promptData[imageKey][imageKey];
          if (typeof imageValue === 'string' && imageValue.trim() !== '') {
            allImageUrls.add(imageValue.trim());
          }
        }
      }
      
      // 3. 从image_urls数组中收集图片
      if (promptData.image_urls && typeof promptData.image_urls === 'object' && Array.isArray(promptData.image_urls.image_urls)) {
        promptData.image_urls.image_urls.forEach((url: string) => {
          if (url && typeof url === 'string' && url.trim() !== '') {
            allImageUrls.add(url.trim());
          }
        });
      } else if (Array.isArray(promptData.image_urls)) {
        promptData.image_urls.forEach((url: string) => {
          if (url && typeof url === 'string' && url.trim() !== '') {
            allImageUrls.add(url.trim());
          }
        });
      }
      
      // 转换为数组
      image_urls = Array.from(allImageUrls);
      
      // 验证必需参数
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('提示词不能为空');
      }
      
      if (image_urls.length === 0) {
        throw new Error('至少需要提供一张输入图像');
      }
      
      const apiParams = {
        prompt: prompt.trim(),
        image_urls
      };

      console.log('调用Nano Banana API，参数:', apiParams);
      
      // 使用统一的 callAPI 函数，只传递必要的参数
      const { callAPI } = await import('@/lib/comfy');
      const blobUrl = await callAPI('nano_banana', apiParams);

      // 更新为完成状态
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: 'completed',
          blobUrl,
          completedAt: new Date()
        }
      });
    } else {
      // 使用原有的ComfyUI API调用
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