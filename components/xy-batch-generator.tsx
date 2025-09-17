'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Grid, Play, Settings, Upload, Image as ImageIcon } from 'lucide-react';

interface NodeInput {
  nodeId: string;
  inputKey: string;
  type: string;
  value: any;
}

interface XYBatchConfig {
  workflowId: string;
  xAxisNode: string; // 节点ID
  xAxisInput: string; // 输入字段名
  xAxisValues: string[];
  yAxisNode: string; // 节点ID
  yAxisInput: string; // 输入字段名
  yAxisValues: string[];
  defaultParams: Record<string, Record<string, any>>; // 其他节点的默认值
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  workflowId: string;
  nodeData: Record<string, any>;
}

interface XYBatchGeneratorProps {
  onGenerate: (config: XYBatchConfig) => void;
  isGenerating?: boolean;
}

export function XYBatchGenerator({ onGenerate, isGenerating }: XYBatchGeneratorProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  
  // X轴配置
  const [xAxisNode, setXAxisNode] = useState<string>('');
  const [xAxisInput, setXAxisInput] = useState<string>('');
  const [xAxisValues, setXAxisValues] = useState<string[]>(['']);
  
  // Y轴配置
  const [yAxisNode, setYAxisNode] = useState<string>('');
  const [yAxisInput, setYAxisInput] = useState<string>('');
  const [yAxisValues, setYAxisValues] = useState<string[]>(['']);
  
  // 默认参数
  const [defaultParams, setDefaultParams] = useState<Record<string, Record<string, any>>>({});
  
  // 图片上传状态
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      const data = await response.json();
      if (data.success) {
        setWorkflows(data.data);
        if (data.data.length > 0 && !selectedWorkflowId) {
          setSelectedWorkflowId(data.data[0].id);
          setSelectedWorkflow(data.data[0]);
          initializeDefaultParams(data.data[0]);
        }
      }
    } catch (error) {
      console.error('获取工作流失败:', error);
    }
  };

  // 初始化默认参数
  const initializeDefaultParams = (workflow: Workflow) => {
    const params: Record<string, Record<string, any>> = {};
    if (workflow.nodeData) {
      Object.entries(workflow.nodeData).forEach(([nodeId, nodeData]: [string, any]) => {
        if (nodeData?.inputs) {
          params[nodeId] = { ...nodeData.inputs };
        }
      });
    }
    setDefaultParams(params);
  };

  // 获取可用的节点输入选项
  const getAvailableNodeInputs = () => {
    if (!selectedWorkflow?.nodeData) return [];
    
    const inputs: Array<{nodeId: string, inputKey: string, type: string, value: any}> = [];
    Object.entries(selectedWorkflow.nodeData).forEach(([nodeId, nodeData]: [string, any]) => {
      if (nodeData?.inputs && Object.keys(nodeData.inputs).length > 0) {
        Object.entries(nodeData.inputs).forEach(([inputKey, value]: [string, any]) => {
          inputs.push({
            nodeId,
            inputKey,
            type: typeof value,
            value
          });
        });
      }
    });
    return inputs;
  };

  // 更新X轴值
  const updateXAxisValues = (index: number, value: string) => {
    const newValues = [...xAxisValues];
    newValues[index] = value;
    setXAxisValues(newValues);
  };

  // 添加X轴值
  const addXAxisValue = () => {
    setXAxisValues([...xAxisValues, '']);
  };

  // 删除X轴值
  const removeXAxisValue = (index: number) => {
    if (xAxisValues.length > 1) {
      const newValues = xAxisValues.filter((_, i) => i !== index);
      setXAxisValues(newValues);
    }
  };

  // 更新Y轴值
  const updateYAxisValues = (index: number, value: string) => {
    const newValues = [...yAxisValues];
    newValues[index] = value;
    setYAxisValues(newValues);
  };

  // 添加Y轴值
  const addYAxisValue = () => {
    setYAxisValues([...yAxisValues, '']);
  };

  // 删除Y轴值
  const removeYAxisValue = (index: number) => {
    if (yAxisValues.length > 1) {
      const newValues = yAxisValues.filter((_, i) => i !== index);
      setYAxisValues(newValues);
    }
  };

  // 更新默认参数
  const updateDefaultParam = (nodeId: string, inputKey: string, value: any) => {
    setDefaultParams(prev => ({
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
  const handleImageUpload = async (nodeId: string, inputKey: string, file: File, type: 'default' | 'xAxis' | 'yAxis', index?: number) => {
    const uploadKey = `${type}-${nodeId}-${inputKey}${index !== undefined ? `-${index}` : ''}`;
    
    setUploadingImages(prev => ({ ...prev, [uploadKey]: true }));
    
    try {
      const imageKey = await uploadImageToOSS(file);
      setUploadedImages(prev => ({ ...prev, [uploadKey]: imageKey }));
      
      // 根据类型更新相应的参数
      if (type === 'default') {
        updateDefaultParam(nodeId, inputKey, imageKey);
      } else if (type === 'xAxis' && index !== undefined) {
        updateXAxisValues(index, imageKey);
      } else if (type === 'yAxis' && index !== undefined) {
        updateYAxisValues(index, imageKey);
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploadingImages(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  // 获取输入字段的渲染组件
  const renderInputField = (nodeId: string, inputKey: string, value: any, type: string, uploadType: 'default' | 'xAxis' | 'yAxis' = 'default', index?: number) => {
    const handleChange = (newValue: any) => {
      updateDefaultParam(nodeId, inputKey, newValue);
    };

    // 检查是否是图片输入字段
    const isImageInput = inputKey === 'image';

    if (isImageInput) {
      const uploadKey = `${uploadType}-${nodeId}-${inputKey}${index !== undefined ? `-${index}` : ''}`;
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
                  handleImageUpload(nodeId, inputKey, file, uploadType, index);
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
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`输入 ${inputKey}`}
          className="min-h-[60px] text-xs"
        />
      );
    } else if (type === 'number') {
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
          placeholder={`输入 ${inputKey}`}
          step="any"
        />
      );
    } else if (type === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="text-sm">{inputKey}</label>
        </div>
      );
    } else {
      return (
        <Textarea
          value={JSON.stringify(value) || ''}
          onChange={(e) => {
            try {
              handleChange(JSON.parse(e.target.value));
            } catch (error) {
              console.error("Invalid JSON:", error);
            }
          }}
          placeholder={`输入 ${inputKey} (JSON格式)`}
          className="min-h-[60px] text-xs"
        />
      );
    }
  };

  // 验证配置是否有效
  const validateConfig = () => {
    if (!selectedWorkflowId || !xAxisNode || !xAxisInput || !yAxisNode || !yAxisInput) {
      return '请完成所有必要的配置';
    }

    if (!selectedWorkflow?.nodeData) {
      return '工作流数据无效';
    }

    // 验证X轴节点和输入
    if (!selectedWorkflow.nodeData[xAxisNode]) {
      return `X轴节点 ${xAxisNode} 不存在于工作流中`;
    }

    if (!selectedWorkflow.nodeData[xAxisNode].inputs) {
      return `X轴节点 ${xAxisNode} 没有输入字段`;
    }

    if (!(xAxisInput in selectedWorkflow.nodeData[xAxisNode].inputs)) {
      return `X轴节点 ${xAxisNode} 没有输入字段 ${xAxisInput}`;
    }

    // 验证Y轴节点和输入
    if (!selectedWorkflow.nodeData[yAxisNode]) {
      return `Y轴节点 ${yAxisNode} 不存在于工作流中`;
    }

    if (!selectedWorkflow.nodeData[yAxisNode].inputs) {
      return `Y轴节点 ${yAxisNode} 没有输入字段`;
    }

    if (!(yAxisInput in selectedWorkflow.nodeData[yAxisNode].inputs)) {
      return `Y轴节点 ${yAxisNode} 没有输入字段 ${yAxisInput}`;
    }

    // 验证参数值
    const validXValues = xAxisValues.filter(v => v.trim() !== '');
    const validYValues = yAxisValues.filter(v => v.trim() !== '');

    if (validXValues.length === 0) {
      return '请设置至少一个X轴参数值';
    }

    if (validYValues.length === 0) {
      return '请设置至少一个Y轴参数值';
    }

    return null; // 验证通过
  };

  const handleGenerate = () => {
    const validationError = validateConfig();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    const config: XYBatchConfig = {
      workflowId: selectedWorkflowId,
      xAxisNode,
      xAxisInput,
      xAxisValues: xAxisValues.filter(v => v.trim() !== ''),
      yAxisNode,
      yAxisInput,
      yAxisValues: yAxisValues.filter(v => v.trim() !== ''),
      defaultParams
    };
    
    onGenerate(config);
  };

  const getTotalCombinations = () => {
    return xAxisValues.filter(v => v.trim() !== '').length * yAxisValues.filter(v => v.trim() !== '').length;
  };

  const getNodeInputLabel = (nodeId: string, inputKey: string) => {
    const nodeData = selectedWorkflow?.nodeData?.[nodeId];
    const nodeType = nodeData?.class_type || '未知';
    return `${nodeId} (${nodeType}) - ${inputKey}`;
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const availableInputs = getAvailableNodeInputs();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-blue-500" />
            XY 轴批量生成配置
          </CardTitle>
          <CardDescription>
            基于工作流节点结构配置 X 轴和 Y 轴参数，系统将生成所有参数组合的图像网格
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 工作流选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">选择工作流 *</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedWorkflowId}
              onChange={(e) => {
                setSelectedWorkflowId(e.target.value);
                const workflow = workflows.find(w => w.id === e.target.value);
                if (workflow) {
                  setSelectedWorkflow(workflow);
                  initializeDefaultParams(workflow);
                  // 重置轴配置
                  setXAxisNode('');
                  setXAxisInput('');
                  setXAxisValues(['']);
                  setYAxisNode('');
                  setYAxisInput('');
                  setYAxisValues(['']);
                }
              }}
            >
              <option value="">请选择工作流</option>
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </select>
          </div>

          {selectedWorkflow && (
            <>
              {/* X轴配置 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">X 轴参数配置</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">X轴节点和输入</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={`${xAxisNode}-${xAxisInput}`}
                      onChange={(e) => {
                        const [nodeId, inputKey] = e.target.value.split('-');
                        setXAxisNode(nodeId);
                        setXAxisInput(inputKey);
                      }}
                    >
                      <option value="">选择X轴参数</option>
                      {availableInputs.map((input) => (
                        <option key={`${input.nodeId}-${input.inputKey}`} value={`${input.nodeId}-${input.inputKey}`}>
                          {getNodeInputLabel(input.nodeId, input.inputKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">X轴参数值</label>
                    <div className="space-y-2">
                      {xAxisValues.map((value, index) => (
                        <div key={index} className="space-y-2">
                          {xAxisInput === 'image' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={value}
                                onChange={(e) => updateXAxisValues(index, e.target.value)}
                                placeholder={`X轴值 ${index + 1}`}
                                className="flex-1"
                              />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(xAxisNode, xAxisInput, file, 'xAxis', index);
                                  }
                                }}
                                className="hidden"
                                id={`upload-xAxis-${xAxisNode}-${xAxisInput}-${index}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`upload-xAxis-${xAxisNode}-${xAxisInput}-${index}`)?.click()}
                                disabled={uploadingImages[`xAxis-${xAxisNode}-${xAxisInput}-${index}`]}
                              >
                                {uploadingImages[`xAxis-${xAxisNode}-${xAxisInput}-${index}`] ? (
                                  <Upload className="w-4 h-4 animate-spin" />
                                ) : (
                                  <ImageIcon className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeXAxisValue(index)}
                                disabled={xAxisValues.length <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                value={value}
                                onChange={(e) => updateXAxisValues(index, e.target.value)}
                                placeholder={`X轴值 ${index + 1}`}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeXAxisValue(index)}
                                disabled={xAxisValues.length <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {xAxisInput === 'image' && uploadedImages[`xAxis-${xAxisNode}-${xAxisInput}-${index}`] && (
                            <div className="text-xs text-green-600">
                              已上传: {uploadedImages[`xAxis-${xAxisNode}-${xAxisInput}-${index}`]}
                            </div>
                          )}
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={addXAxisValue}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Y轴配置 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Y 轴参数配置</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Y轴节点和输入</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={`${yAxisNode}-${yAxisInput}`}
                      onChange={(e) => {
                        const [nodeId, inputKey] = e.target.value.split('-');
                        setYAxisNode(nodeId);
                        setYAxisInput(inputKey);
                      }}
                    >
                      <option value="">选择Y轴参数</option>
                      {availableInputs.map((input) => (
                        <option key={`${input.nodeId}-${input.inputKey}`} value={`${input.nodeId}-${input.inputKey}`}>
                          {getNodeInputLabel(input.nodeId, input.inputKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Y轴参数值</label>
                    <div className="space-y-2">
                      {yAxisValues.map((value, index) => (
                        <div key={index} className="space-y-2">
                          {yAxisInput === 'image' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={value}
                                onChange={(e) => updateYAxisValues(index, e.target.value)}
                                placeholder={`Y轴值 ${index + 1}`}
                                className="flex-1"
                              />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(yAxisNode, yAxisInput, file, 'yAxis', index);
                                  }
                                }}
                                className="hidden"
                                id={`upload-yAxis-${yAxisNode}-${yAxisInput}-${index}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`upload-yAxis-${yAxisNode}-${yAxisInput}-${index}`)?.click()}
                                disabled={uploadingImages[`yAxis-${yAxisNode}-${yAxisInput}-${index}`]}
                              >
                                {uploadingImages[`yAxis-${yAxisNode}-${yAxisInput}-${index}`] ? (
                                  <Upload className="w-4 h-4 animate-spin" />
                                ) : (
                                  <ImageIcon className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeYAxisValue(index)}
                                disabled={yAxisValues.length <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                value={value}
                                onChange={(e) => updateYAxisValues(index, e.target.value)}
                                placeholder={`Y轴值 ${index + 1}`}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeYAxisValue(index)}
                                disabled={yAxisValues.length <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {yAxisInput === 'image' && uploadedImages[`yAxis-${yAxisNode}-${yAxisInput}-${index}`] && (
                            <div className="text-xs text-green-600">
                              已上传: {uploadedImages[`yAxis-${yAxisNode}-${yAxisInput}-${index}`]}
                            </div>
                          )}
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={addYAxisValue}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 默认参数配置 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">默认参数配置</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    配置其他节点的默认参数值，这些参数将在所有生成中保持不变。
                    <br />
                    <span className="text-blue-600">注意：</span>被选为X轴或Y轴的特定字段不会显示在这里，但同一节点的其他字段仍可配置。
                  </p>
                  
                  <div className="space-y-4">
                    {Object.entries(defaultParams).map(([nodeId, inputs]) => {
                      // 过滤掉被选为X轴或Y轴的特定字段
                      const filteredInputs = Object.entries(inputs).filter(([inputKey, value]) => {
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
                            节点 {nodeId} ({selectedWorkflow.nodeData[nodeId]?.class_type || '未知类型'})
                            {(xAxisNode === nodeId || yAxisNode === nodeId) && (
                              <span className="text-xs text-blue-600 ml-2">
                                {xAxisNode === nodeId && `[X轴: ${xAxisInput}]`}
                                {yAxisNode === nodeId && `[Y轴: ${yAxisInput}]`}
                              </span>
                            )}
                          </h4>
                          {filteredInputs.map(([inputKey, value]) => (
                            <div key={`${nodeId}-${inputKey}`} className="space-y-1">
                              <label className="text-sm font-medium">{inputKey}</label>
                              {renderInputField(nodeId, inputKey, value, typeof value)}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 预览网格 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">生成预览</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-3">
                    将生成 <strong>{getTotalCombinations()}</strong> 张图片
                  </div>
                  
                  {xAxisValues.filter(v => v.trim() !== '').length > 0 && yAxisValues.filter(v => v.trim() !== '').length > 0 && (
                    <div className="grid gap-2" style={{
                      gridTemplateColumns: `repeat(${xAxisValues.filter(v => v.trim() !== '').length}, 1fr)`,
                      gridTemplateRows: `repeat(${yAxisValues.filter(v => v.trim() !== '').length}, 1fr)`
                    }}>
                      {yAxisValues.filter(v => v.trim() !== '').map((yValue, yIndex) =>
                        xAxisValues.filter(v => v.trim() !== '').map((xValue, xIndex) => (
                          <div
                            key={`${xIndex}-${yIndex}`}
                            className="aspect-square bg-background border rounded p-1 text-xs flex flex-col justify-between"
                          >
                            <div className="text-center">
                              <div className="font-mono text-[10px] text-blue-600">
                                X: {xValue}
                              </div>
                              <div className="font-mono text-[10px] text-green-600">
                                Y: {yValue}
                              </div>
                            </div>
                            <div className="text-center text-[8px] text-muted-foreground">
                              ({xIndex + 1}, {yIndex + 1})
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 生成按钮 */}
              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={handleGenerate} 
                  disabled={!selectedWorkflowId || !xAxisNode || !xAxisInput || !yAxisNode || !yAxisInput || isGenerating}
                  className="flex-1"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Settings className="w-4 h-4 mr-2 animate-spin" />
                      生成中... ({getTotalCombinations()} 张图片)
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      开始 XY 轴批量生成 ({getTotalCombinations()} 张图片)
                    </>
                  )}
                </Button>
              </div>

              {getTotalCombinations() > 16 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    ⚠️ 注意：您将生成 {getTotalCombinations()} 张图片，这可能需要较长时间完成。
                    建议先用较少的参数组合进行测试。
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}