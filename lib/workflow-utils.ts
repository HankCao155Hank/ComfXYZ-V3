// 工作流工具函数

/**
 * 清理工作流数据中的无效图像引用
 * @param promptData 工作流的 prompt 数据
 * @returns 清理后的 prompt 数据
 */
export const cleanWorkflowImageReferences = (promptData: Record<string, unknown>): Record<string, unknown> => {
  const cleanedData = { ...promptData };
  
  // 遍历所有节点
  Object.keys(cleanedData).forEach(nodeId => {
    const nodeData = cleanedData[nodeId] as Record<string, unknown>;
    if (nodeData && typeof nodeData === 'object' && nodeData.inputs) {
      const inputs = nodeData.inputs as Record<string, unknown>;
      
      // 检查常见的图像输入字段
      const imageFields = ['image', 'image_url', 'input_image', 'source_image'];
      
      imageFields.forEach(field => {
        if (inputs[field] && typeof inputs[field] === 'string') {
          const imageUrl = inputs[field] as string;
          
          // 检查是否是无效的 OSS URL 格式
          if (isInvalidOssUrl(imageUrl)) {
            console.warn(`移除无效的图像引用 - 节点 ${nodeId}, 字段 ${field}: ${imageUrl}`);
            // 移除无效的图像引用
            inputs[field] = null;
          }
        }
      });
    }
  });
  
  return cleanedData;
};

/**
 * 检查是否是无效的 OSS URL
 * @param url 要检查的 URL
 * @returns 是否是无效的 OSS URL
 */
const isInvalidOssUrl = (url: string): boolean => {
  // 检查是否包含典型的无效 OSS URL 模式
  const invalidPatterns = [
    /te-[a-z0-9]+\/ac-[a-z0-9]+\/sui-[a-z0-9]+\.webp/, // 错误信息中的模式
    /te-[a-z0-9]+\/ac-[a-z0-9]+\/sui-[a-z0-9]+\.(jpg|jpeg|png|gif)/, // 其他格式
  ];
  
  return invalidPatterns.some(pattern => pattern.test(url));
};

/**
 * 验证工作流数据
 * @param promptData 工作流的 prompt 数据
 * @returns 验证结果
 */
export const validateWorkflowData = (promptData: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!promptData || Object.keys(promptData).length === 0) {
    errors.push('工作流数据为空');
    return { isValid: false, errors, warnings };
  }
  
  // 检查是否有 LoadImage 节点
  const hasLoadImageNode = Object.keys(promptData).some(nodeId => {
    const nodeData = promptData[nodeId] as Record<string, unknown>;
    return nodeData && typeof nodeData === 'object' && 
           nodeData.class_type === 'LoadImage' || 
           nodeData.class_type === 'LoadImageFromUrl';
  });
  
  if (hasLoadImageNode) {
    warnings.push('工作流包含图像输入节点，请确保图像文件存在且可访问');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 获取工作流中的图像引用
 * @param promptData 工作流的 prompt 数据
 * @returns 图像引用列表
 */
export const getWorkflowImageReferences = (promptData: Record<string, unknown>): Array<{
  nodeId: string;
  field: string;
  url: string;
  isValid: boolean;
}> => {
  const imageRefs: Array<{
    nodeId: string;
    field: string;
    url: string;
    isValid: boolean;
  }> = [];
  
  Object.keys(promptData).forEach(nodeId => {
    const nodeData = promptData[nodeId] as Record<string, unknown>;
    if (nodeData && typeof nodeData === 'object' && nodeData.inputs) {
      const inputs = nodeData.inputs as Record<string, unknown>;
      
      const imageFields = ['image', 'image_url', 'input_image', 'source_image'];
      
      imageFields.forEach(field => {
        if (inputs[field] && typeof inputs[field] === 'string') {
          const imageUrl = inputs[field] as string;
          imageRefs.push({
            nodeId,
            field,
            url: imageUrl,
            isValid: !isInvalidOssUrl(imageUrl)
          });
        }
      });
    }
  });
  
  return imageRefs;
};
