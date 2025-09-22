"use server";

import { z } from "zod";
import { getOSSStore } from "@/lib/oss";
import { v4 as uuidv4 } from "uuid";

// 类型定义
interface NanoBananaRequest {
  contents: Array<{
    role: "user";
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

interface NanoBananaResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        inlineData?: {
          data: string;
          mimeType: string;
        };
      }>;
    };
    finishReason: string;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
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
  negative_prompt: z.string().max(500, "反向提示词不能超过500字符").optional(),
  temperature: z.number().min(0).max(2).optional(),
  topK: z.number().min(1).max(40).optional(),
  topP: z.number().min(0).max(1).optional(),
});

// API 配置
const NANO_BANANA_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

/**
 * 生成图像并上传到 OSS
 * @param params 图像生成参数
 * @returns 返回 OSS 上的图像 URL
 */
export async function generateNanoBananaImage(params: {
  prompt: string;
  negative_prompt?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // 验证输入参数
    const validatedParams = NanoBananaInputSchema.parse(params);

    // 获取 API Key
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY 环境变量未配置");
    }

    // 构建完整的提示词（包含negative_prompt）
    let fullPrompt = validatedParams.prompt;
    if (validatedParams.negative_prompt) {
      fullPrompt += `, avoid: ${validatedParams.negative_prompt}`;
    }

    // 构建请求体
    const requestBody: NanoBananaRequest = {
      contents: [
        {
          role: "user",
          parts: [
            { text: fullPrompt }
          ]
        }
      ],
      generationConfig: {
        ...(validatedParams.temperature && { temperature: validatedParams.temperature }),
        ...(validatedParams.topK && { topK: validatedParams.topK }),
        ...(validatedParams.topP && { topP: validatedParams.topP }),
        maxOutputTokens: 8192
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    console.log("🚀 开始调用 Nano Banana API:", {
      prompt: validatedParams.prompt,
      temperature: requestBody.generationConfig?.temperature,
      topK: requestBody.generationConfig?.topK,
      topP: requestBody.generationConfig?.topP
    });

    // 调用 Nano Banana API
    const response = await fetch(`${NANO_BANANA_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData: NanoBananaError = await response.json();
      throw new Error(`API 调用失败: ${errorData.error.message} (${errorData.error.code})`);
    }

    const result: NanoBananaResponse = await response.json();
    console.log("✅ Nano Banana API 调用成功:", {
      finish_reason: result.candidates[0]?.finishReason,
      usage: result.usageMetadata
    });

    // 获取图像数据
    const imagePart = result.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (!imagePart?.inlineData) {
      throw new Error("API 响应中未找到图像数据");
    }

    const { data: imageData, mimeType } = imagePart.inlineData;
    
    // 将 base64 数据转换为 Buffer
    const imageBuffer = Buffer.from(imageData, 'base64');

    console.log("☁️ 开始上传到 OSS");

    // 上传到 OSS
    const ossStore = getOSSStore();
    const fileExtension = mimeType === 'image/png' ? 'png' : 'jpg';
    const ossFileName = `nano-banana-images/${uuidv4()}.${fileExtension}`;
    const ossResult = await ossStore.put(ossFileName, imageBuffer);

    console.log("✅ 图像生成和上传完成:", {
      oss_url: ossResult.url
    });

    return {
      success: true,
      url: ossResult.url
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    console.error("❌ Nano Banana 生成失败:", errorMessage);
    
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
export async function generateNanoBananaImagesBatch(
  prompts: string[],
  options: {
    negative_prompt?: string;
    temperature?: number;
    topK?: number;
    topP?: number;
  } = {}
): Promise<Array<{ prompt: string; success: boolean; url?: string; error?: string }>> {
  const results = [];
  
  for (const prompt of prompts) {
    const result = await generateNanoBananaImage({
      prompt,
      ...options
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
  temperature: { min: number; max: number; default: number };
  topK: { min: number; max: number; default: number };
  topP: { min: number; max: number; default: number };
}> {
  return {
    temperature: { min: 0, max: 2, default: 0.9 },
    topK: { min: 1, max: 40, default: 40 },
    topP: { min: 0, max: 1, default: 0.95 }
  };
}
