'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, Clock, Sparkles, Trash2, Trash } from 'lucide-react';
import { SmartImage } from './smart-image';
import { GenerationStatus } from './generation-status';
import { ImageReveal } from './image-reveal';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { useGlobalPolling } from '@/lib/hooks/useGlobalPolling';
// import { useGenerationStore } from '@/lib/stores/useGenerationStore'; // 暂时未使用

// 定义Generation接口
interface Generation {
  id: string;
  workflowId: string;
  workflow?: {
    id: string;
    name: string;
    description?: string;
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
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
  onDelete?: (generationId: string) => void;
}

export function RealTimeGeneration({ 
  generationId, 
  onComplete,
  autoRefresh = true,
  onDelete
}: RealTimeGenerationProps) {
  // 使用全局状态管理
  const { generations, loading, refresh } = useGlobalPolling({
    enabled: autoRefresh,
    limit: 10
  });
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    generation: Generation | null;
  }>({ isOpen: false, generation: null });
  const [deleting, setDeleting] = useState(false);
  const [selectedGenerations, setSelectedGenerations] = useState<string[]>([]);
  const [showBatchActions, setShowBatchActions] = useState(false);

  // 监听完成状态变化
  useEffect(() => {
    if (!onComplete) return;
    
    generations.forEach((gen) => {
      if (gen.status === 'completed' && gen.blobUrl) {
        onComplete(gen);
      }
    });
  }, [generations, onComplete]);

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

  const handleDeleteGeneration = async (generation: Generation) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/generations/${generation.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 删除成功，刷新列表
        refresh();
        setDeleteDialog({ isOpen: false, generation: null });
        
        // 调用父组件的删除回调
        if (onDelete) {
          onDelete(generation.id);
        }
      } else {
        const error = await response.json();
        console.error('删除失败:', error.error);
        alert('删除失败: ' + error.error);
      }
    } catch (error) {
      console.error('删除生成记录失败:', error);
      alert('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedGenerations.length === 0) return;

    setDeleting(true);
    try {
      const response = await fetch('/api/generations/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generationIds: selectedGenerations,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // 删除成功，刷新列表
        refresh();
        setSelectedGenerations([]);
        setShowBatchActions(false);
        alert(`已删除 ${result.deletedCount} 条记录`);
      } else {
        const error = await response.json();
        console.error('批量删除失败:', error.error);
        alert('批量删除失败: ' + error.error);
      }
    } catch (error) {
      console.error('批量删除生成记录失败:', error);
      alert('批量删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const toggleGenerationSelection = (generationId: string) => {
    setSelectedGenerations(prev => 
      prev.includes(generationId) 
        ? prev.filter(id => id !== generationId)
        : [...prev, generationId]
    );
  };

  const selectAllGenerations = () => {
    setSelectedGenerations(generations.map(g => g.id));
  };

  const clearSelection = () => {
    setSelectedGenerations([]);
  };

  // 初始加载
  useEffect(() => {
    if (autoRefresh) {
      refresh();
    }
  }, [autoRefresh, refresh]);

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
        </div>
        <div className="flex items-center gap-2">
          {generations.length > 0 && (
            <Button 
              onClick={() => setShowBatchActions(!showBatchActions)} 
              variant="outline" 
              size="sm"
            >
              <Trash className="w-4 h-4 mr-2" />
              批量删除
            </Button>
          )}
          <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 批量操作栏 */}
      {showBatchActions && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedGenerations.length === generations.length && generations.length > 0}
                    onChange={selectedGenerations.length === generations.length ? clearSelection : selectAllGenerations}
                    className="rounded"
                  />
                  <span className="text-sm">
                    全选 ({selectedGenerations.length}/{generations.length})
                  </span>
                </div>
                {selectedGenerations.length > 0 && (
                  <span className="text-sm text-blue-700">
                    已选择 {selectedGenerations.length} 条记录
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={clearSelection}
                  variant="outline"
                  size="sm"
                  disabled={selectedGenerations.length === 0}
                >
                  取消选择
                </Button>
                <Button
                  onClick={handleBatchDelete}
                  variant="destructive"
                  size="sm"
                  disabled={selectedGenerations.length === 0 || deleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? "删除中..." : `删除选中 (${selectedGenerations.length})`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            refresh(); // 刷新列表
          }}
          onError={(error) => {
            console.error('生成失败:', error);
          }}
        />
      )}

      {generations.map((generation) => (
        <Card key={generation.id} className={`overflow-hidden ${selectedGenerations.includes(generation.id) ? 'ring-2 ring-blue-500' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showBatchActions && (
                  <input
                    type="checkbox"
                    checked={selectedGenerations.includes(generation.id)}
                    onChange={() => toggleGenerationSelection(generation.id)}
                    className="rounded"
                  />
                )}
                {getStatusIcon(generation.status)}
                <CardTitle className="text-base">{generation.workflow?.name || '未知工作流'}</CardTitle>
                <Badge variant="outline" className={`text-white ${getStatusColor(generation.status)}`}>
                  {getStatusText(generation.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  {formatDuration(generation.startedAt, generation.completedAt)}
                </div>
                <Button
                  onClick={() => setDeleteDialog({ isOpen: true, generation })}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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
                workflowName={generation.workflow?.name || '未知工作流'}
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
          <div className="relative max-w-2xl max-h-[80vh]">
            <SmartImage
              src={selectedImage}
              alt="Preview"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
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

      {/* 删除确认对话框 */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, generation: null })}
        onConfirm={() => deleteDialog.generation && handleDeleteGeneration(deleteDialog.generation)}
        title="删除生成记录"
        message="确定要删除这条生成记录吗？"
        itemName={deleteDialog.generation?.workflow?.name || '未知工作流'}
        isLoading={deleting}
      />
    </div>
  );
}
