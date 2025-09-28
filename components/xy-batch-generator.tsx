'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid } from 'lucide-react';
import { 
  WorkflowSelector, 
  AxisConfig, 
  DefaultParamsConfig, 
  GenerationPreview, 
  GenerateButton, 
  useXYBatchLogic 
} from './xy-batch';

interface XYBatchConfig {
  workflowId: string;
  xAxisNode: string; // 节点ID
  xAxisInput: string; // 输入字段名
  xAxisValues: string[];
  yAxisNode: string; // 节点ID
  yAxisInput: string; // 输入字段名
  yAxisValues: string[];
  defaultParams: Record<string, Record<string, unknown>>; // 其他节点的默认值
}

interface XYBatchGeneratorProps {
  onGenerate: (config: XYBatchConfig) => void;
  isGenerating?: boolean;
}

export function XYBatchGenerator({ onGenerate, isGenerating }: XYBatchGeneratorProps) {
  const {
    // State
    workflows,
    selectedWorkflowId,
    selectedWorkflow,
      xAxisNode,
      xAxisInput,
    xAxisValues,
      yAxisNode,
      yAxisInput,
    yAxisValues,
    defaultParams,
    // imageCount, // 暂时未使用
    uploadingImages,
    uploadedImages,
    isNanoBananaWorkflow,
    
    // Methods
    getAvailableNodeInputs,
    updateXAxisValues,
    addXAxisValue,
    removeXAxisValue,
    updateYAxisValues,
    addYAxisValue,
    removeYAxisValue,
    updateDefaultParam,
    addImageInput,
    handleImageUpload,
    handleGenerate,
    getTotalCombinations,
    getNodeInputLabel,
    handleWorkflowChange,
    handleXAxisNodeInputChange,
    handleYAxisNodeInputChange,
  } = useXYBatchLogic();


  const availableInputs = getAvailableNodeInputs();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-blue-500" />
            批量生成配置
          </CardTitle>
          <CardDescription>
            基于工作流节点结构配置 X 轴和 Y 轴参数，系统将生成所有参数组合的图像网格
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 工作流选择 */}
          <WorkflowSelector
            workflows={workflows}
            selectedWorkflowId={selectedWorkflowId}
            onWorkflowChange={handleWorkflowChange}
          />

          {selectedWorkflow && (
            <>
              {/* 默认参数配置 */}
              <DefaultParamsConfig
                selectedWorkflow={selectedWorkflow}
                defaultParams={defaultParams}
                xAxisNode={xAxisNode}
                xAxisInput={xAxisInput}
                yAxisNode={yAxisNode}
                yAxisInput={yAxisInput}
                isNanoBananaWorkflow={isNanoBananaWorkflow}
                uploadingImages={uploadingImages}
                uploadedImages={uploadedImages}
                onParamChange={updateDefaultParam}
                onImageUpload={handleImageUpload}
                onAddImageInput={addImageInput}
                getNodeInputLabel={getNodeInputLabel}
              />

          {/* X轴配置 */}
              <AxisConfig
                axisType="x"
                nodeId={xAxisNode}
                inputKey={xAxisInput}
                values={xAxisValues}
                availableInputs={availableInputs}
                isNanoBananaWorkflow={isNanoBananaWorkflow}
                uploadingImages={uploadingImages}
                uploadedImages={uploadedImages}
                onNodeInputChange={handleXAxisNodeInputChange}
                onValueChange={updateXAxisValues}
                onAddValue={addXAxisValue}
                onRemoveValue={removeXAxisValue}
                onImageUpload={handleImageUpload}
                getNodeInputLabel={getNodeInputLabel}
              />

          {/* Y轴配置 */}
              <AxisConfig
                axisType="y"
                nodeId={yAxisNode}
                inputKey={yAxisInput}
                values={yAxisValues}
                availableInputs={availableInputs}
                isNanoBananaWorkflow={isNanoBananaWorkflow}
                uploadingImages={uploadingImages}
                uploadedImages={uploadedImages}
                onNodeInputChange={handleYAxisNodeInputChange}
                onValueChange={updateYAxisValues}
                onAddValue={addYAxisValue}
                onRemoveValue={removeYAxisValue}
                onImageUpload={handleImageUpload}
                getNodeInputLabel={getNodeInputLabel}
              />

              {/* 生成预览 */}
              <GenerationPreview
                xAxisValues={xAxisValues}
                yAxisValues={yAxisValues}
                getTotalCombinations={getTotalCombinations}
              />

          {/* 生成按钮 */}
              <GenerateButton
                isGenerating={isGenerating || false}
                isDisabled={!selectedWorkflowId || !xAxisNode || !xAxisInput || !yAxisNode || !yAxisInput}
                totalCombinations={getTotalCombinations()}
                onGenerate={() => handleGenerate(onGenerate)}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}