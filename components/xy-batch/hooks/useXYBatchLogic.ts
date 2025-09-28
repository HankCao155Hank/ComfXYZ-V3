'use client';

import { useState, useEffect, useCallback } from 'react';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  workflowId: string;
  nodeData: Record<string, unknown>;
}

interface XYBatchConfig {
  workflowId: string;
  xAxisNode: string;
  xAxisInput: string;
  xAxisValues: string[];
  yAxisNode: string;
  yAxisInput: string;
  yAxisValues: string[];
  defaultParams: Record<string, Record<string, unknown>>;
}

export function useXYBatchLogic(initialConfig?: XYBatchConfig | null) {
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
  const [defaultParams, setDefaultParams] = useState<Record<string, Record<string, unknown>>>({});
  
  // 动态图片数量
  const [imageCount, setImageCount] = useState<number>(1);
  
  // 图片上传状态
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});

  const fetchWorkflows = useCallback(async () => {
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
  }, [selectedWorkflowId]);

  // 初始化默认参数
  const initializeDefaultParams = (workflow: Workflow) => {
    const params: Record<string, Record<string, unknown>> = {};
    
    if (workflow.nodeData?.provider === 'nano_banana') {
      // 为Nano Banana工作流初始化参数（简化结构）
      const imageUrls = workflow.nodeData.image_urls as string[] || [];
      setImageCount(Math.max(1, imageUrls.length));
      
      // 创建统一的参数结构
      const nanoBananaParams: Record<string, unknown> = {
        prompt: workflow.nodeData.prompt || ''
      };
      
      // 动态添加图片参数
      for (let i = 1; i <= Math.max(1, imageUrls.length); i++) {
        nanoBananaParams[`image${i}`] = imageUrls[i - 1] || '';
      }
      
      // 将所有参数放在一个节点下
      params['nano_banana'] = nanoBananaParams;
    } else {
      // 原有的逻辑，处理其他工作流
      if (workflow.nodeData) {
        Object.entries(workflow.nodeData).forEach(([nodeId, nodeData]: [string, unknown]) => {
          const nodeDataObj = nodeData as { inputs?: Record<string, unknown> };
          if (nodeDataObj?.inputs) {
            params[nodeId] = { ...nodeDataObj.inputs };
          }
        });
      }
    }
    
    setDefaultParams(params);
  };

  // 获取可用的节点输入选项
  const getAvailableNodeInputs = () => {
    if (!selectedWorkflow?.nodeData) return [];
    
    const inputs: Array<{nodeId: string, inputKey: string, type: string, value: unknown}> = [];
    
    // 如果是Nano Banana工作流，添加专门的参数（简化结构）
    if (selectedWorkflow.nodeData.provider === 'nano_banana') {
      // 添加Nano Banana特有的参数，只包含 prompt 和动态图片
      inputs.push(
        { nodeId: 'prompt', inputKey: 'prompt', type: 'string', value: '' }
      );
      
      // 动态添加图片输入
      for (let i = 1; i <= imageCount; i++) {
        inputs.push({
          nodeId: `image${i}`,
          inputKey: `image${i}`,
          type: 'string',
          value: ''
        });
      }
    } else {
      // 原有的逻辑，处理其他工作流
      Object.entries(selectedWorkflow.nodeData).forEach(([nodeId, nodeData]: [string, unknown]) => {
        const nodeDataObj = nodeData as { inputs?: Record<string, unknown> };
        if (nodeDataObj?.inputs && Object.keys(nodeDataObj.inputs).length > 0) {
          Object.entries(nodeDataObj.inputs).forEach(([inputKey, value]: [string, unknown]) => {
            inputs.push({
              nodeId,
              inputKey,
              type: typeof value,
              value
            });
          });
        }
      });
    }
    
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
  const updateDefaultParam = (nodeId: string, inputKey: string, value: unknown) => {
    setDefaultParams(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [inputKey]: value
      }
    }));
  };

  // 增加图片数量
  const addImageInput = () => {
    const newImageCount = imageCount + 1;
    setImageCount(newImageCount);
    
    // 添加新的图片参数
    setDefaultParams(prev => ({
      ...prev,
      [`image${newImageCount}`]: { [`image${newImageCount}`]: '' }
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
    return result.url || result.key; // 返回URL而不是key
  };

  // 处理图片上传
  const handleImageUpload = async (nodeId: string, inputKey: string, file: File, type: 'default' | 'xAxis' | 'yAxis', index?: number) => {
    const uploadKey = `${type}-${nodeId}-${inputKey}${index !== undefined ? `-${index}` : ''}`;
    
    setUploadingImages(prev => ({ ...prev, [uploadKey]: true }));
    
    try {
      const result = await uploadImageToOSS(file);
      const imageUrl = typeof result === 'string' ? result : (result as { key: string }).key;
      setUploadedImages(prev => ({ ...prev, [uploadKey]: imageUrl }));
      
      // 根据类型更新相应的参数
      if (type === 'default') {
        updateDefaultParam(nodeId, inputKey, imageUrl);
      } else if (type === 'xAxis' && index !== undefined) {
        updateXAxisValues(index, imageUrl);
      } else if (type === 'yAxis' && index !== undefined) {
        updateYAxisValues(index, imageUrl);
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploadingImages(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  // 检查是否是Nano Banana工作流
  const isNanoBananaWorkflow = selectedWorkflow?.nodeData?.provider === 'nano_banana';

  // 验证配置是否有效
  const validateConfig = () => {
    if (!selectedWorkflowId || !xAxisNode || !xAxisInput || !yAxisNode || !yAxisInput) {
      return '请完成所有必要的配置';
    }

    if (!selectedWorkflow?.nodeData) {
      return '工作流数据无效';
    }

    // 如果是Nano Banana工作流，使用特殊的验证逻辑
    if (selectedWorkflow.nodeData.provider === 'nano_banana') {
      // 验证Nano Banana特有的参数
      const validXValues = xAxisValues.filter((v: string) => v.trim() !== '');
      const validYValues = yAxisValues.filter((v: string) => v.trim() !== '');

      if (validXValues.length === 0) {
        return '请设置至少一个X轴参数值';
      }

      if (validYValues.length === 0) {
        return '请设置至少一个Y轴参数值';
      }

      // 验证是否至少提供了一张输入图像
      let hasAnyImage = false;
      
      // 检查默认参数配置中的图片
      for (let i = 1; i <= imageCount; i++) {
        const imageValue = defaultParams[`image${i}`]?.[`image${i}`];
        if (imageValue && typeof imageValue === 'string' && imageValue.trim() !== '') {
          hasAnyImage = true;
          break;
        }
      }
      
      // 如果默认参数中没有图片，检查XY轴参数配置中的图片
      if (!hasAnyImage) {
        // 检查X轴参数中的图片
        if (xAxisInput && xAxisInput.startsWith('image')) {
          const validXValues = xAxisValues.filter((v: string) => v.trim() !== '');
          if (validXValues.length > 0) {
            hasAnyImage = true;
          }
        }
        
        // 检查Y轴参数中的图片
        if (!hasAnyImage && yAxisInput && yAxisInput.startsWith('image')) {
          const validYValues = yAxisValues.filter((v: string) => v.trim() !== '');
          if (validYValues.length > 0) {
            hasAnyImage = true;
          }
        }
      }
      
      if (!hasAnyImage) {
        return '请至少提供一张输入图像';
      }

      return null; // 验证通过
    }

    // 原有的验证逻辑，用于其他工作流
    // 验证X轴节点和输入
    if (!selectedWorkflow.nodeData[xAxisNode]) {
      return `X轴节点 ${xAxisNode} 不存在于工作流中`;
    }

    const xAxisNodeData = selectedWorkflow.nodeData[xAxisNode] as { inputs?: Record<string, unknown> };
    if (!xAxisNodeData.inputs) {
      return `X轴节点 ${xAxisNode} 没有输入字段`;
    }

    if (!(xAxisInput in xAxisNodeData.inputs)) {
      return `X轴节点 ${xAxisNode} 没有输入字段 ${xAxisInput}`;
    }

    // 验证Y轴节点和输入
    if (!selectedWorkflow.nodeData[yAxisNode]) {
      return `Y轴节点 ${yAxisNode} 不存在于工作流中`;
    }

    const yAxisNodeData = selectedWorkflow.nodeData[yAxisNode] as { inputs?: Record<string, unknown> };
    if (!yAxisNodeData.inputs) {
      return `Y轴节点 ${yAxisNode} 没有输入字段`;
    }

    if (!(yAxisInput in yAxisNodeData.inputs)) {
      return `Y轴节点 ${yAxisNode} 没有输入字段 ${yAxisInput}`;
    }

    // 验证参数值
    const validXValues = xAxisValues.filter((v: string) => v.trim() !== '');
    const validYValues = yAxisValues.filter((v: string) => v.trim() !== '');

    if (validXValues.length === 0) {
      return '请设置至少一个X轴参数值';
    }

    if (validYValues.length === 0) {
      return '请设置至少一个Y轴参数值';
    }

    return null; // 验证通过
  };

  const handleGenerate = (onGenerate: (config: XYBatchConfig) => void) => {
    const validationError = validateConfig();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    // 如果是Nano Banana工作流，需要转换参数格式
    let processedDefaultParams = defaultParams;
    
    if (selectedWorkflow?.nodeData?.provider === 'nano_banana') {
      // 构建简化的 Nano Banana 参数
      const imageUrls: string[] = [];
      
      // 从默认参数配置中提取图片URL
      for (let i = 1; i <= imageCount; i++) {
        const imageValue = defaultParams[`image${i}`]?.[`image${i}`];
        if (imageValue && typeof imageValue === 'string' && imageValue.trim() !== '') {
          imageUrls.push(imageValue.trim());
        }
      }
      
      // 从X轴参数配置中提取图片URL
      if (xAxisInput && xAxisInput.startsWith('image')) {
        const validXValues = xAxisValues.filter((v: string) => v.trim() !== '');
        imageUrls.push(...validXValues);
      }
      
      // 从Y轴参数配置中提取图片URL
      if (yAxisInput && yAxisInput.startsWith('image')) {
        const validYValues = yAxisValues.filter((v: string) => v.trim() !== '');
        imageUrls.push(...validYValues);
      }
      
      // 简化的API请求格式，只包含 prompt 和 image_urls
      processedDefaultParams = {
        prompt: { prompt: defaultParams.prompt?.prompt || '' },
        image_urls: { image_urls: imageUrls }
      };
    }
    
    const config: XYBatchConfig = {
      workflowId: selectedWorkflowId,
      xAxisNode,
      xAxisInput,
      xAxisValues: xAxisValues.filter((v: string) => v.trim() !== ''),
      yAxisNode,
      yAxisInput,
      yAxisValues: yAxisValues.filter((v: string) => v.trim() !== ''),
      defaultParams: processedDefaultParams
    };
    
    onGenerate(config);
  };

  const getTotalCombinations = () => {
    return xAxisValues.filter((v: string) => v.trim() !== '').length * yAxisValues.filter((v: string) => v.trim() !== '').length;
  };

  const getNodeInputLabel = (nodeId: string, inputKey: string) => {
    // 如果是Nano Banana工作流，提供简洁的标签
    if (selectedWorkflow?.nodeData?.provider === 'nano_banana') {
      // 直接返回输入字段名，去掉节点前缀
      return inputKey;
    }
    
    // 原有逻辑
    const nodeData = selectedWorkflow?.nodeData?.[nodeId] as { class_type?: string } | undefined;
    const nodeType = nodeData?.class_type || '未知';
    return `${nodeId} (${nodeType}) - ${inputKey}`;
  };

  const handleWorkflowChange = (workflowId: string, workflow: Workflow) => {
    setSelectedWorkflowId(workflowId);
    setSelectedWorkflow(workflow);
    initializeDefaultParams(workflow);
    // 重置轴配置
    setXAxisNode('');
    setXAxisInput('');
    setXAxisValues(['']);
    setYAxisNode('');
    setYAxisInput('');
    setYAxisValues(['']);
    setImageCount(1);
  };

  const handleXAxisNodeInputChange = (nodeId: string, inputKey: string) => {
    setXAxisNode(nodeId);
    setXAxisInput(inputKey);
  };

  const handleYAxisNodeInputChange = (nodeId: string, inputKey: string) => {
    setYAxisNode(nodeId);
    setYAxisInput(inputKey);
  };

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // 应用初始配置
  useEffect(() => {
    if (initialConfig && workflows.length > 0) {
      // 设置工作流
      setSelectedWorkflowId(initialConfig.workflowId);
      
      // 设置X轴配置
      setXAxisNode(initialConfig.xAxisNode);
      setXAxisInput(initialConfig.xAxisInput);
      setXAxisValues(initialConfig.xAxisValues);
      
      // 设置Y轴配置
      setYAxisNode(initialConfig.yAxisNode);
      setYAxisInput(initialConfig.yAxisInput);
      setYAxisValues(initialConfig.yAxisValues);
      
      // 设置默认参数
      setDefaultParams(initialConfig.defaultParams);
    }
  }, [initialConfig, workflows]);

  return {
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
    imageCount,
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
  };
}
