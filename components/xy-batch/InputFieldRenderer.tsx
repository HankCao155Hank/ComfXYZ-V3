'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface InputFieldRendererProps {
  nodeId: string;
  inputKey: string;
  value: unknown;
  type: string;
  uploadType: 'default' | 'xAxis' | 'yAxis';
  index?: number;
  isNanoBananaWorkflow: boolean;
  uploadingImages: Record<string, boolean>;
  uploadedImages: Record<string, string>;
  onChange: (value: unknown) => void;
  onImageUpload: (nodeId: string, inputKey: string, file: File, type: 'default' | 'xAxis' | 'yAxis', index?: number) => void;
}

export function InputFieldRenderer({
  nodeId,
  inputKey,
  value,
  type,
  uploadType,
  index,
  isNanoBananaWorkflow,
  uploadingImages,
  uploadedImages,
  onChange,
  onImageUpload
}: InputFieldRendererProps) {
  const isImageInput = inputKey === 'image' || (isNanoBananaWorkflow && inputKey.startsWith('image'));

  if (isImageInput) {
    const uploadKey = `${uploadType}-${nodeId}-${inputKey}${index !== undefined ? `-${index}` : ''}`;
    const isUploading = uploadingImages[uploadKey];
    const uploadedImage = uploadedImages[uploadKey];

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
            placeholder="图片路径或上传图片"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImageUpload(nodeId, inputKey, file, uploadType, index);
              }
            }}
            className="hidden"
            id={`upload-${uploadKey}`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`upload-${uploadKey}`)?.click()}
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

  if (type === 'string') {
    return (
      <Textarea
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`输入 ${inputKey}`}
        className="min-h-[60px] text-xs"
      />
    );
  }

  if (type === 'number') {
    return (
      <Input
        type="number"
        value={String(value || '')}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder={`输入 ${inputKey}`}
        step="any"
      />
    );
  }

  if (type === 'boolean') {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label className="text-sm">启用</label>
      </div>
    );
  }

  // JSON 格式
  return (
    <Textarea
      value={JSON.stringify(value) || ''}
      onChange={(e) => {
        try {
          onChange(JSON.parse(e.target.value));
        } catch (error) {
          console.error("Invalid JSON:", error);
        }
      }}
      placeholder={`输入 ${inputKey} (JSON格式)`}
      className="min-h-[60px] text-xs"
    />
  );
}
