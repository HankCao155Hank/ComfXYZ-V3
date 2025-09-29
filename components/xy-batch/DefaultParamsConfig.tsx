'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { InputFieldRenderer } from './InputFieldRenderer';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  workflowId: string;
  nodeData: Record<string, unknown>;
}

interface DefaultParamsConfigProps {
  selectedWorkflow: Workflow | null;
  defaultParams: Record<string, Record<string, unknown>>;
  xAxisNode: string;
  xAxisInput: string;
  yAxisNode: string;
  yAxisInput: string;
  isNanoBananaWorkflow: boolean;
  uploadingImages: Record<string, boolean>;
  uploadedImages: Record<string, string>;
  onParamChange: (nodeId: string, inputKey: string, value: unknown) => void;
  onImageUpload: (nodeId: string, inputKey: string, file: File, type: 'default' | 'xAxis' | 'yAxis', index?: number) => void;
  onAddImageInput: () => void;
  getNodeInputLabel: (nodeId: string, inputKey: string) => string;
}

export function DefaultParamsConfig({
  selectedWorkflow,
  defaultParams,
  xAxisNode,
  xAxisInput,
  yAxisNode,
  yAxisInput,
  isNanoBananaWorkflow,
  uploadingImages,
  uploadedImages,
  onParamChange,
  onImageUpload,
  onAddImageInput,
  getNodeInputLabel
}: DefaultParamsConfigProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">默认参数配置</h3>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground mb-4">
          配置其他节点的默认参数值，这些参数将在所有生成中保持不变。
          <br />
          <span className="text-blue-600">注意：</span>被选为X轴或Y轴的特定字段不会显示在这里，但同一节点的其他字段仍可配置。
        </p>
        
        {/* Nano Banana 简化提示 */}
        {isNanoBananaWorkflow && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded mb-3">
            <p className="text-xs text-blue-700">
              💡 请至少提供一张输入图像，建议使用详细的提示词描述
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          {Object.entries(defaultParams).map(([nodeId, inputs]) => {
            // 过滤掉被选为X轴或Y轴的特定字段
            const filteredInputs = Object.entries(inputs).filter(([inputKey]) => {
              // 如果是X轴节点且字段是X轴输入，则跳过
              if (xAxisNode === nodeId && xAxisInput === inputKey) {
                return false;
              }
              // 如果是Y轴节点且字段是Y轴输入，则跳过
              if (yAxisNode === nodeId && yAxisInput === inputKey) {
                return false;
              }
              return true;
            });
            
            // 如果该节点没有其他字段需要设置，则不显示
            if (filteredInputs.length === 0) {
              return null;
            }
            
            return (
              <div key={nodeId} className={isNanoBananaWorkflow ? "space-y-3" : "border p-4 rounded-md space-y-3"}>
                {!isNanoBananaWorkflow && (
                  <h4 className="text-md font-semibold">
                    节点 {nodeId} ({(selectedWorkflow?.nodeData[nodeId] as { class_type?: string })?.class_type || '未知类型'})
                    {(xAxisNode === nodeId || yAxisNode === nodeId) && (
                      <span className="text-xs text-blue-600 ml-2">
                        {xAxisNode === nodeId && `[X轴: ${xAxisInput}]`}
                        {yAxisNode === nodeId && `[Y轴: ${yAxisInput}]`}
                      </span>
                    )}
                  </h4>
                )}
                {filteredInputs.map(([inputKey, value]) => (
                  <div key={`${nodeId}-${inputKey}`} className={isNanoBananaWorkflow ? "space-y-1" : "space-y-1"}>
                    <label className={`${isNanoBananaWorkflow ? 'text-xs' : 'text-sm'} font-medium`}>
                      {getNodeInputLabel(nodeId, inputKey)}
                    </label>
                    <InputFieldRenderer
                      nodeId={nodeId}
                      inputKey={inputKey}
                      value={value}
                      type={typeof value}
                      uploadType="default"
                      isNanoBananaWorkflow={isNanoBananaWorkflow}
                      uploadingImages={uploadingImages}
                      uploadedImages={uploadedImages}
                      onChange={(newValue) => onParamChange(nodeId, inputKey, newValue)}
                      onImageUpload={onImageUpload}
                    />
                    
                    {/* 在prompt后面添加增加更多照片的按钮 */}
                    {isNanoBananaWorkflow && inputKey === 'prompt' && (
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onAddImageInput}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          增加更多照片
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
