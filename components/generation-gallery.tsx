'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, RefreshCw, Eye, Clock, CheckCircle, XCircle, AlertCircle, Trash2, Trash } from 'lucide-react';
import { SmartImage } from './smart-image';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { useGlobalPolling } from '@/lib/hooks/useGlobalPolling';
// import { useGenerationStore } from '@/lib/stores/useGenerationStore'; // 暂时未使用

// 定义 Generation 类型
interface Generation {
  id: string;
  status: string;
  blobUrl?: string | null;
  errorMsg?: string | null;
  startedAt: string;
  completedAt?: string | null;
  actualPrompt?: string | null;
  actualWidth?: number | null;
  actualHeight?: number | null;
  actualSteps?: number | null;
  actualCfg?: number | null;
  actualSeed?: string | null;
  workflow?: {
    name: string;
  } | null;
}

interface GenerationGalleryProps {
  workflowId?: string;
  limit?: number;
  generationId?: string;
  onComplete?: (generation: Generation) => void;
  autoRefresh?: boolean;
}

export function GenerationGallery({ workflowId, limit = 50, generationId, onComplete, autoRefresh = false }: GenerationGalleryProps) {
  // 使用全局状态管理，完全禁用自动轮询
  const { generations, loading, refresh } = useGlobalPolling({
    enabled: false, // 完全禁用自动轮询
    limit,
    workflowId,
    generationId
  });
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    generation: Generation | null;
  }>({ isOpen: false, generation: null });
  const [deleting, setDeleting] = useState(false);
  const [selectedGenerations, setSelectedGenerations] = useState<string[]>([]);
  const [showBatchActions, setShowBatchActions] = useState(false);

  // 计算进度条相关数据 - 使用useMemo避免重复计算
  const progressData = useMemo(() => {
    const total = generations.length;
    const completed = generations.filter(gen => gen.status === 'completed').length;
    const running = generations.filter(gen => gen.status === 'running').length;
    const failed = generations.filter(gen => gen.status === 'failed').length;
    const pending = generations.filter(gen => gen.status === 'pending').length;
    
    return {
      total,
      completed,
      running,
      failed,
      pending,
      progress: total > 0 ? (completed / total) * 100 : 0
    };
  }, [generations]);

  // 监听特定生成任务的完成
  useEffect(() => {
    if (generationId && onComplete) {
      const targetGeneration = generations.find(gen => gen.id === generationId);
      if (targetGeneration && targetGeneration.status === 'completed') {
        onComplete(targetGeneration);
        // 任务完成后立即刷新一次，确保显示最新结果
        setTimeout(() => {
          refresh();
        }, 500);
      }
    }
  }, [generationId, generations, onComplete, refresh]);

  // 只在有特定生成任务且启用自动刷新时才轮询
  useEffect(() => {
    if (autoRefresh && generationId) {
      const interval = setInterval(() => {
        refresh();
      }, 5000); // 增加到5秒间隔
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, generationId, refresh]);


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
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 移除refresh依赖，只在组件挂载时执行一次

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
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 进度条显示 */}
      {progressData.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">生成进度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>总体进度</span>
                <span>{progressData.completed} / {progressData.total} ({Math.round(progressData.progress)}%)</span>
              </div>
              <Progress value={progressData.progress} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    已完成: {progressData.completed}
                  </span>
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 text-blue-500" />
                    运行中: {progressData.running}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    等待中: {progressData.pending}
                  </span>
                  {progressData.failed > 0 && (
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-500" />
                      失败: {progressData.failed}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {generations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">还没有生成记录</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                    <CardTitle className="text-base">
                      {generation.workflow?.name === '其他模型生成' ? 
                        `其他模型生成 (${generation.actualPrompt ? generation.actualPrompt.substring(0, 20) + '...' : '未知'})` : 
                        generation.workflow?.name || '未知工作流'
                      }
                    </CardTitle>
                  </div>
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
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteDialog({ isOpen: true, generation })}
                        >
                          <Trash2 className="w-4 h-4" />
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
