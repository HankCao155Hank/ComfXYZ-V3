'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkflowFormData {
  name: string;
  description: string;
  curlRequest: string;
}

// interface WorkflowType {
//   key: string;
//   id: string;
//   name: string;
//   description: string;
// }

interface WorkflowFormProps {
  initialData?: Partial<WorkflowFormData>;
  onSubmit: (data: WorkflowFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function WorkflowForm({ initialData, onSubmit, onCancel, isLoading }: WorkflowFormProps) {
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    curlRequest: initialData?.curlRequest || ''
  });

  const [parseError, setParseError] = useState<string>('');
  const [parsedInfo, setParsedInfo] = useState<{
    workflowId: string;
    nodeCount: number;
    nodes: string[];
  } | null>(null);

  // 解析curl请求
  const parseCurlRequest = (curlText: string) => {
    try {
      setParseError('');
      
      // 提取JSON数据部分
      const jsonMatch = curlText.match(/--data\s*'([\s\S]*?)'/);
      if (!jsonMatch) {
        throw new Error('无法找到JSON数据');
      }

      const jsonStr = jsonMatch[1];
      const requestData = JSON.parse(jsonStr);
      
      if (!requestData.workflow_id || !requestData.prompt) {
        throw new Error('curl请求中缺少workflow_id或prompt数据');
      }

      const workflowId = requestData.workflow_id;
      const promptData = requestData.prompt;
      const nodeIds = Object.keys(promptData);
      
      setParsedInfo({
        workflowId,
        nodeCount: nodeIds.length,
        nodes: nodeIds
      });

      return {
        workflowId,
        promptData
      };
    } catch (error) {
      setParseError('解析curl请求失败: ' + (error as Error).message);
      setParsedInfo(null);
      return null;
    }
  };

  const handleCurlChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      curlRequest: value
    }));
    
    if (value.trim()) {
      parseCurlRequest(value);
    } else {
      setParseError('');
      setParsedInfo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证curl请求
    if (!formData.curlRequest.trim()) {
      setParseError('请提供curl请求');
      return;
    }
    
    const parsed = parseCurlRequest(formData.curlRequest);
    if (!parsed) {
      return;
    }
    
    await onSubmit(formData);
  };

  const handleChange = (field: keyof WorkflowFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? '编辑工作流' : '创建新工作流'}</CardTitle>
        <CardDescription>
          提供curl请求来创建工作流，系统将解析并保存节点信息
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">工作流名称 *</label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="输入工作流名称"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">描述</label>
            <Input
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="简要描述这个工作流的用途"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Curl请求 *</label>
            <Textarea
              value={formData.curlRequest}
              onChange={(e) => handleCurlChange(e.target.value)}
              placeholder="粘贴完整的curl请求，系统会自动解析workflow_id和节点信息..."
              className="min-h-[200px] font-mono text-xs"
              required
            />
            {parseError && (
              <div className="text-sm text-red-500">
                {parseError}
              </div>
            )}
            {parsedInfo && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-800">
                  <div className="font-medium">解析成功！</div>
                  <div>工作流ID: <span className="font-mono">{parsedInfo.workflowId}</span></div>
                  <div>节点数量: {parsedInfo.nodeCount}</div>
                  <div>节点ID: {parsedInfo.nodes.join(', ')}</div>
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              从ComfyStack平台复制完整的curl请求，系统会自动解析workflow_id和所有节点信息
            </div>
          </div>



          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? '保存中...' : '保存工作流'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
