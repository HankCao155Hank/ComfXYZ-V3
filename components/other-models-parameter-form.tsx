'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OtherModelsParameterFormProps {
  workflow: {
    id: string;
    name: string;
    nodeData: Record<string, unknown>;
  };
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function OtherModelsParameterForm({ workflow, onSubmit, onCancel, isLoading }: OtherModelsParameterFormProps) {
  const [formData, setFormData] = useState({
    prompt: (workflow.nodeData.prompt as string) || '',
    negative_prompt: (workflow.nodeData.negative_prompt as string) || '',
    size: (workflow.nodeData.size as string) || '',
    seed: (workflow.nodeData.seed as number) || undefined,
    image_url: (workflow.nodeData.image_url as string) || '',
    mask_url: (workflow.nodeData.mask_url as string) || '',
    provider: (workflow.nodeData.provider as string) || '',
    temperature: (workflow.nodeData.temperature as number) || 0.9,
    topK: (workflow.nodeData.topK as number) || 40,
    topP: (workflow.nodeData.topP as number) || 0.95
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 根据不同的provider构建不同的参数
    const submitData: Record<string, unknown> = {
      provider: formData.provider,
      prompt: formData.prompt
    };

    // 添加通用参数
    if (formData.negative_prompt) {
      submitData.negative_prompt = formData.negative_prompt;
    }
    if (formData.seed) {
      submitData.seed = formData.seed;
    }

    // 根据provider添加特定参数
    if (formData.provider === 'meitu') {
      submitData.image_url = formData.image_url;
      submitData.mask_url = formData.mask_url;
    } else if (['qwen_image', 'doubao_seedream'].includes(formData.provider)) {
      submitData.size = formData.size;
    } else if (formData.provider === 'nano_banana') {
      submitData.temperature = formData.temperature;
      submitData.topK = formData.topK;
      submitData.topP = formData.topP;
    }

    await onSubmit(submitData);
  };

  const getSizeOptions = () => {
    if (formData.provider === 'qwen_image') {
      return [
        { value: '1328*1328', label: '1328×1328 (1:1)' },
        { value: '1664*928', label: '1664×928 (16:9)' },
        { value: '1472*1140', label: '1472×1140 (4:3)' },
        { value: '1140*1472', label: '1140×1472 (3:4)' },
        { value: '928*1664', label: '928×1664 (9:16)' }
      ];
    } else if (formData.provider === 'doubao_seedream') {
      return [
        { value: '1024x1024', label: '1024×1024 (1:1)' },
        { value: '1024x1792', label: '1024×1792 (9:16)' },
        { value: '1792x1024', label: '1792×1024 (16:9)' },
        { value: '1664x2496', label: '1664×2496 (2:3)' }
      ];
    } else if (formData.provider === 'nano_banana') {
      return [
        { value: 'auto', label: '自动选择 (智能)' }
      ];
    }
    return [];
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'qwen_image': return '通义千问图像生成';
      case 'doubao_seedream': return '豆包 Seedream';
      case 'meitu': return '美图 AI';
      case 'nano_banana': return '谷歌 Nano Banana';
      default: return provider;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>生成参数设置</CardTitle>
        <CardDescription>
          {getProviderLabel(formData.provider)} - {workflow.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 提示词 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">提示词 *</label>
            <Textarea
              value={formData.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
              placeholder="描述您想要生成的图像..."
              required
              rows={3}
            />
          </div>

          {/* 负向提示词 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">负向提示词</label>
            <Textarea
              value={formData.negative_prompt}
              onChange={(e) => handleChange('negative_prompt', e.target.value)}
              placeholder="描述您不想要的元素..."
              rows={2}
            />
          </div>

          {/* 美图 AI 特定参数 */}
          {formData.provider === 'meitu' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">图片 URL *</label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => handleChange('image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">蒙版 URL *</label>
                <Input
                  value={formData.mask_url}
                  onChange={(e) => handleChange('mask_url', e.target.value)}
                  placeholder="https://example.com/mask.jpg"
                  required
                />
              </div>
            </>
          )}

          {/* 图像尺寸选择 */}
          {['qwen_image', 'doubao_seedream', 'nano_banana'].includes(formData.provider) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">图像尺寸</label>
              <select
                value={formData.size}
                onChange={(e) => handleChange('size', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择图像尺寸</option>
                {getSizeOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nano Banana 特殊参数 */}
          {formData.provider === 'nano_banana' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature (0-2)</label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value) || 0.9)}
                  placeholder="0.9"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Top K (1-40)</label>
                <Input
                  type="number"
                  min="1"
                  max="40"
                  value={formData.topK}
                  onChange={(e) => handleChange('topK', parseInt(e.target.value) || 40)}
                  placeholder="40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Top P (0-1)</label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={formData.topP}
                  onChange={(e) => handleChange('topP', parseFloat(e.target.value) || 0.95)}
                  placeholder="0.95"
                />
              </div>
            </>
          )}

          {/* 随机种子 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">随机种子</label>
            <Input
              type="number"
              value={formData.seed || ''}
              onChange={(e) => handleChange('seed', e.target.value ? parseInt(e.target.value, 10) : 0)}
              placeholder="留空则随机生成"
            />
          </div>

          {/* 按钮 */}
          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '生成中...' : '开始生成'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
