import { put } from "@vercel/blob";
import { cleanWorkflowImageReferences, validateWorkflowData } from "./workflow-utils";
import { generateImage as generateImageGen, ImageGenerationParams } from "./image-gen";
// 类型定义
interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  steps?: number;
  cfg?: number;
  workflowId?: string; // ComfyStack工作流ID
  image_url?: string; // 美图 API 需要的图片 URL
  mask_url?: string; // 美图 API 需要的蒙版 URL
}

// 美图 API 参数接口
interface MeituAPIParams {
  image_url: string;
  mask_url: string;
  prompt: string;
}

// 美图 API 响应接口
interface MeituAPIResponse {
  code: number;
  message: string;
  data: {
    result_url: string;
  };
}
interface ComfyUIResponse {
  code: number;
  msg: string;
  data: {
    prompt_id: string;
    prompt_token: string;
  };
}
interface TaskStatusResponse {
  code: number;
  msg: string;
  data: {
    comfy_task_info: Array<{
      comfy_task_id: string;
      status: number; // 1-排队中，2-生成中，3-生成成功，4-生成失败，5-权限不足
      queue_size: number;
      current_position: number;
      errMsg: string;
      files: Record<string, string[]>;
      final_files: string[];
      progress_num: number;
    }>;
  };
}
// 解码URL中的编码字符
const decodeImageUrl = (url: string): string => {
  return url.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
};
// 等待函数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
// 下载图片并转换为Buffer
const downloadImage = async (url: string): Promise<Buffer> => {
  const decodedUrl = decodeImageUrl(url);
  const response = await fetch(decodedUrl);
  if (!response.ok) {
    throw new Error(`下载图片失败: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};
// 轮询任务状态
const pollTaskStatus = async (apiKey: string, promptId: string): Promise<string[]> => {
  const maxAttempts = 60; // 最多轮询60次（10分钟）
  const pollInterval = 10000; // 每10秒轮询一次
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch("https://cloud.infini-ai.com/api/maas/comfy_task_api/get_task_info", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          comfy_task_ids: [promptId],
          url_expire_period: 1800 // 30分钟过期
        })
      });
      if (!response.ok) {
        throw new Error(`获取任务状态失败: ${response.statusText}`);
      }
      const data: TaskStatusResponse = await response.json();
      const taskInfo = data.data.comfy_task_info[0];
      if (!taskInfo) {
        throw new Error("未找到任务信息");
      }
      console.log(`任务状态: ${taskInfo.status}, 进度: ${taskInfo.progress_num}%`);
      // 状态说明: 1-排队中，2-生成中，3-生成成功，4-生成失败，5-权限不足
      if (taskInfo.status === 3) {
        // 生成成功
        return taskInfo.final_files;
      } else if (taskInfo.status === 4) {
        // 生成失败
        throw new Error(`图像生成失败: ${taskInfo.errMsg}`);
      } else if (taskInfo.status === 5) {
        // 权限不足
        throw new Error("权限不足，无法生成图像");
      }
      // 继续等待
      await sleep(pollInterval);
    } catch (error) {
      console.error(`轮询第${attempt + 1}次失败:`, error);
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await sleep(pollInterval);
    }
  }
  throw new Error("任务超时，请稍后重试");
};
// 工作流配置接口
interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  // 参数映射函数，将通用参数转换为工作流特定的prompt对象
  buildPrompt: (params: GenerateImageParams) => Record<string, unknown>;
}

// 预定义的工作流配置
const WORKFLOW_CONFIGS: Record<string, WorkflowConfig> = {
  'qwen-image-default': {
    id: 'wf-dbsdzzra6cwtpo33',
    name: 'Qwen图像生成 (默认)',
    description: '使用Qwen模型的标准图像生成工作流',
    buildPrompt: (params) => ({
      "3": {
        inputs: {
          cfg: params.cfg || 2.5,
          denoise: 1,
          sampler_name: "euler",
          scheduler: "simple",
          seed: params.seed || Math.floor(Math.random() * 1000000000000),
          steps: params.steps || 20
        }
      },
      "6": {
        inputs: {
          text: params.prompt
        }
      },
      "7": {
        inputs: {
          text: params.negativePrompt || ""
        }
      },
      "37": {
        inputs: {
          unet_name: "qwen_image_fp8_e4m3fn.safetensors",
          weight_dtype: "default"
        }
      },
      "38": {
        inputs: {
          clip_name: "qwen_2.5_vl_7b_fp8_scaled.safetensors",
          device: "default",
          type: "qwen_image"
        }
      },
      "39": {
        inputs: {
          vae_name: "qwen_image_vae.safetensors"
        }
      },
      "58": {
        inputs: {
          batch_size: 1,
          height: params.height || 1328,
          width: params.width || 1328
        }
      },
      "66": {
        inputs: {
          shift: 3.1000000000000005
        }
      }
    })
  }
  // 可以在这里添加更多工作流配置
};

// 获取工作流配置
export const getWorkflowConfig = (workflowKey: string): WorkflowConfig => {
  const config = WORKFLOW_CONFIGS[workflowKey];
  if (!config) {
    throw new Error(`未找到工作流配置: ${workflowKey}`);
  }
  return config;
};

// 获取所有可用的工作流配置
export const getAvailableWorkflows = (): WorkflowConfig[] => {
  return Object.values(WORKFLOW_CONFIGS);
};


export const generateImage = async (
  workflowId: string,
  promptData: Record<string, unknown>
): Promise<string> => {
  const apiKey = process.env.INFINI_AI_API_KEY;
  if (!apiKey) {
    throw new Error("INFINI_AI_API_KEY 未配置");
  }

  if (!workflowId) {
    throw new Error("工作流ID不能为空");
  }

  if (!promptData || Object.keys(promptData).length === 0) {
    throw new Error("节点数据不能为空");
  }

  // 验证工作流数据
  const validation = validateWorkflowData(promptData);
  if (!validation.isValid) {
    throw new Error(`工作流数据验证失败: ${validation.errors.join(', ')}`);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('工作流验证警告:', validation.warnings.join(', '));
  }
  
  // 清理无效的图像引用
  const cleanedPromptData = cleanWorkflowImageReferences(promptData);

  const API_URL = "https://cloud.infini-ai.com/api/maas/comfy_task_api/prompt";
  // const QUERY_URL = "https://cloud.infini-ai.com/api/maas/comfy_task_api/get_task_info";

    const payload = {
      workflow_id: workflowId,
      prompt: cleanedPromptData
    };

    try {
      // 第一步：提交生成任务
      console.log("正在提交图像生成任务...");
      console.log("请求数据:", JSON.stringify(payload, null, 2));
      const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.statusText}`);
    }

    const data: ComfyUIResponse = await response.json();
    console.log("API响应数据:", JSON.stringify(data, null, 2));
    
    if (!data) {
      throw new Error("API响应为空");
    }
    
    if (data.code !== 0) {
      throw new Error(`API返回错误: ${data.msg || '未知错误'}`);
    }
    
    if (!data.data) {
      throw new Error("API响应中缺少data字段");
    }
    
    if (!data.data.prompt_id) {
      throw new Error("API响应中缺少prompt_id字段");
    }
    
    const promptId = data.data.prompt_id;
    console.log(`任务已提交，任务ID: ${promptId}`);

    // 第二步：轮询任务状态直到完成
    console.log("正在等待图像生成完成...");
    const imageUrls = await pollTaskStatus(apiKey, promptId);
    if (!imageUrls || imageUrls.length === 0) {
      throw new Error("未获取到生成的图像");
    }

    // 第三步：下载第一张图片
    console.log("正在下载生成的图像...");
    const imageBuffer = await downloadImage(imageUrls[0]);

    // 第四步：上传到Vercel Blob
    console.log("正在上传图像到Blob存储...");
    const filename = `generated-image-${Date.now()}.png`;
    const { url } = await put(filename, imageBuffer, {
      access: 'public',
      contentType: 'image/png'
    });

    console.log(`图像已成功生成并上传，Blob URL: ${url}`);
    return url;
  } catch (error) {
    console.error("生成图像失败:", error);
    
    // 检查是否是图像下载失败的错误
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('downloadImageFromOss failed') || errorMessage.includes('NoSuchKey')) {
      throw new Error(`图像生成失败: 输入图像文件不存在或已过期。请重新上传图像或检查工作流配置。原始错误: ${errorMessage}`);
    }
    
    throw error;
  }
};
// 美图 AI 开放平台 API 调用函数
export const callMeituAPI = async (params: MeituAPIParams): Promise<string> => {
  const apiKey = process.env.MEITU_API_KEY;
  if (!apiKey) {
    throw new Error("MEITU_API_KEY 未配置");
  }

  if (!params.image_url || !params.mask_url || !params.prompt) {
    throw new Error("美图 API 需要 image_url、mask_url 和 prompt 参数");
  }

  const API_URL = "https://ai.meitu.com/api/v1/image/inpaint"; // 根据美图 API 文档调整

  try {
    console.log("正在调用美图 AI API...");
    console.log("请求参数:", JSON.stringify(params, null, 2));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`美图 API 请求失败: ${response.statusText}`);
    }

    const data: MeituAPIResponse = await response.json();
    console.log("美图 API 响应:", JSON.stringify(data, null, 2));

    if (data.code !== 0) {
      throw new Error(`美图 API 返回错误: ${data.message || '未知错误'}`);
    }

    if (!data.data || !data.data.result_url) {
      throw new Error("美图 API 响应中缺少 result_url 字段");
    }

    console.log(`美图 API 调用成功，结果 URL: ${data.data.result_url}`);
    return data.data.result_url;
  } catch (error) {
    console.error("美图 API 调用失败:", error);
    throw error;
  }
};

