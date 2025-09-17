'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface NodeParameterFormProps {
  workflow: {
    id: string;
    name: string;
    workflowId: string;
    nodeData: Record<string, any>;
  };
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function NodeParameterForm({ workflow, onSubmit, onCancel, isLoading }: NodeParameterFormProps) {
  const [nodeParameters, setNodeParameters] = useState<Record<string, Record<string, any>>>({});
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});

  useEffect(() => {
    // 初始化节点参数
    const initialParams: Record<string, Record<string, any>> = {};
    Object.entries(workflow.nodeData).forEach(([nodeId, nodeData]: [string, any]) => {
      if (nodeData?.inputs) {
        initialParams[nodeId] = { ...nodeData.inputs };
      }
    });
    setNodeParameters(initialParams);
  }, [workflow.nodeData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 构建最终的prompt数据
    const promptData: Record<string, any> = {};
    Object.entries(workflow.nodeData).forEach(([nodeId, nodeData]: [string, any]) => {
      promptData[nodeId] = {
        ...nodeData,
        inputs: nodeParameters[nodeId] || nodeData.inputs
      };
    });
    
    await onSubmit(promptData);
  };

  const handleNodeParameterChange = (nodeId: string, inputKey: string, value: any) => {
    setNodeParameters(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [inputKey]: value
      }
    }));
  };

  // 上传图片到OSS
  const uploadImageToOSS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('图片上传失败');
    }

    const result = await response.json();
    return result.key;
  };

  // 处理图片上传
  const handleImageUpload = async (nodeId: string, inputKey: string, file: File) => {
    const uploadKey = `${nodeId}-${inputKey}`;
    
    setUploadingImages(prev => ({ ...prev, [uploadKey]: true }));
    
    try {
      const imageKey = await uploadImageToOSS(file);
      setUploadedImages(prev => ({ ...prev, [uploadKey]: imageKey }));
      
      // 自动更新节点参数
      handleNodeParameterChange(nodeId, inputKey, imageKey);
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploadingImages(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const renderInput = (nodeId: string, inputKey: string, value: any, type: string = 'text', nodeData: any) => {
    const handleChange = (newValue: any) => {
      handleNodeParameterChange(nodeId, inputKey, newValue);
    };

    // 检查是否是图片输入字段（任何节点的image字段）
    const isImageInput = inputKey === 'image';

    if (isImageInput) {
      const uploadKey = `${nodeId}-${inputKey}`;
      const isUploading = uploadingImages[uploadKey];
      const uploadedImage = uploadedImages[uploadKey];

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full"
              placeholder="图片路径或上传图片"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(nodeId, inputKey, file);
                }
              }}
              className="hidden"
              id={`upload-${nodeId}-${inputKey}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`upload-${nodeId}-${inputKey}`)?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Upload className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
          {uploadedImage && (
            <div className="text-xs text-green-600">
              已上传: {uploadedImage}
            </div>
          )}
        </div>
      );
    }

    switch (type) {
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            className="w-full"
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full min-h-[80px]"
          />
        );
      case 'boolean':
        return (
          <select
            value={value ? 'true' : 'false'}
            onChange={(e) => handleChange(e.target.value === 'true')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full"
          />
        );
    }
  };

  const getInputType = (key: string, value: any): string => {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (key.toLowerCase().includes('text') || key.toLowerCase().includes('prompt')) return 'textarea';
    if (typeof value === 'string' && value.length > 50) return 'textarea';
    return 'text';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>设置节点参数</CardTitle>
        <CardDescription>
          为工作流 "{workflow.name}" 设置各个节点的参数值
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {Object.entries(workflow.nodeData).map(([nodeId, nodeData]: [string, any]) => (
              <Card key={nodeId} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">节点 {nodeId}</CardTitle>
                  {nodeData.class_type && (
                    <CardDescription>类型: {nodeData.class_type}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {nodeData.inputs && Object.keys(nodeData.inputs).length > 0 ? (
                    <div className="grid gap-4">
                      {Object.entries(nodeData.inputs).map(([inputKey, inputValue]: [string, any]) => (
                        <div key={inputKey} className="space-y-2">
                          <label className="text-sm font-medium">
                            {inputKey}
                            <span className="text-xs text-muted-foreground ml-2">
                              ({typeof inputValue})
                            </span>
                            {inputKey === 'image' && (
                              <span className="text-xs text-blue-600 ml-2">[图片上传]</span>
                            )}
                          </label>
                          {renderInput(nodeId, inputKey, nodeParameters[nodeId]?.[inputKey] ?? inputValue, getInputType(inputKey, inputValue), nodeData)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">此节点没有可配置的输入参数</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? '生成中...' : '开始生成'}
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
