import { z } from "zod";
import { generateQwenImage } from "./qwen_image";
import { generateDoubaoSeedreamImage } from "./doubao_seedream";
import { generateNanoBananaImage } from "./nano_banana";

// 统一的图像生成参数类型
export interface ImageGenerationParams {
  prompt: string;
  negative_prompt?: string;
  size?: string;
  seed?: number;
  model?: "qwen" | "doubao-seedream" | "nano-banana";
  temperature?: number;
  topK?: number;
  topP?: number;
  image_urls?: string[];
}

// 统一的返回结果类型
export interface ImageGenerationResult {
  success: boolean;
  url?: string;
  error?: string;
  model?: string;
}

// 输入参数验证Schema
const ImageGenerationInputSchema = z.object({
  prompt: z.string().min(1).max(800, "提示词不能超过800字符"),
  negative_prompt: z.string().max(500, "反向提示词不能超过500字符").optional(),
  size: z.string().optional(),
  seed: z.number().min(0).max(2147483647).optional(),
  model: z.enum(["qwen", "doubao-seedream", "nano-banana"]).optional().default("doubao-seedream"),
  temperature: z.number().min(0).max(2).optional(),
  topK: z.number().min(1).max(40).optional(),
  topP: z.number().min(0).max(1).optional(),
  image_urls: z.array(z.string().url()).optional(),
});

// 支持的模型配置
type ModelName = "qwen" | "doubao-seedream" | "nano-banana";

interface ModelConfig {
  name: ModelName;
  displayName: string;
  supportedSizes: string[];
  defaultSize: string;
  generator: (params: Record<string, unknown>) => Promise<{ success: boolean; url?: string; error?: string }>;
}

const MODEL_CONFIGS: Record<ModelName, ModelConfig> = {
  "qwen": {
    name: "qwen",
    displayName: "通义千问图像生成",
    supportedSizes: ["1664*928", "1472*1140", "1328*1328", "1140*1472", "928*1664"],
    defaultSize: "1328*1328",
    generator: generateQwenImage as (params: Record<string, unknown>) => Promise<{ success: boolean; url?: string; error?: string }>,
  },
  "doubao-seedream": {
    name: "doubao-seedream",
    displayName: "豆包Seedream图像生成",
    supportedSizes: ["1024x1024", "1024x1792", "1792x1024", "1664x2496"],
    defaultSize: "1024x1024",
    generator: generateDoubaoSeedreamImage as (params: Record<string, unknown>) => Promise<{ success: boolean; url?: string; error?: string }>,
  },
  "nano-banana": {
    name: "nano-banana",
    displayName: "谷歌 Nano Banana",
    supportedSizes: ["auto"], // Nano Banana 自动选择尺寸
    defaultSize: "auto",
    generator: generateNanoBananaImage as (params: Record<string, unknown>) => Promise<{ success: boolean; url?: string; error?: string }>,
  },
};

/**
 * 统一的图像生成API
 * @param params 图像生成参数
 * @returns 返回生成结果
 */
export async function generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  try {
    // 验证输入参数
    const validatedParams = ImageGenerationInputSchema.parse(params);
    
    const modelName = validatedParams.model as ModelName;
    const modelConfig = MODEL_CONFIGS[modelName];
    
    if (!modelConfig) {
      throw new Error(`不支持的模型: ${modelName}`);
    }

    // 验证尺寸参数（Nano Banana 不需要尺寸验证）
    const size = validatedParams.size || modelConfig.defaultSize;
    if (modelName !== "nano-banana" && !modelConfig.supportedSizes.includes(size)) {
      throw new Error(`模型 ${modelName} 不支持的尺寸: ${size}。支持的尺寸: ${modelConfig.supportedSizes.join(", ")}`);
    }

    console.log(`🎨 开始使用 ${modelConfig.displayName} 生成图像:`, {
      prompt: validatedParams.prompt,
      size,
      seed: validatedParams.seed,
      model: modelName
    });

    // 调用对应的生成器
    const generatorParams: Record<string, unknown> = {
      prompt: validatedParams.prompt,
      negative_prompt: validatedParams.negative_prompt,
      size: size,
      seed: validatedParams.seed,
    };

    // 为 Nano Banana 添加特殊参数
    if (modelName === "nano-banana") {
      generatorParams.image_urls = validatedParams.image_urls;
    }
    
    const result = await modelConfig.generator(generatorParams);

    return {
      ...result,
      model: modelName,
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    console.error("❌ 图像生成失败:", errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      model: params.model || "qwen",
    };
  }
}

/**
 * 批量生成图像
 * @param prompts 提示词数组
 * @param options 通用选项
 * @returns 返回生成结果数组
 */
export async function generateImagesBatch(
  prompts: string[],
  options: Omit<ImageGenerationParams, "prompt"> = {}
): Promise<Array<{ prompt: string; success: boolean; url?: string; error?: string; model?: string }>> {
  const results = [];
  
  for (const prompt of prompts) {
    const result = await generateImage({
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
 * 获取所有支持的模型列表
 */
export function getSupportedModels(): Array<{
  value: string;
  label: string;
  supportedSizes: string[];
}> {
  return Object.values(MODEL_CONFIGS).map(config => ({
    value: config.name,
    label: config.displayName,
    supportedSizes: config.supportedSizes
  }));
}

/**
 * 获取指定模型支持的图像尺寸
 */
export function getSupportedImageSizes(model: string): Array<{
  value: string;
  label: string;
  ratio: string;
}> {
  const modelConfig = MODEL_CONFIGS[model as ModelName];
  if (!modelConfig) {
    return [];
  }

  // 根据模型返回对应的尺寸格式
  if (model === "qwen") {
    return [
      { value: "1664*928", label: "1664×928", ratio: "16:9" },
      { value: "1472*1140", label: "1472×1140", ratio: "4:3" },
      { value: "1328*1328", label: "1328×1328", ratio: "1:1" },
      { value: "1140*1472", label: "1140×1472", ratio: "3:4" },
      { value: "928*1664", label: "928×1664", ratio: "9:16" },
    ];
  } else if (model === "doubao-seedream") {
    return [
      { value: "1024x1024", label: "1024×1024", ratio: "1:1" },
      { value: "1024x1792", label: "1024×1792", ratio: "9:16" },
      { value: "1792x1024", label: "1792×1024", ratio: "16:9" },
      { value: "1664x2496", label: "1664×2496", ratio: "2:3" },
    ];
  } else if (model === "nano-banana") {
    return [
      { value: "auto", label: "自动选择", ratio: "智能" },
    ];
  }

  return [];
}

/**
 * 验证模型和尺寸的兼容性
 */
export function validateModelAndSize(model: string, size: string): {
  valid: boolean;
  error?: string;
} {
  const modelConfig = MODEL_CONFIGS[model as ModelName];
  if (!modelConfig) {
    return {
      valid: false,
      error: `不支持的模型: ${model}`
    };
  }

  if (model !== "nano-banana" && !modelConfig.supportedSizes.includes(size)) {
    return {
      valid: false,
      error: `模型 ${model} 不支持的尺寸: ${size}。支持的尺寸: ${modelConfig.supportedSizes.join(", ")}`
    };
  }

  return { valid: true };
}
