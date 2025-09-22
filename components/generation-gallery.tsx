'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { SmartImage } from './smart-image';

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

interface GenerationGalleryProps {
  workflowId?: string;
  limit?: number;
}

export function GenerationGallery({ workflowId, limit = 50 }: GenerationGalleryProps) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchGenerations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (workflowId) params.set('workflowId', workflowId);
      params.set('limit', limit.toString());

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
        setGenerations(data.data.generations);
      }
    } catch (error) {
      console.error('获取生成记录失败:', error);
    } finally {
      setLoading(false);
    }
  }, [workflowId, limit]);

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('下载图片失败:', error);
    }
  };

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
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
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
    
    // 智能轮询：如果有正在进行的任务，则频繁轮询；否则减少频率
    const interval = setInterval(() => {
      const hasRunningTasks = generations.some((gen: { status: string }) => 
        gen.status === 'pending' || gen.status === 'processing'
      );
      
      if (hasRunningTasks) {
        fetchGenerations();
      }
    }, 15000); // 统一15秒轮询，大幅减少API调用频率
    
    return () => clearInterval(interval);
  }, [workflowId, limit, fetchGenerations, generations]);

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">生成结果</h2>
          <p className="text-muted-foreground">
            {workflowId ? '工作流生成记录' : '所有生成记录'} ({generations.length} 项)
          </p>
        </div>
        <Button onClick={fetchGenerations} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {generations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">还没有生成记录</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {generations.map((generation) => (
            <Card key={generation.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {generation.workflow?.name === '其他模型生成' ? 
                      `其他模型生成 (${generation.actualPrompt ? generation.actualPrompt.substring(0, 20) + '...' : '未知'})` : 
                      generation.workflow?.name || '未知工作流'
                    }
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(generation.status)}
                    <span className="text-sm">{getStatusText(generation.status)}</span>
                  </div>
                </div>
                <CardDescription>
                  {new Date(generation.startedAt).toLocaleString()}
                  {generation.completedAt && (
                    <span className="ml-2">
                      · 耗时 {formatDuration(generation.startedAt, generation.completedAt)}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {generation.status === 'completed' && generation.blobUrl && (
                  <div className="relative group">
                  <div className="aspect-[4/3] relative overflow-hidden rounded-lg bg-muted">
                    <SmartImage
                      src={generation.blobUrl}
                      alt="Generated image"
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedImage(generation.blobUrl!)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => downloadImage(
                            generation.blobUrl!,
                            `${generation.workflow?.name === '其他模型生成' ? 'other-models' : (generation.workflow?.name || 'unknown')}-${generation.id}.png`
                          )}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  </div>
                )}

                {generation.status === 'failed' && generation.errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{generation.errorMsg}</p>
                  </div>
                )}

                {generation.actualPrompt && (
                  <div>
                    <p className="text-sm font-medium mb-1">提示词:</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {generation.actualPrompt}
                    </p>
                  </div>
                )}

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
        </div>
      )}

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
