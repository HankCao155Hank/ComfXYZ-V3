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
        
        {/* Nano Banana 特殊提示 */}
        {isNanoBananaWorkflow && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Nano Banana 工作流要求</h4>
                <p className="text-sm text-blue-700 mt-1">
                  ⚠️ 请至少提供一张输入图像（image1、image2 或 image3 中至少一个），否则批量生成将无法进行。
                </p>
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800 font-medium">提示词建议：</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    请使用详细、具体的描述，例如："一张可爱风格的贴纸，描绘了一只开心的小熊猫戴着迷你竹叶帽，正在咀嚼一片绿色竹叶。设计采用粗壮、干净的描边，简单的赛璐璐上色，配色鲜艳。背景必须为白色。"
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    避免使用过于简单的词汇，如"变得更牛逼"等。
                  </p>
                </div>
              </div>
            </div>
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
              <div key={nodeId} className="border p-4 rounded-md space-y-3">
                <h4 className="text-md font-semibold">
                  节点 {nodeId} ({(selectedWorkflow?.nodeData[nodeId] as { class_type?: string })?.class_type || '未知类型'})
                  {(xAxisNode === nodeId || yAxisNode === nodeId) && (
                    <span className="text-xs text-blue-600 ml-2">
                      {xAxisNode === nodeId && `[X轴: ${xAxisInput}]`}
                      {yAxisNode === nodeId && `[Y轴: ${yAxisInput}]`}
                    </span>
                  )}
                </h4>
                {filteredInputs.map(([inputKey, value]) => (
                  <div key={`${nodeId}-${inputKey}`} className="space-y-1">
                    <label className="text-sm font-medium">
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
                    
                    {/* 在image1后面添加增加更多照片的按钮 */}
                    {isNanoBananaWorkflow && inputKey === 'image1' && (
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
