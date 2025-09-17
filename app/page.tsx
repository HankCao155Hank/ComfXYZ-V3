'use client';

import { useState } from 'react';
import { WorkflowForm } from '@/components/workflow-form';
import { WorkflowList } from '@/components/workflow-list';
import { GenerationGallery } from '@/components/generation-gallery';
import { RealTimeGeneration } from '@/components/real-time-generation';
import { FeatureHighlight } from '@/components/feature-highlight';
import { XYBatchPage } from '@/components/xy-batch-page';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export default function Home() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [showXYBatch, setShowXYBatch] = useState(false);

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
        }),
      });

      const result = await response.json();
      if (result.success) {
        showToast('生成任务已启动！');
        setCurrentGenerationId(result.data.generationId);
        setActiveTab('realtime');
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
        setActiveTab('realtime');
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

  if (showXYBatch) {
    return (
      <div className="container mx-auto py-8 px-4">
        <XYBatchPage onBack={() => setShowXYBatch(false)} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">ComfyUI 工作流管理系统</h1>
        <p className="text-muted-foreground">
          创建、管理和批量执行图像生成工作流，所有生成的图片都会自动保存到 Vercel Blob 存储
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">工作流管理</TabsTrigger>
          <TabsTrigger value="realtime">实时生成</TabsTrigger>
          <TabsTrigger value="gallery">历史记录</TabsTrigger>
          <TabsTrigger value="xy-batch" onClick={() => setShowXYBatch(true)}>XY轴批量</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workflows" className="space-y-6">
          <FeatureHighlight />
          <WorkflowList
            onCreateNew={handleNewWorkflow}
            onEdit={handleEditWorkflow}
            onGenerate={handleGenerate}
            onBatchGenerate={handleBatchGenerate}
            onXYBatch={() => setShowXYBatch(true)}
          />
        </TabsContent>
        
        <TabsContent value="realtime" className="space-y-6">
          <RealTimeGeneration 
            generationId={currentGenerationId || undefined}
            onComplete={(generation) => {
              showToast(`图像生成完成：${generation.workflow.name}`);
            }}
            autoRefresh={true}
          />
        </TabsContent>
        
        <TabsContent value="gallery" className="space-y-6">
          <GenerationGallery />
        </TabsContent>
      </Tabs>
    </div>
  );
}