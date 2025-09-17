import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateImage } from '@/lib/comfy';

const prisma = new PrismaClient();

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
        Object.entries(defaultParams).forEach(([nodeId, inputs]) => {
          if (combinedParams[nodeId] && (combinedParams[nodeId] as { inputs?: Record<string, unknown> }).inputs) {
            Object.entries(inputs).forEach(([inputKey, value]) => {
              if (inputKey in (combinedParams[nodeId] as { inputs: Record<string, unknown> }).inputs) {
                (combinedParams[nodeId] as { inputs: Record<string, unknown> }).inputs[inputKey] = value;
              }
            });
          }
        });
        
        // 应用X轴参数（验证后）
        if (validateNodeInput(xAxisNode, xAxisInput)) {
          if (combinedParams[xAxisNode] && (combinedParams[xAxisNode] as { inputs?: Record<string, unknown> }).inputs) {
            (combinedParams[xAxisNode] as { inputs: Record<string, unknown> }).inputs[xAxisInput] = xValue;
          }
        } else {
          console.error(`跳过X轴参数设置: 节点 ${xAxisNode} 的输入 ${xAxisInput} 无效`);
        }
        
        // 应用Y轴参数（验证后）
        if (validateNodeInput(yAxisNode, yAxisInput)) {
          if (combinedParams[yAxisNode] && (combinedParams[yAxisNode] as { inputs?: Record<string, unknown> }).inputs) {
            (combinedParams[yAxisNode] as { inputs: Record<string, unknown> }).inputs[yAxisInput] = yValue;
          }
        } else {
          console.error(`跳过Y轴参数设置: 节点 ${yAxisNode} 的输入 ${yAxisInput} 无效`);
        }
        
        console.log(`组合 ${xIndex}-${yIndex} 的最终参数:`, JSON.stringify(combinedParams, null, 2));
        
        combinations.push({
          xIndex,
          yIndex,
          xValue,
          yValue,
          workflowId: (workflow as { workflowId: string }).workflowId,
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