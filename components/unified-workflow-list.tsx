'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NodeParameterForm } from '@/components/node-parameter-form';
import { OtherModelsParameterForm } from '@/components/other-models-parameter-form';
import { Plus, Play, Settings, Trash2, PlayCircle, Grid, Search } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  curlRequest: string;
  workflowId: string;
  nodeData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  generations: Generation[];
}

interface Generation {
  id: string;
  status: string;
  blobUrl?: string;
  errorMsg?: string;
  startedAt: string;
  completedAt?: string;
}

interface UnifiedWorkflowListProps {
  onCreateNew: () => void;
  onEdit: (workflow: Workflow) => void;
  onGenerate: (workflowId: string, customParams?: Record<string, unknown>) => void;
  onBatchGenerate: (workflowIds: string[], batchParams?: Record<string, unknown>) => void;
  onXYBatch?: () => void;
}

export function UnifiedWorkflowList({ 
  onCreateNew, 
  onEdit, 
  onGenerate, 
  onBatchGenerate, 
  onXYBatch 
}: UnifiedWorkflowListProps) {
  const [allWorkflows, setAllWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [showParameterForm, setShowParameterForm] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'comfyui' | 'other-models'>('all');
  const [batchParams, setBatchParams] = useState({
    prompt: '',
    negativePrompt: '',
    width: 1328,
    height: 1328,
    steps: 20,
    cfg: 2.5,
    seed: undefined as number | undefined
  });

  const fetchWorkflows = useCallback(async () => {
    try {
      const response = await fetch('/api/workflows');
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
        setAllWorkflows(data.data);
      }
    } catch (error) {
      console.error('获取工作流失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWorkflow = async (id: string) => {
    if (!confirm('确定要删除这个工作流吗？')) return;
    
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchWorkflows();
      }
    } catch (error) {
      console.error('删除工作流失败:', error);
    }
  };

  const handleSelectWorkflow = (id: string) => {
    setSelectedWorkflows(prev => 
      prev.includes(id) 
        ? prev.filter((wid: string) => wid !== id)
        : [...prev, id]
    );
  };

  const handleBatchGenerate = () => {
    if (selectedWorkflows.length === 0) return;
    
    const params = Object.fromEntries(
      Object.entries(batchParams).filter(([, value]) => value !== '' && value !== undefined)
    );
    
    onBatchGenerate(selectedWorkflows, Object.keys(params).length > 0 ? params : undefined);
    setShowBatchForm(false);
    setSelectedWorkflows([]);
  };

  const handleShowParameterForm = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setShowParameterForm(true);
  };

  const handleParameterSubmit = async (data: Record<string, unknown>) => {
    if (selectedWorkflow) {
      await onGenerate(selectedWorkflow.id, data);
      setShowParameterForm(false);
      setSelectedWorkflow(null);
    }
  };

  const handleParameterCancel = () => {
    setShowParameterForm(false);
    setSelectedWorkflow(null);
  };

  const getWorkflowType = (workflow: Workflow): 'comfyui' | 'other-models' => {
    const nodeData = workflow.nodeData as Record<string, unknown>;
    return (!nodeData.provider || nodeData.provider === 'wuwen') ? 'comfyui' : 'other-models';
  };

  const getProviderLabel = (workflow: Workflow) => {
    const nodeData = workflow.nodeData as Record<string, unknown>;
    const provider = nodeData.provider as string;
    
    switch (provider) {
      case 'qwen_image': return '通义千问';
      case 'doubao_seedream': return '豆包 Seedream';
      case 'meitu': return '美图 AI';
      case 'nano_banana': return '谷歌 Nano Banana';
      case 'wuwen': return 'ComfyUI';
      default: return provider || 'ComfyUI';
    }
  };

  const getProviderColor = (workflow: Workflow) => {
    const nodeData = workflow.nodeData as Record<string, unknown>;
    const provider = nodeData.provider as string;
    
    switch (provider) {
      case 'qwen_image': return 'bg-blue-100 text-blue-800';
      case 'doubao_seedream': return 'bg-purple-100 text-purple-800';
      case 'meitu': return 'bg-pink-100 text-pink-800';
      case 'nano_banana': return 'bg-green-100 text-green-800';
      case 'wuwen': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">已完成</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-500">运行中</Badge>;
      case 'pending':
        return <Badge variant="secondary">等待中</Badge>;
      case 'failed':
        return <Badge variant="destructive">失败</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 过滤工作流
  const filteredWorkflows = allWorkflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const workflowType = getWorkflowType(workflow);
    const matchesFilter = activeFilter === 'all' || activeFilter === workflowType;
    
    return matchesSearch && matchesFilter;
  });

  // 按类型分组
  const comfyuiWorkflows = filteredWorkflows.filter(w => getWorkflowType(w) === 'comfyui');
  const otherModelsWorkflows = filteredWorkflows.filter(w => getWorkflowType(w) === 'other-models');

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  const renderWorkflowCard = (workflow: Workflow) => {
    const provider = getProviderLabel(workflow);
    
    return (
      <Card key={workflow.id} className="relative">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedWorkflows.includes(workflow.id)}
                  onChange={() => handleSelectWorkflow(workflow.id)}
                  className="rounded"
                />
                <CardTitle className="text-lg">{workflow.name}</CardTitle>
                <Badge className={`text-xs ${getProviderColor(workflow)}`}>
                  {provider}
                </Badge>
              </div>
              {workflow.description && (
                <CardDescription className="mt-1">
                  {workflow.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">工作流ID:</p>
              <p className="text-sm font-mono">{workflow.workflowId}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>节点数量: {Object.keys(workflow.nodeData || {}).length}</span>
              {workflow.nodeData && Object.values(workflow.nodeData).some((node: unknown) => {
                const nodeObj = node as { inputs?: Record<string, unknown> };
                return nodeObj.inputs && Object.keys(nodeObj.inputs).includes('image');
              }) && (
                <span className="text-blue-600">包含图片输入节点</span>
              )}
            </div>

            {workflow.generations.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">最近生成:</p>
                <div className="space-y-1">
                  {workflow.generations.slice(0, 3).map((gen) => (
                    <div key={gen.id} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(gen.startedAt).toLocaleString()}
                      </span>
                      {getStatusBadge(gen.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => handleShowParameterForm(workflow)}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-1" />
                执行
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(workflow)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteWorkflow(workflow.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* 标题和操作栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">模型管理</h2>
        </div>
        <div className="flex gap-2">
          {selectedWorkflows.length > 0 && (
            <Button onClick={() => setShowBatchForm(true)} variant="outline">
              <PlayCircle className="w-4 h-4 mr-2" />
              批量执行 ({selectedWorkflows.length})
            </Button>
          )}
          {onXYBatch && (
            <Button onClick={onXYBatch} variant="outline">
              <Grid className="w-4 h-4 mr-2" />
              XY轴批量
            </Button>
          )}
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            新建工作流
          </Button>
        </div>
      </div>


      {/* 搜索和过滤 */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜索工作流名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
          >
            全部 ({allWorkflows.length})
          </Button>
          <Button
            variant={activeFilter === 'comfyui' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('comfyui')}
          >
            ComfyUI ({comfyuiWorkflows.length})
          </Button>
          <Button
            variant={activeFilter === 'other-models' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('other-models')}
          >
            重要模型 ({otherModelsWorkflows.length})
          </Button>
        </div>
      </div>

      {/* 批量执行表单 */}
      {showBatchForm && (
        <Card>
          <CardHeader>
            <CardTitle>批量执行配置</CardTitle>
            <CardDescription>
              为选中的 {selectedWorkflows.length} 个工作流配置统一参数（留空使用各自默认值）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">统一提示词（可选）</label>
              <Textarea
                value={batchParams.prompt}
                onChange={(e) => setBatchParams(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="留空使用各工作流的默认提示词"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">宽度</label>
                <Input
                  type="number"
                  value={batchParams.width}
                  onChange={(e) => setBatchParams(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">高度</label>
                <Input
                  type="number"
                  value={batchParams.height}
                  onChange={(e) => setBatchParams(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleBatchGenerate}>
                开始批量生成
              </Button>
              <Button variant="outline" onClick={() => setShowBatchForm(false)}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 快速操作面板 */}
      {allWorkflows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">全部模型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setActiveFilter('comfyui')}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Settings className="h-6 w-6" />
                <span className="text-sm">ComfyUI 工作流</span>
                <span className="text-xs text-muted-foreground">{comfyuiWorkflows.length} 个</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveFilter('other-models')}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Play className="h-6 w-6" />
                <span className="text-sm">重要模型</span>
                <span className="text-xs text-muted-foreground">{otherModelsWorkflows.length} 个</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 工作流列表 */}
      {filteredWorkflows.length === 0 ? (
        <div className="text-center py-12">
          {searchTerm ? (
            <div className="space-y-4">
              <div className="text-6xl">🔍</div>
              <h3 className="text-xl font-semibold">没有找到匹配的工作流</h3>
              <p className="text-muted-foreground">尝试使用不同的搜索词或清除过滤器</p>
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                清除搜索
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">🚀</div>
              <h3 className="text-xl font-semibold">开始创建您的工作流</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                创建 ComfyUI 工作流或其他 AI 模型工作流，开始您的 AI 图像生成之旅
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={onCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  创建 ComfyUI 工作流
                </Button>
                <Button variant="outline" onClick={onCreateNew}>
                  <Play className="w-4 h-4 mr-2" />
                  配置重要模型
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkflows.map(renderWorkflowCard)}
        </div>
      )}

      {/* 参数设置模态框 */}
      {showParameterForm && selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {getWorkflowType(selectedWorkflow) === 'other-models' ? (
              <OtherModelsParameterForm
                workflow={selectedWorkflow}
                onSubmit={handleParameterSubmit}
                onCancel={handleParameterCancel}
                isLoading={false}
              />
            ) : (
              <NodeParameterForm
                workflow={selectedWorkflow}
                onSubmit={handleParameterSubmit}
                onCancel={handleParameterCancel}
                isLoading={false}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
