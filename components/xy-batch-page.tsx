'use client';

import { useState } from 'react';
import { XYBatchGenerator } from './xy-batch-generator';
import { XYGridDisplay } from './xy-grid-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Grid, Lightbulb } from 'lucide-react';

interface XYBatchConfig {
  workflowId: string;
  xAxisNode: string; // 节点ID
  xAxisInput: string; // 输入字段名
  xAxisValues: string[];
  yAxisNode: string; // 节点ID
  yAxisInput: string; // 输入字段名
  yAxisValues: string[];
  defaultParams: Record<string, Record<string, any>>; // 其他节点的默认值
}

interface XYBatchResult {
  batchId: string;
  totalCombinations: number;
  xAxisCount: number;
  yAxisCount: number;
  xAxisNode: string;
  xAxisInput: string;
  yAxisNode: string;
  yAxisInput: string;
  generations: Array<{
    generationId: string;
    xIndex: number;
    yIndex: number;
    xValue: string;
    yValue: string;
  }>;
}

interface XYBatchPageProps {
  onBack?: () => void;
}

export function XYBatchPage({ onBack }: XYBatchPageProps) {
  const [currentBatch, setCurrentBatch] = useState<XYBatchResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const handleGenerate = async (config: XYBatchConfig) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate/xy-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      if (result.success) {
        setCurrentBatch(result.data);
        showToast(`XY轴批量生成已启动！将生成 ${result.data.totalCombinations} 张图片`);
      } else {
        showToast(result.error || '启动批量生成失败', 'error');
      }
    } catch (error) {
      showToast('启动批量生成失败', 'error');
      console.error('启动批量生成失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewBatch = () => {
    setCurrentBatch(null);
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Grid className="w-8 h-8 text-blue-500" />
            XY 轴批量生成
          </h1>
          <p className="text-muted-foreground mt-1">
            通过 XY 轴参数组合，一次性生成多张对比图片
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        )}
      </div>

      {/* 功能说明 */}
      {!currentBatch && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Lightbulb className="w-5 h-5" />
              XY 轴批量生成说明
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">📊 什么是 XY 轴批量生成？</h4>
                <p>选择两个不同的参数作为 X 轴和 Y 轴，系统会生成所有参数组合的图片，形成一个对比网格。</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🎯 适用场景</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>参数调优和对比分析</li>
                  <li>不同提示词效果测试</li>
                  <li>采样步数和CFG对比</li>
                  <li>不同尺寸效果验证</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/50 rounded-lg">
              <p className="text-xs">
                💡 <strong>使用提示：</strong> 建议从少量参数组合开始测试（如 2×2 或 3×3），
                确认效果后再扩展到更大的网格。
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 主要内容 */}
      {!currentBatch ? (
        <XYBatchGenerator 
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">批次结果</h2>
            <Button onClick={handleNewBatch} variant="outline">
              创建新批次
            </Button>
          </div>
          <XYGridDisplay 
            batchResult={currentBatch}
            onRefresh={() => {
              // 刷新逻辑已经在组件内部处理
            }}
          />
        </div>
      )}
    </div>
  );
}
