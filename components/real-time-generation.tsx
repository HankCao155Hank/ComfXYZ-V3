'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import { SmartImage } from './smart-image';
import { GenerationStatus } from './generation-status';
import { ImageReveal } from './image-reveal';

interface Generation {
  id: string;
  workflowId: string;
  workflow: {
    id: string;
    name: string;
    description?: string;
  };
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

interface RealTimeGenerationProps {
  generationId?: string;
  onComplete?: (generation: Generation) => void;
  autoRefresh?: boolean;
}

export function RealTimeGeneration({ 
  generationId, 
  onComplete,
  autoRefresh = true 
}: RealTimeGenerationProps) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchGenerations = useCallback(async () => {
    if (!autoRefresh && !generationId) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (generationId) {
        // 如果有特定的generationId，获取该记录
        params.set('limit', '10');
      } else {
        // 否则获取最近的生成记录
        params.set('limit', '10');
      }

      const response = await fetch(`/api/generations?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', text);
        return;
      }
      
      if (data.success) {
        const newGenerations = data.data.generations;
        setGenerations(newGenerations);
        
        // 检查是否有新完成的生成
        newGenerations.forEach((gen: Generation) => {
          if (gen.status === 'completed' && gen.blobUrl && onComplete) {
            onComplete(gen);
          }
        });
      }
    } catch (error) {
      console.error('获取生成记录失败:', error);
    } finally {
      setLoading(false);
    }
  }, [autoRefresh, generationId, onComplete]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'running': return '生成中';
      case 'pending': return '等待中';
      case 'failed': return '失败';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // const downloadImage = async (url: string, filename: string) => {
  //   try {
  //     const response = await fetch(url);
  //     const blob = await response.blob();
  //     const downloadUrl = window.URL.createObjectURL(blob);
  //     const link = document.createElement('a');
  //     link.href = downloadUrl;
  //     link.download = filename;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(downloadUrl);
  //   } catch (error) {
  //     console.error('下载图片失败:', error);
  //   }
  // };

  const formatDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}秒`;
    if (duration < 3600) return `${Math.floor(duration / 60)}分${duration % 60}秒`;
    return `${Math.floor(duration / 3600)}时${Math.floor((duration % 3600) / 60)}分`;
  };

  useEffect(() => {
    fetchGenerations();
    
    if (autoRefresh) {
      let interval: NodeJS.Timeout;
      
      const startPolling = () => {
        interval = setInterval(() => {
          // 检查是否有正在进行的任务，如果没有则减少轮询频率
          const hasRunningTasks = generations.some((gen: { status: string }) => 
            gen.status === 'pending' || gen.status === 'processing'
          );
          
          if (hasRunningTasks) {
            fetchGenerations();
          } else {
            // 如果没有运行中的任务，延长轮询间隔
            clearInterval(interval);
            setTimeout(startPolling, 10000); // 10秒后再开始轮询
          }
        }, 3000); // 有任务时每3秒刷新一次
      };
      
      startPolling();
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [generationId, autoRefresh, fetchGenerations, generations]);

  if (generations.length === 0 && !loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">暂无生成记录</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            实时生成状态
          </h3>
          <p className="text-sm text-muted-foreground">实时跟踪图像生成进度和结果</p>
        </div>
        <Button onClick={fetchGenerations} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 如果有特定的生成ID，显示专用状态组件 */}
      {generationId && (
        <GenerationStatus
          generationId={generationId}
          onComplete={() => {
            if (onComplete) {
              const generation = generations.find((g: { id: string }) => g.id === generationId);
              if (generation) {
                onComplete(generation);
              }
            }
            fetchGenerations(); // 刷新列表
          }}
          onError={(error) => {
            console.error('生成失败:', error);
          }}
        />
      )}

      {generations.map((generation) => (
        <Card key={generation.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(generation.status)}
                <CardTitle className="text-base">{generation.workflow.name}</CardTitle>
                <Badge variant="outline" className={`text-white ${getStatusColor(generation.status)}`}>
                  {getStatusText(generation.status)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDuration(generation.startedAt, generation.completedAt)}
              </div>
            </div>
            <CardDescription>
              开始时间: {new Date(generation.startedAt).toLocaleString()}
              {generation.completedAt && (
                <span className="ml-2">
                  · 完成时间: {new Date(generation.completedAt).toLocaleString()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* 显示提示词 */}
            {generation.actualPrompt && (
              <div>
                <p className="text-sm font-medium mb-1">提示词:</p>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {generation.actualPrompt}
                </p>
              </div>
            )}

            {/* 生成中的进度提示 */}
            {generation.status === 'running' && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-700">图像生成中...</p>
                  <p className="text-xs text-blue-600">请稍候，这通常需要1-3分钟</p>
                </div>
              </div>
            )}

            {/* 等待中的提示 */}
            {generation.status === 'pending' && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-yellow-700">等待处理中...</p>
                  <p className="text-xs text-yellow-600">任务已提交，正在队列中等待</p>
                </div>
              </div>
            )}

            {/* 生成完成的图像显示 - 使用新的ImageReveal组件 */}
            {generation.status === 'completed' && generation.blobUrl && (
              <ImageReveal
                imageUrl={generation.blobUrl}
                prompt={generation.actualPrompt || ''}
                workflowName={generation.workflow.name}
                generationId={generation.id}
                onPreview={() => setSelectedImage(generation.blobUrl!)}
                onDownload={() => {
                  console.log('图片下载完成');
                }}
              />
            )}

            {/* 失败状态显示 */}
            {generation.status === 'failed' && generation.errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm font-medium text-red-700">生成失败</p>
                </div>
                <p className="text-sm text-red-600">{generation.errorMsg}</p>
              </div>
            )}

            {/* 生成参数显示 */}
            <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
              {generation.actualWidth && generation.actualHeight && (
                <Badge variant="outline" className="text-xs">
                  {generation.actualWidth}×{generation.actualHeight}
                </Badge>
              )}
              {generation.actualSteps && (
                <Badge variant="outline" className="text-xs">
                  步数: {generation.actualSteps}
                </Badge>
              )}
              {generation.actualCfg && (
                <Badge variant="outline" className="text-xs">
                  CFG: {generation.actualCfg}
                </Badge>
              )}
              {generation.actualSeed && (
                <Badge variant="outline" className="text-xs">
                  种子: {generation.actualSeed}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 图片预览模态框 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <SmartImage
              src={selectedImage}
              alt="Preview"
              width={1200}
              height={1200}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              className="absolute top-4 right-4"
              variant="secondary"
              size="sm"
              onClick={() => setSelectedImage(null)}
            >
              关闭
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
