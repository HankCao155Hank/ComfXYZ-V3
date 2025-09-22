"use server";

import { z } from "zod";
import { getOSSStore } from "@/lib/oss";
import { v4 as uuidv4 } from "uuid";

// 类型定义
interface DoubaoSeedreamRequest {
  model: "doubao-seedream-4-0-250828";
  prompt: string;
  response_format: "url";
  size: "1024x1024" | "1024x1792" | "1792x1024" | "1664x2496";
  seed?: number;
  watermark?: boolean;
}

interface DoubaoSeedreamResponse {
  data: Array<{
    url: string;
  }>;
}

interface DoubaoSeedreamError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

// 输入参数验证
const DoubaoSeedreamInputSchema = z.object({
  prompt: z.string().min(1).max(800, "提示词不能超过800字符"),
  negative_prompt: z.string().max(500, "反向提示词不能超过500字符").optional(),
  size: z.enum(["1024x1024", "1024x1792", "1792x1024", "1664x2496"]).optional(),
  seed: z.number().min(0).max(2147483647).optional(),
});

// API 配置
const DOUBAO_SEEDREAM_API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

/**
 * 生成图像并上传到 OSS
 * @param params 图像生成参数
 * @returns 返回 OSS 上的图像 URL
 */
export async function generateDoubaoSeedreamImage(params: {
  prompt: string;
  negative_prompt?: string;
  size?: "1024x1024" | "1024x1792" | "1792x1024" | "1664x2496";
  seed?: number;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // 验证输入参数
    const validatedParams = DoubaoSeedreamInputSchema.parse(params);

    // 获取 API Key
    const apiKey = process.env.ARK_API_KEY;
    if (!apiKey) {
      throw new Error("ARK_API_KEY 环境变量未配置");
    }

    // 构建完整的提示词（包含negative_prompt）
    let fullPrompt = validatedParams.prompt;
    if (validatedParams.negative_prompt) {
      fullPrompt += `, negative: ${validatedParams.negative_prompt}`;
    }

    // 构建请求体
    const requestBody: DoubaoSeedreamRequest = {
      model: "doubao-seedream-4-0-250828",
      prompt: fullPrompt,
      response_format: "url",
      size: validatedParams.size || "1024x1024",
      watermark: false,
      ...(validatedParams.seed && { seed: validatedParams.seed }),
    };

    console.log("🚀 开始调用 doubao-seedream API:", {
      prompt: validatedParams.prompt,
      size: requestBody.size,
      seed: requestBody.seed
    });

    // 调用 doubao-seedream API
    const response = await fetch(DOUBAO_SEEDREAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData: DoubaoSeedreamError = await response.json();
      throw new Error(`API 调用失败: ${errorData.error.message} (${errorData.error.code})`);
    }

    const result: DoubaoSeedreamResponse = await response.json();
    console.log("✅ doubao-seedream API 调用成功:", {
      data_count: result.data.length
    });

    // 获取图像 URL
    const imageUrl = result.data?.[0]?.url;
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
    const ossFileName = `doubao-seedream-images/${uuidv4()}.png`;
    const ossResult = await ossStore.put(ossFileName, Buffer.from(imageBuffer));

    console.log("✅ 图像生成和上传完成:", {
      oss_url: ossResult.url
    });

    return {
      success: true,
      url: ossResult.url
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    console.error("❌ doubao-seedream 生成失败:", errorMessage);
    
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
export async function generateDoubaoSeedreamImagesBatch(
  prompts: string[],
  options: {
    negative_prompt?: string;
    size?: "1024x1024" | "1024x1792" | "1792x1024" | "1664x2496";
    seed?: number;
  } = {}
): Promise<Array<{ prompt: string; success: boolean; url?: string; error?: string }>> {
  const results = [];
  
  for (const prompt of prompts) {
    const result = await generateDoubaoSeedreamImage({
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
    { value: "1024x1024", label: "1024×1024", ratio: "1:1" },
    { value: "1024x1792", label: "1024×1792", ratio: "9:16" },
    { value: "1792x1024", label: "1792×1024", ratio: "16:9" },
    { value: "1664x2496", label: "1664×2496", ratio: "2:3" },
  ];
}
