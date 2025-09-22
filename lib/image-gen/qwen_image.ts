"use server";

import { z } from "zod";
import { getOSSStore } from "@/lib/oss";
import { v4 as uuidv4 } from "uuid";

// 类型定义
interface QwenImageRequest {
  model: "qwen-image";
  input: {
    messages: Array<{
      role: "user";
      content: Array<{
        text: string;
      }>;
    }>;
  };
  parameters: {
    negative_prompt?: string;
    size?: "1664*928" | "1472*1140" | "1328*1328" | "1140*1472" | "928*1664";
    n?: number;
    prompt_extend?: boolean;
    watermark?: boolean;
    seed?: number;
  };
}

interface QwenImageResponse {
  output: {
    choices: Array<{
      finish_reason: string;
      message: {
        role: string;
        content: Array<{
          image: string;
        }>;
      };
    }>;
    task_metric: {
      TOTAL: number;
      FAILED: number;
      SUCCEEDED: number;
    };
  };
  usage: {
    width: number;
    height: number;
    image_count: number;
  };
  request_id: string;
}

interface QwenImageError {
  code: string;
  message: string;
  request_id: string;
}

// 输入参数验证
const QwenImageInputSchema = z.object({
  prompt: z.string().min(1).max(800, "提示词不能超过800字符"),
  negative_prompt: z.string().max(500, "反向提示词不能超过500字符").optional(),
  size: z.enum(["1664*928", "1472*1140", "1328*1328", "1140*1472", "928*1664"]).optional(),
  seed: z.number().min(0).max(2147483647).optional(),
});

// API 配置
const QWEN_IMAGE_API_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

/**
 * 生成图像并上传到 OSS
 * @param params 图像生成参数
 * @returns 返回 OSS 上的图像 URL
 */
export async function generateQwenImage(params: {
  prompt: string;
  negative_prompt?: string;
  size?: "1664*928" | "1472*1140" | "1328*1328" | "1140*1472" | "928*1664";
  seed?: number;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // 验证输入参数
    const validatedParams = QwenImageInputSchema.parse(params);

    // 获取 API Key
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new Error("DASHSCOPE_API_KEY 环境变量未配置");
    }

    // 构建请求体
    const requestBody: QwenImageRequest = {
      model: "qwen-image",
      input: {
        messages: [
          {
            role: "user",
            content: [
              {
                text: validatedParams.prompt
              }
            ]
          }
        ]
      },
      parameters: {
        size: validatedParams.size || "1328*1328",
        n: 1,
        prompt_extend: true,
        watermark: false,
        ...(validatedParams.negative_prompt && { negative_prompt: validatedParams.negative_prompt }),
        ...(validatedParams.seed && { seed: validatedParams.seed }),
      }
    };

    console.log("🚀 开始调用 qwen-image API:", {
      prompt: validatedParams.prompt,
      size: requestBody.parameters.size,
      seed: requestBody.parameters.seed
    });

    // 调用 qwen-image API
    const response = await fetch(QWEN_IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData: QwenImageError = await response.json();
      throw new Error(`API 调用失败: ${errorData.message} (${errorData.code})`);
    }

    const result: QwenImageResponse = await response.json();
    console.log("✅ qwen-image API 调用成功:", {
      request_id: result.request_id,
      task_metric: result.output.task_metric
    });

    // 获取图像 URL
    const imageUrl = result.output.choices?.[0]?.message?.content?.[0]?.image;
    if (!imageUrl) {
      throw new Error("API 响应中未找到图像 URL");
    }

    console.log("📥 开始下载图像:", imageUrl);

    // 下载图像
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`图像下载失败: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    console.log("☁️ 开始上传到 OSS");

    // 上传到 OSS
    const ossStore = getOSSStore();
    const ossFileName = `qwen-images/${uuidv4()}.png`;
    const ossResult = await ossStore.put(ossFileName, Buffer.from(imageBuffer));

    console.log("✅ 图像生成和上传完成:", {
      oss_url: ossResult.url,
      original_size: result.usage
    });

    return {
      success: true,
      url: ossResult.url
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    console.error("❌ qwen-image 生成失败:", errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * 批量生成图像
 * @param prompts 提示词数组
 * @param options 通用选项
 * @returns 返回生成结果数组
 */
export async function generateQwenImagesBatch(
  prompts: string[],
  options: {
    negative_prompt?: string;
    size?: "1664*928" | "1472*1140" | "1328*1328" | "1140*1472" | "928*1664";
    seed?: number;
  } = {}
): Promise<Array<{ prompt: string; success: boolean; url?: string; error?: string }>> {
  const results = [];
  
  for (const prompt of prompts) {
    const result = await generateQwenImage({
      prompt,
      ...options
    });
    
    results.push({
      prompt,
      ...result
    });
    
    // 添加延迟避免触发限流
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * 获取支持的图像尺寸列表
 */
export async function getSupportedImageSizes(): Promise<Array<{ value: string; label: string; ratio: string }>> {
  return [
    { value: "1664*928", label: "1664×928", ratio: "16:9" },
    { value: "1472*1140", label: "1472×1140", ratio: "4:3" },
    { value: "1328*1328", label: "1328×1328", ratio: "1:1" },
    { value: "1140*1472", label: "1140×1472", ratio: "3:4" },
    { value: "928*1664", label: "928×1664", ratio: "9:16" },
  ];
}
