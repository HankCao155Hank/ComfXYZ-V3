'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SmartImage } from './smart-image';
import { RefreshCw, Grid, Download, CheckCircle, Clock, XCircle, FileSpreadsheet, FileText } from 'lucide-react';
import { useGlobalPolling } from '@/lib/hooks/useGlobalPolling';
// import { useGenerationStore } from '@/lib/stores/useGenerationStore';

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

interface Generation {
  id: string;
  status: string;
  blobUrl?: string;
  errorMsg?: string;
  startedAt: string;
  completedAt?: string;
  actualPrompt?: string;
  actualNegativePrompt?: string;
  actualWidth?: number;
  actualHeight?: number;
  actualSteps?: number;
  actualCfg?: number;
  actualSeed?: string;
}

interface XYGridDisplayProps {
  batchResult: XYBatchResult;
  onRefresh?: () => void;
}

export function XYGridDisplay({ batchResult }: XYGridDisplayProps) {
  // 使用全局状态管理
  const { generations: allGenerations, loading, refresh } = useGlobalPolling({
    enabled: true,
    interval: 2000, // 2秒轮询间隔
    limit: 100
  });
  
  // 将generations数组转换为Record格式以保持兼容性
  const generations = allGenerations.reduce((acc, gen) => {
    acc[gen.id] = gen;
    return acc;
  }, {} as Record<string, Generation>);
  
  // 调试日志
  console.log('XYGridDisplay - batchResult:', batchResult);
  console.log('XYGridDisplay - allGenerations:', allGenerations);
  console.log('XYGridDisplay - generations:', generations);
  
  // 计算进度和状态
  const getProgress = () => {
    if (!batchResult.generations || batchResult.generations.length === 0) return 0;
    const completedCount = batchResult.generations.filter(gen => {
      const generation = generations[gen.generationId];
      return generation && generation.status === 'completed';
    }).length;
    return (completedCount / batchResult.generations.length) * 100;
  };

  const getCompletedCount = () => {
    if (!batchResult.generations || batchResult.generations.length === 0) return 0;
    return batchResult.generations.filter(gen => {
      const generation = generations[gen.generationId];
      return generation && generation.status === 'completed';
    }).length;
  };

  const getRunningCount = () => {
    if (!batchResult.generations || batchResult.generations.length === 0) return 0;
    return batchResult.generations.filter(gen => {
      const generation = generations[gen.generationId];
      return generation && generation.status === 'running';
    }).length;
  };
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<{
    xValue: string;
    yValue: string;
    generation: Generation;
  } | null>(null);
  const [exporting] = useState(false);


  const getGenerationStatus = (generationId: string) => {
    const generation = generations[generationId];
    if (!generation) return 'pending';
    return generation.status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'running':
        return <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-200 bg-green-50';
      case 'running': return 'border-blue-200 bg-blue-50';
      case 'pending': return 'border-yellow-200 bg-yellow-50';
      case 'failed': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };



  const downloadAllImages = async () => {
    const completedGenerations = batchResult.generations.filter((gen: { generationId: string }) => {
      const generation = generations[gen.generationId];
      return generation && generation.status === 'completed' && generation.blobUrl;
    });

    for (const gen of completedGenerations) {
      const generation = generations[gen.generationId];
      if (generation.blobUrl) {
        try {
          const response = await fetch(generation.blobUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `xy-batch-${gen.xIndex}-${gen.yIndex}-${gen.xValue}-${gen.yValue}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          // 添加延迟避免浏览器阻止多个下载
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('下载图片失败:', error);
        }
      }
    }
  };

  // 导出到CSV/Excel
  const exportToFile = async (format: 'csv' | 'excel') => {
    try {
      const response = await fetch('/api/export/xy-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchResult,
          format
        }),
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `xy-batch-${batchResult.batchId}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  const handleCellClick = (gen: typeof batchResult.generations[0]) => {
    const generation = generations[gen.generationId];
    if (generation && generation.blobUrl) {
      setSelectedImage(generation.blobUrl);
      setSelectedInfo({
        xValue: gen.xValue,
        yValue: gen.yValue,
        generation
      });
    }
  };

  // const getParameterLabel = (type: string) => {
  //   const labels: Record<string, string> = {
  //     prompt: '提示词',
  //     negativePrompt: '负向提示词',
  //     width: '宽度',
  //     height: '高度',
  //     steps: '采样步数',
  //     cfg: 'CFG Scale',
  //     seed: '种子值'
  //   };
  //   return labels[type] || type;
  // };

  // 初始加载
  useEffect(() => {
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 移除refresh依赖，只在组件挂载时执行一次

  return (
    <div className="space-y-6">
      {/* 批次信息和进度 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-blue-500" />
                XY 轴批量生成结果
              </CardTitle>
              <CardDescription>
                {batchResult.xAxisCount} × {batchResult.yAxisCount} = {batchResult.totalCombinations} 张图片
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              {getCompletedCount() > 0 && (
                <Button onClick={downloadAllImages} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  下载全部 ({getCompletedCount()})
                </Button>
              )}
              <div className="flex gap-1">
                <Button 
                  onClick={() => exportToFile('excel')} 
                  variant="outline" 
                  size="sm"
                  disabled={exporting}
                >
                  <FileSpreadsheet className={`w-4 h-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
                  Excel
                </Button>
                <Button 
                  onClick={() => exportToFile('csv')} 
                  variant="outline" 
                  size="sm"
                  disabled={exporting}
                >
                  <FileText className={`w-4 h-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>生成进度</span>
              <span>{getCompletedCount()} / {batchResult.totalCombinations} ({Math.round(getProgress())}%)</span>
            </div>
            <Progress value={getProgress()} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>运行中: {getRunningCount()}</span>
              <span>已完成: {getCompletedCount()}</span>
              <span>总计: {batchResult.totalCombinations}</span>
            </div>
          </div>

          {/* 轴信息 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">X轴</Badge>
                <span className="text-sm font-medium">{batchResult.xAxisNode}.{batchResult.xAxisInput}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {batchResult.generations.slice(0, batchResult.xAxisCount).map((gen: { xValue: string }) => gen.xValue).join(', ')}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">Y轴</Badge>
                <span className="text-sm font-medium">{batchResult.yAxisNode}.{batchResult.yAxisInput}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {Array.from(new Set(batchResult.generations.map((gen: { yValue: string }) => gen.yValue))).join(', ')}
              </div>
            </div>
          </div>

          {/* 导出说明 */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">📊 数据导出功能（含图片）</p>
                <p className="text-xs">
                  点击 Excel 或 CSV 按钮可以导出完整的参数组合数据，包括：
                  生成状态、实际参数、图片信息、图片尺寸、生成时间等详细信息。
                  <br />
                  <span className="font-medium">✨ 新功能：</span>Excel文件包含图片预览工作表，CSV文件包含图片信息表。图片通过URL链接访问。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 结果网格 */}
      <Card>
        <CardHeader>
          <CardTitle>生成结果网格</CardTitle>
          <CardDescription>
            点击任意图片查看大图和详细信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-fit">
              {/* 表头 - X轴标签 */}
              <div className="grid gap-2 mb-2" style={{
                gridTemplateColumns: `80px repeat(${batchResult.xAxisCount}, 1fr)`
              }}>
                <div></div>
                {batchResult.generations && batchResult.generations.length > 0 ? 
                  Array.from(new Set(batchResult.generations.map((gen: { xValue: string }) => gen.xValue))).map((xValue, index) => (
                    <div key={index} className="text-center p-2 bg-blue-50 rounded text-xs font-medium">
                      <div className="text-blue-700">{batchResult.xAxisNode}.{batchResult.xAxisInput}</div>
                      <div className="text-blue-600 font-mono">{xValue}</div>
                    </div>
                  )) : 
                  <div className="text-center p-2 bg-gray-50 rounded text-xs text-gray-500">
                    等待生成任务...
                  </div>
                }
              </div>

              {/* 网格内容 */}
              {batchResult.generations && batchResult.generations.length > 0 ? 
                Array.from(new Set(batchResult.generations.map((gen: { yValue: string }) => gen.yValue))).map((yValue, yIndex) => (
                <div key={yIndex} className="grid gap-2 mb-2" style={{
                  gridTemplateColumns: `80px repeat(${batchResult.xAxisCount}, 1fr)`
                }}>
                  {/* Y轴标签 */}
                  <div className="flex items-center justify-center p-2 bg-green-50 rounded text-xs font-medium">
                    <div className="text-center">
                      <div className="text-green-700">{batchResult.yAxisNode}.{batchResult.yAxisInput}</div>
                      <div className="text-green-600 font-mono">{yValue}</div>
                    </div>
                  </div>

                  {/* 图片网格 */}
                  {batchResult.generations
                    .filter((gen: { yValue: string }) => gen.yValue === yValue)
                    .sort((a: { xIndex: number }, b: { xIndex: number }) => a.xIndex - b.xIndex)
                    .map((gen: { generationId: string; xIndex: number; yIndex: number; xValue: string; yValue: string }) => {
                      const generation = generations[gen.generationId];
                      const status = getGenerationStatus(gen.generationId);
                      
                      return (
                        <div
                          key={gen.generationId}
                          className={`aspect-square relative overflow-hidden rounded-lg border-2 cursor-pointer transition-all hover:scale-105 max-w-24 max-h-24 ${getStatusColor(status)}`}
                          onClick={() => handleCellClick(gen)}
                        >
                          {generation && generation.blobUrl ? (
                            <SmartImage
                              src={generation.blobUrl}
                              alt={`X: ${gen.xValue}, Y: ${gen.yValue}`}
                              fill
                              className="object-cover"
                              sizes="200px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              {getStatusIcon(status)}
                            </div>
                          )}
                          
                          {/* 状态覆盖层 */}
                          <div className="absolute top-1 right-1">
                            {getStatusIcon(status)}
                          </div>
                          
                          {/* 坐标标签 */}
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                            ({gen.xIndex + 1},{gen.yIndex + 1})
                          </div>
                        </div>
                      );
                    })}
                </div>
              )) : 
                <div className="text-center p-8 text-gray-500">
                  <div className="text-lg font-medium mb-2">等待生成任务启动...</div>
                  <div className="text-sm">生成任务正在后台准备中，请稍候</div>
                </div>
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 图片预览模态框 */}
      {selectedImage && selectedInfo && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedImage(null);
            setSelectedInfo(null);
          }}
        >
          <div className="relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
            {/* 图片信息头部 */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">参数组合详情</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span>X轴: {selectedInfo.xValue}</span>
                    <span>Y轴: {selectedInfo.yValue}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedImage) {
                      const link = document.createElement('a');
                      link.href = selectedImage;
                      link.download = `xy-batch-${selectedInfo.xValue}-${selectedInfo.yValue}.png`;
                      link.click();
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载
                </Button>
              </div>
            </div>

            {/* 图片显示 */}
            <div className="relative" style={{ maxHeight: 'calc(80vh - 120px)' }}>
              <SmartImage
                src={selectedImage}
                alt="Preview"
                width={800}
                height={800}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* 详细参数信息 */}
            <div className="p-4 border-t bg-gray-50">
              <div className="grid gap-2 text-xs">
                {selectedInfo.generation.actualPrompt && (
                  <div>
                    <span className="font-medium">提示词: </span>
                    <span className="text-muted-foreground">{selectedInfo.generation.actualPrompt}</span>
                  </div>
                )}
                <div className="flex gap-4">
                  {selectedInfo.generation.actualWidth && selectedInfo.generation.actualHeight && (
                    <span>尺寸: {selectedInfo.generation.actualWidth}×{selectedInfo.generation.actualHeight}</span>
                  )}
                  {selectedInfo.generation.actualSteps && (
                    <span>步数: {selectedInfo.generation.actualSteps}</span>
                  )}
                  {selectedInfo.generation.actualCfg && (
                    <span>CFG: {selectedInfo.generation.actualCfg}</span>
                  )}
                  {selectedInfo.generation.actualSeed && (
                    <span>种子: {selectedInfo.generation.actualSeed}</span>
                  )}
                </div>
              </div>
            </div>

            {/* 关闭按钮 */}
            <Button
              className="absolute top-4 right-4"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedImage(null);
                setSelectedInfo(null);
              }}
            >
              关闭
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
