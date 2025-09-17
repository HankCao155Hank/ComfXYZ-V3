'use client';

import { useState, useEffect } from 'react';
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
    seed: undefined
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (field: keyof ParameterFormData, value: any) => {
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
          为工作流 "{workflow.name}" 设置生成参数
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
