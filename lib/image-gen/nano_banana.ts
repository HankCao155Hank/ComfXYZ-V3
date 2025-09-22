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
    console.log("📡 发送API请求:", {
      url: NANO_BANANA_API_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.substring(0, 10)}...` // 只显示前10个字符
      },
      body: requestBody
    });

    const response = await fetch(NANO_BANANA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log("📡 API响应状态:", response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `API 调用失败 (${response.status} ${response.statusText})`;
      let errorDetails = null;
      
      try {
        const errorData = await response.json();
        console.error("🔴 API 错误响应详情:", JSON.stringify(errorData, null, 2));
        errorDetails = errorData;
        
        // 处理不同的错误格式
        if (errorData.error?.message) {
          errorMessage = `API 调用失败: ${errorData.error.message} (${errorData.error.code || response.status})`;
        } else if (errorData.message) {
          errorMessage = `API 调用失败: ${errorData.message}`;
        } else if (errorData.detail) {
          errorMessage = `API 调用失败: ${errorData.detail}`;
        } else if (errorData.task_status) {
          errorMessage = `任务失败: ${errorData.task_status}`;
        } else if (typeof errorData === 'string') {
          errorMessage = `API 调用失败: ${errorData}`;
        } else if (errorData) {
          errorMessage = `API 调用失败: ${JSON.stringify(errorData)}`;
        }
      } catch (parseError) {
        console.error("🔴 JSON解析失败:", parseError);
        const responseText = await response.text();
        console.error("🔴 原始响应文本:", responseText);
        errorMessage = `API 调用失败 (${response.status}): ${responseText}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("📡 API 成功响应:", JSON.stringify(result, null, 2));

    // 检查响应格式
    if (result.image_urls && Array.isArray(result.image_urls) && result.image_urls.length > 0) {
      const imageUrl = result.image_urls[0];
      console.log("✅ 图像生成完成:", {
        image_url: imageUrl,
        total_images: result.image_urls.length
      });

      return {
        success: true,
        url: imageUrl
      };
    } else if (result.result?.image_urls && Array.isArray(result.result.image_urls) && result.result.image_urls.length > 0) {
      // 处理嵌套在result中的响应格式
      const imageUrl = result.result.image_urls[0];
      console.log("✅ 图像生成完成 (嵌套格式):", {
        image_url: imageUrl,
        total_images: result.result.image_urls.length
      });

      return {
        success: true,
        url: imageUrl
      };
    } else if (result.data?.image_urls && Array.isArray(result.data.image_urls) && result.data.image_urls.length > 0) {
      // 处理嵌套在data中的响应格式
      const imageUrl = result.data.image_urls[0];
      console.log("✅ 图像生成完成 (data格式):", {
        image_url: imageUrl,
        total_images: result.data.image_urls.length
      });

      return {
        success: true,
        url: imageUrl
      };
    } else {
      console.error("🔴 API响应格式异常:", result);
      throw new Error(`API 响应格式异常，未找到图像URL。响应: ${JSON.stringify(result)}`);
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