// 无问芯穹 API 调用函数（重命名现有的 generateImage 函数）
export const callWuWenAPI = async (params: GenerateImageParams): Promise<string> => {
  if (!params.workflowId) {
    throw new Error("无问芯穹 API 需要 workflowId 参数");
  }

  // 获取工作流配置
  const workflowConfig = getWorkflowConfig('qwen-image-default');
  const promptData = workflowConfig.buildPrompt(params);

  return await generateImage(params.workflowId, promptData);
};

// 通义千问图像生成 API 调用函数
export const callQwenImageAPI = async (params: ImageGenerationParams): Promise<string> => {
  const result = await generateImageGen({
    ...params,
    model: 'qwen'
  });

  if (!result.success) {
    throw new Error(result.error || '通义千问图像生成失败');
  }

  return result.url!;
};

// 豆包 Seedream API 调用函数
export const callDoubaoSeedreamAPI = async (params: ImageGenerationParams): Promise<string> => {
  const result = await generateImageGen({
    ...params,
    model: 'doubao-seedream'
  });

  if (!result.success) {
    throw new Error(result.error || '豆包 Seedream 图像生成失败');
  }

  return result.url!;
};

export const callNanoBananaAPI = async (params: ImageGenerationParams): Promise<string> => {
  const result = await generateImageGen({
    ...params,
    model: 'nano-banana'
  });

  if (!result.success) {
    throw new Error(result.error || 'Nano Banana 图像生成失败');
  }

  return result.url!;
};

