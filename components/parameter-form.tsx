'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ParameterFormData {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  steps: number;
  cfg: number;
  seed?: number;
  provider: string;
  image_url?: string;
  mask_url?: string;
  size?: string;
}

interface ParameterFormProps {
  workflow: {
    id: string;
    name: string;
    comfyWorkflowId: string;
  };
  onSubmit: (data: ParameterFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ParameterForm({ workflow, onSubmit, onCancel, isLoading }: ParameterFormProps) {
  const [formData, setFormData] = useState<ParameterFormData>({
    prompt: '',
    negativePrompt: '',
    width: 1024,
    height: 1024,
    steps: 20,
    cfg: 2.5,
    seed: undefined,
    provider: 'wuwen',
    image_url: '',
    mask_url: '',
    size: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (field: keyof ParameterFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>设置生成参数</CardTitle>
        <CardDescription>
          为工作流 &ldquo;{workflow.name}&rdquo; 设置生成参数
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">API 提供商 *</label>
            <select
              value={formData.provider}
              onChange={(e) => handleChange('provider', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="wuwen">无问芯穹 (ComfyUI)</option>
              <option value="meitu">美图 AI 开放平台</option>
              <option value="qwen_image">通义千问图像生成</option>
              <option value="doubao_seedream">豆包 Seedream</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">正向提示词 *</label>
            <Textarea
              value={formData.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
              placeholder="描述你想要生成的图像..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">负向提示词</label>
            <Textarea
              value={formData.negativePrompt}
              onChange={(e) => handleChange('negativePrompt', e.target.value)}
              placeholder="描述你不想要的元素..."
              className="min-h-[80px]"
            />
          </div>

          {/* 美图 API 特有字段 */}
          {formData.provider === 'meitu' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">图片 URL *</label>
                <Input
                  value={formData.image_url || ''}
                  onChange={(e) => handleChange('image_url', e.target.value)}
                  placeholder="输入要处理的图片 URL"
                  required={formData.provider === 'meitu'}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">蒙版 URL *</label>
                <Input
                  value={formData.mask_url || ''}
                  onChange={(e) => handleChange('mask_url', e.target.value)}
                  placeholder="输入蒙版图片 URL"
                  required={formData.provider === 'meitu'}
                />
              </div>
            </>
          )}

          {/* 通义千问和豆包 API 的尺寸选择 */}
          {['qwen_image', 'doubao_seedream'].includes(formData.provider) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">图像尺寸</label>
              <select
                value={formData.size || ''}
                onChange={(e) => handleChange('size', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {formData.provider === 'qwen_image' ? (
                  <>
                    <option value="1328*1328">1328×1328 (1:1)</option>
                    <option value="1664*928">1664×928 (16:9)</option>
                    <option value="1472*1140">1472×1140 (4:3)</option>
                    <option value="1140*1472">1140×1472 (3:4)</option>
                    <option value="928*1664">928×1664 (9:16)</option>
                  </>
                ) : (
                  <>
                    <option value="1024x1024">1024×1024 (1:1)</option>
                    <option value="1024x1792">1024×1792 (9:16)</option>
                    <option value="1792x1024">1792×1024 (16:9)</option>
                    <option value="1664x2496">1664×2496 (2:3)</option>
                  </>
                )}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">宽度</label>
              <Input
                type="number"
                value={formData.width}
                onChange={(e) => handleChange('width', parseInt(e.target.value))}
                min="512"
                max="2048"
                step="64"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">高度</label>
              <Input
                type="number"
                value={formData.height}
                onChange={(e) => handleChange('height', parseInt(e.target.value))}
                min="512"
                max="2048"
                step="64"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">采样步数</label>
              <Input
                type="number"
                value={formData.steps}
                onChange={(e) => handleChange('steps', parseInt(e.target.value))}
                min="1"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CFG Scale</label>
              <Input
                type="number"
                value={formData.cfg}
                onChange={(e) => handleChange('cfg', parseFloat(e.target.value))}
                min="0.1"
                max="20"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">种子值（可选）</label>
              <Input
                type="number"
                value={formData.seed?.toString() || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || value === null || value === undefined) {
                    handleChange('seed', undefined);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && isFinite(numValue)) {
                      handleChange('seed', numValue);
                    }
                  }
                }}
                placeholder="随机"
              />
            </div>
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
