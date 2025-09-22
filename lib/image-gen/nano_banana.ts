"use server";

import { z } from "zod";

// 类型定义
interface NanoBananaRequest {
  prompt: string;
  image_urls: string[];
}

interface NanoBananaResponse {
  image_urls: string[];
}

interface NanoBananaError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

// 输入参数验证
const NanoBananaInputSchema = z.object({
  prompt: z.string().min(1).max(1000, "提示词不能超过1000字符"),
  image_urls: z.array(z.string().url()).min(1, "至少需要一张输入图像"),
});

// API 配置
const NANO_BANANA_API_URL = "https://api.ppinfra.com/v3/gemini-2.5-flash-image-preview-image-edit";

/**
 * 生成图像并上传到 OSS
 * @param params 图像生成参数
 * @returns 返回 OSS 上的图像 URL
 */
export async function generateNanoBananaImage(params: {
  prompt: string;
  image_urls: string[];
}): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // 验证输入参数
    const validatedParams = NanoBananaInputSchema.parse(params);

    // 获取 API Key
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY 环境变量未配置");
    }

    // 构建请求体
    const requestBody: NanoBananaRequest = {
      prompt: validatedParams.prompt,
      image_urls: validatedParams.image_urls
    };

    console.log("🚀 开始调用 Gemini Nano Banana API:", {
      prompt: validatedParams.prompt,
      image_count: validatedParams.image_urls.length
    });

    // 调用 Gemini Nano Banana API
    const response = await fetch(NANO_BANANA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorMessage = `API 调用失败 (${response.status})`;
      try {
        const errorData = await response.json();
        console.error("API 错误响应:", errorData);
        
        // 处理不同的错误格式
        if (errorData.error?.message) {
          errorMessage = `API 调用失败: ${errorData.error.message} (${errorData.error.code || response.status})`;
        } else if (errorData.message) {
          errorMessage = `API 调用失败: ${errorData.message}`;
        } else if (errorData.detail) {
          errorMessage = `API 调用失败: ${errorData.detail}`;
        } else if (typeof errorData === 'string') {
          errorMessage = `API 调用失败: ${errorData}`;
        }
      } catch (parseError) {
        const responseText = await response.text();
        errorMessage = `API 调用失败 (${response.status}): ${responseText}`;
      }
      throw new Error(errorMessage);
    }

    const result: NanoBananaResponse = await response.json();
    console.log("✅ Gemini Nano Banana API 调用成功:", {
      generated_images: result.image_urls.length
    });

    // 返回第一个生成的图像URL
    if (result.image_urls && result.image_urls.length > 0) {
      const imageUrl = result.image_urls[0];
      console.log("✅ 图像生成完成:", {
        image_url: imageUrl
      });

      return {
        success: true,
        url: imageUrl
      };
    } else {
      throw new Error("API 响应中未找到生成的图像");
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    console.error("❌ Gemini Nano Banana 生成失败:", errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * 批量生成图像
 * @param prompts 提示词数组
 * @param imageUrls 输入图像URL数组
 * @returns 返回生成结果数组
 */
export async function generateNanoBananaImagesBatch(
  prompts: string[],
  imageUrls: string[]
): Promise<Array<{ prompt: string; success: boolean; url?: string; error?: string }>> {
  const results = [];
  
  for (const prompt of prompts) {
    const result = await generateNanoBananaImage({
      prompt,
      image_urls: imageUrls
    });
    
    results.push({
      prompt,
      ...result
    });
    
    // 添加延迟避免触发限流
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

/**
 * 获取支持的参数配置
 */
export async function getSupportedConfig(): Promise<{
  maxImageUrls: number;
  minImageUrls: number;
  maxPromptLength: number;
}> {
  return {
    maxImageUrls: 10,
    minImageUrls: 1,
    maxPromptLength: 1000
  };
}