// 统一的 API 调用函数
export const callAPI = async (provider: string, params: MeituAPIParams | GenerateImageParams | ImageGenerationParams): Promise<string> => {
  console.log(`调用 ${provider} API，参数:`, params);

  switch (provider) {
    case 'meitu':
      return await callMeituAPI(params as MeituAPIParams);
    case 'wuwen':
      return await callWuWenAPI(params as GenerateImageParams);
    case 'qwen_image':
      return await callQwenImageAPI(params as ImageGenerationParams);
    case 'doubao_seedream':
      return await callDoubaoSeedreamAPI(params as ImageGenerationParams);
    case 'nano_banana':
      return await callNanoBananaAPI(params as ImageGenerationParams);
    default:
      throw new Error(`不支持的 API 提供商: ${provider}`);
  }
};

/* 
使用示例:
// 基本使用
const blobUrl = await generateQwenImage({
  prompt: "一只可爱的小猫在花园里玩耍，卡通风格，高质量"
});
// 带有更多参数的使用
const blobUrl = await generateQwenImage({
  prompt: "餐车造型的纸盒包装、复古风格、卡通设计",
  negativePrompt: "低质量，模糊，变形",
  width: 1024,
  height: 1024,
  steps: 30,
  cfg: 3.0,
  seed: 12345
});
console.log("生成的图片Blob URL:", blobUrl);
注意事项:
1. 需要在环境变量中设置 INFINI_AI_API_KEY
2. 函数返回的是Vercel Blob的公共访问URL
3. 图片生成可能需要几分钟时间，函数会自动轮询直到完成
4. 支持的分辨率范围建议在512-2048之间
5. 生成失败时会抛出详细的错误信息
*/