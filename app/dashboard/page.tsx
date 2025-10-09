'use client';

import { useState } from 'react';
import { WorkflowForm } from '@/components/workflow-form';
import { UnifiedWorkflowList } from '@/components/unified-workflow-list';
import { GenerationGallery } from '@/components/generation-gallery';
import { XYBatchGenerator } from '@/components/xy-batch-generator';
import { XYGridDisplay } from '@/components/xy-grid-display';
import { UserMenu } from '@/components/user-menu';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceMonitor } from '@/components/performance-monitor';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  curlRequest: string;
  workflowId: string;
  nodeData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

function HomeContent() {
  const [activeTab, setActiveTab] = useState('xy-batch');
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [currentXYBatch, setCurrentXYBatch] = useState<{
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
  } | null>(null);
  const [isXYGenerating, setIsXYGenerating] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // 简单的toast实现，可以后续替换为更完善的组件
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

  const handleCreateWorkflow = async (data: { name: string; description: string; curlRequest: string }) => {
    setFormLoading(true);
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        showToast('工作流创建成功！');
        setShowForm(false);
        // 刷新工作流列表会通过组件内部的useEffect自动处理
      } else {
        showToast(result.error || '创建失败', 'error');
      }
    } catch (error) {
      showToast('创建工作流失败', 'error');
      console.error('创建工作流失败:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateWorkflow = async (data: { name: string; description: string; curlRequest: string }) => {
    if (!editingWorkflow) return;
    
    setFormLoading(true);
    try {
      const response = await fetch(`/api/workflows/${editingWorkflow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        showToast('工作流更新成功！');
        setEditingWorkflow(null);
        setShowForm(false);
      } else {
        showToast(result.error || '更新失败', 'error');
      }
    } catch (error) {
      showToast('更新工作流失败', 'error');
      console.error('更新工作流失败:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleGenerate = async (workflowId: string, customParams?: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          customParams,
          ...customParams, // 展开参数，包括 provider 等
        }),
      });

      const result = await response.json();
      if (result.success) {
        showToast('生成任务已启动！');
        // 如果是直接返回结果的 API（其他模型），跳转到历史记录页面
        if (result.imageUrls && result.imageUrls.length > 0) {
          showToast(`${customParams?.provider || 'API'} 调用成功！图像已生成`);
          setActiveTab('gallery'); // 跳转到历史记录页面
        } else {
          // ComfyUI 工作流，跳转到历史记录页面并显示进度
          setCurrentGenerationId(result.data.generationId);
          setActiveTab('gallery');
        }
      } else {
        showToast(result.error || '启动生成任务失败', 'error');
      }
    } catch (error) {
      showToast('启动生成任务失败', 'error');
      console.error('启动生成任务失败:', error);
    }
  };

  const handleBatchGenerate = async (workflowIds: string[], batchParams?: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/generate/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowIds,
          batchParams,
        }),
      });

      const result = await response.json();
      if (result.success) {
        showToast(`批量生成任务已启动！(${result.data.generations.length} 个任务)`);
        setCurrentGenerationId(null); // 批量生成时不设置特定ID
        setActiveTab('gallery');
      } else {
        showToast(result.error || '启动批量生成任务失败', 'error');
      }
    } catch (error) {
      showToast('启动批量生成任务失败', 'error');
      console.error('启动批量生成任务失败:', error);
    }
  };

  const handleNewWorkflow = () => {
    setEditingWorkflow(null);
    setShowForm(true);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingWorkflow(null);
  };

  const handleXYGenerate = async (batchData: {
    workflowId: string;
    xAxisNode: string;
    xAxisInput: string;
    xAxisValues: string[];
    yAxisNode: string;
    yAxisInput: string;
    yAxisValues: string[];
    defaultParams: Record<string, Record<string, unknown>>;
  }) => {
    setIsXYGenerating(true);
    try {
      const response = await fetch('/api/generate/xy-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchData),
      });

      const result = await response.json();
      if (result.success) {
        showToast(`XY 批量生成已启动！(${result.data.totalCombinations} 个任务)`);
        setCurrentXYBatch(result.data);
        setActiveTab('xy-batch');
      } else {
        showToast(result.error || '启动 XY 批量生成失败', 'error');
      }
    } catch (error) {
      showToast('启动 XY 批量生成失败', 'error');
      console.error('启动 XY 批量生成失败:', error);
    } finally {
      setIsXYGenerating(false);
    }
  };

  const handleNewXYBatch = () => {
    setCurrentXYBatch(null);
  };

  if (showForm) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="outline" onClick={handleCancelForm}>
            ← 返回列表
          </Button>
        </div>
        <WorkflowForm
          initialData={editingWorkflow || undefined}
          onSubmit={editingWorkflow ? handleUpdateWorkflow : handleCreateWorkflow}
          onCancel={handleCancelForm}
          isLoading={formLoading}
        />
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">AI 工作流管理系统</h1>
        </div>
        <UserMenu />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="xy-batch">批量生成</TabsTrigger>
          <TabsTrigger value="unified-workflows">模型管理</TabsTrigger>
          <TabsTrigger value="gallery">历史记录</TabsTrigger>
        </TabsList>
        
        <TabsContent value="xy-batch" className="space-y-6">
          {!currentXYBatch ? (
            <XYBatchGenerator 
              onGenerate={handleXYGenerate}
              isGenerating={isXYGenerating}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">批次结果</h2>
                <Button onClick={handleNewXYBatch} variant="outline">
                  创建新批次
                </Button>
              </div>
              <XYGridDisplay 
                batchResult={currentXYBatch}
                onRefresh={() => {
                  // 刷新逻辑已经在组件内部处理
                }}
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="unified-workflows" className="space-y-6">
          <UnifiedWorkflowList
            onCreateNew={handleNewWorkflow}
            onEdit={handleEditWorkflow}
            onGenerate={handleGenerate}
            onBatchGenerate={handleBatchGenerate}
            onXYBatch={() => setActiveTab('xy-batch')}
          />
        </TabsContent>
        
        <TabsContent value="gallery" className="space-y-6">
          <GenerationGallery 
            generationId={currentGenerationId || undefined}
            onComplete={(generation) => {
              showToast(`图像生成完成：${generation.workflow?.name || '未知工作流'}`);
              // 任务完成后清除currentGenerationId，停止自动刷新
              setCurrentGenerationId(null);
            }}
            autoRefresh={!!currentGenerationId}
          />
        </TabsContent>
      </Tabs>
      
      {/* 性能监控组件 */}
      <PerformanceMonitor />
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}