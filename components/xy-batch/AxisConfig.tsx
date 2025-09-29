'use client';

// import { useState } from 'react'; // 暂时未使用
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Upload, Image as ImageIcon } from 'lucide-react';

interface AxisConfigProps {
  axisType: 'x' | 'y';
  nodeId: string;
  inputKey: string;
  values: string[];
  availableInputs: Array<{
    nodeId: string;
    inputKey: string;
    type: string;
    value: unknown;
  }>;
  isNanoBananaWorkflow: boolean;
  uploadingImages: Record<string, boolean>;
  uploadedImages: Record<string, string>;
  onNodeInputChange: (nodeId: string, inputKey: string) => void;
  onValueChange: (index: number, value: string) => void;
  onAddValue: () => void;
  onRemoveValue: (index: number) => void;
  onImageUpload: (nodeId: string, inputKey: string, file: File, type: 'xAxis' | 'yAxis', index: number) => void;
  getNodeInputLabel: (nodeId: string, inputKey: string) => string;
}

export function AxisConfig({
  axisType,
  nodeId,
  inputKey,
  values,
  availableInputs,
  isNanoBananaWorkflow,
  uploadingImages,
  uploadedImages,
  onNodeInputChange,
  onValueChange,
  onAddValue,
  onRemoveValue,
  onImageUpload,
  getNodeInputLabel
}: AxisConfigProps) {
  const axisLabel = axisType === 'x' ? '第一输入' : '第二输入';
  const isImageInput = inputKey === 'image' || (isNanoBananaWorkflow && inputKey.startsWith('image'));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{axisLabel}</h3>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">输入参数</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={`${nodeId}-${inputKey}`}
            onChange={(e) => {
              const [newNodeId, newInputKey] = e.target.value.split('-');
              onNodeInputChange(newNodeId, newInputKey);
            }}
          >
            <option value="">选择{axisLabel}参数</option>
            {availableInputs.map((input) => (
              <option key={`${input.nodeId}-${input.inputKey}`} value={`${input.nodeId}-${input.inputKey}`}>
                {getNodeInputLabel(input.nodeId, input.inputKey)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">参数值</label>
          <div className="space-y-2">
            {values.map((value, index) => (
              <div key={index} className="space-y-2">
                {isImageInput ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={value}
                      onChange={(e) => onValueChange(index, e.target.value)}
                      placeholder={`${axisLabel}值 ${index + 1}`}
                      className="flex-1 h-10"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onImageUpload(nodeId, inputKey, file, `${axisType}Axis` as 'xAxis' | 'yAxis', index);
                        }
                      }}
                      className="hidden"
                      id={`upload-${axisType}Axis-${nodeId}-${inputKey}-${index}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`upload-${axisType}Axis-${nodeId}-${inputKey}-${index}`)?.click()}
                      disabled={uploadingImages[`${axisType}Axis-${nodeId}-${inputKey}-${index}`]}
                    >
                      {uploadingImages[`${axisType}Axis-${nodeId}-${inputKey}-${index}`] ? (
                        <Upload className="w-4 h-4 animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRemoveValue(index)}
                      disabled={values.length <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={value}
                      onChange={(e) => onValueChange(index, e.target.value)}
                      placeholder={`${axisLabel}值 ${index + 1}`}
                      className="flex-1 h-10"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRemoveValue(index)}
                      disabled={values.length <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {isImageInput && uploadedImages[`${axisType}Axis-${nodeId}-${inputKey}-${index}`] && (
                  <div className="text-xs text-green-600">
                    已上传: {uploadedImages[`${axisType}Axis-${nodeId}-${inputKey}-${index}`]}
                  </div>
                )}
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={onAddValue} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              添加参数值
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
