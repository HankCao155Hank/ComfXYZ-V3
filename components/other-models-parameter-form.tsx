'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
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
    topP: (workflow.nodeData.topP as number) || 0.95,
    image_urls: (workflow.nodeData.image_urls as string[]) || []
  });

  // 图片上传相关状态
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{filename: string, url: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload-images-batch', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        const newUploadedImages = result.uploaded_files.map((file: {filename: string, url: string}) => ({
          filename: file.filename,
          url: file.url
        }));
        
        setUploadedImages(prev => [...prev, ...newUploadedImages]);
        
        // 更新表单数据中的image_urls
        const allUrls = [...uploadedImages, ...newUploadedImages].map(img => img.url);
        handleChange('image_urls', allUrls);
        
        console.log('图片上传成功:', newUploadedImages);
      } else {
        console.error('图片上传失败:', result.error);
        alert(`图片上传失败: ${result.error}`);
      }
    } catch (error) {
      console.error('图片上传错误:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploadingImages(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除已上传的图片
  const removeUploadedImage = (index: number) => {
    const newUploadedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newUploadedImages);
    
    // 更新表单数据中的image_urls
    const allUrls = newUploadedImages.map(img => img.url);
    handleChange('image_urls', allUrls);
  };

  // 打开文件选择器
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证Nano Banana必须有图片
    if (formData.provider === 'nano_banana' && formData.image_urls.length === 0) {
      alert('请至少上传一张图片进行编辑');
      return;
    }
    
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
      submitData.image_urls = formData.image_urls;
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
              <div className="space-y-4">
                <label className="text-sm font-medium">上传图片文件</label>
                
                {/* 文件上传区域 */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  <div className="space-y-2">
                    <div className="text-gray-500">
                      {uploadingImages ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>正在上传图片...</span>
                        </div>
                      ) : (
                        <>
                          <p>点击选择图片或拖拽图片到此处</p>
                          <p className="text-xs">支持 JPG、PNG、GIF 格式，单个文件不超过10MB</p>
                        </>
                      )}
                    </div>
                    
                    <Button
                      type="button"
                      onClick={openFileSelector}
                      disabled={uploadingImages}
                      variant="outline"
                    >
                      选择图片文件
                    </Button>
                  </div>
                </div>

                {/* 已上传的图片列表 */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">已上传的图片 ({uploadedImages.length})</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <Image
                              src={image.url}
                              alt={image.filename}
                              width={32}
                              height={32}
                              className="w-8 h-8 object-cover rounded"
                              unoptimized
                            />
                            <span className="text-xs truncate" title={image.filename}>
                              {image.filename}
                            </span>
                          </div>
                          <Button
                            type="button"
                            onClick={() => removeUploadedImage(index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  至少需要上传一张图片进行编辑。支持批量上传，最多10张图片。
                </p>
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
