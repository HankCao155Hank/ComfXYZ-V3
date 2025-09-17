#!/usr/bin/env tsx

/**
 * ComfyUI 图像生成测试脚本
 * 
 * 这个脚本用于测试 comfy.ts 中的 generateQwenImage 函数
 * 它会创建一个图像生成任务，然后等待任务完成并获取结果
 */

import { config } from 'dotenv';
import { generateQwenImage } from './lib/comfy';

// 加载 .env 文件
config();

// 测试配置
const TEST_CONFIGS = [
  {
    name: "基础测试 - 可爱小猫",
    params: {
      prompt: "一只可爱的小猫在花园里玩耍，卡通风格，高质量",
      negativePrompt: "低质量，模糊，变形",
      width: 1024,
      height: 1024,
      steps: 20,
      cfg: 2.5
    }
  },
  {
    name: "高级测试 - 餐车包装设计",
    params: {
      prompt: "餐车造型的纸盒包装、复古风格、卡通设计、商业插画",
      negativePrompt: "低质量，模糊，变形，不专业",
      width: 1328,
      height: 1328,
      steps: 30,
      cfg: 3.0,
      seed: 12345
    }
  },
  {
    name: "快速测试 - 简单提示词",
    params: {
      prompt: "一朵美丽的玫瑰花，水彩画风格",
      width: 512,
      height: 512,
      steps: 15
    }
  }
];

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}`)
};

// 检查环境变量
function checkEnvironment(): boolean {
  const apiKey = process.env.INFINI_AI_API_KEY;
  if (!apiKey) {
    log.error("未找到 INFINI_AI_API_KEY 环境变量");
    log.info("请设置环境变量: export INFINI_AI_API_KEY=your_api_key");
    log.info("或者在 .env.local 文件中添加: INFINI_AI_API_KEY=your_api_key");
    return false;
  }
  
  if (apiKey === "sk-ju4kjcjtlgqyzlmf") {
    log.warning("检测到默认 API Key，请确保这是有效的密钥");
  }
  
  log.success("环境变量检查通过");
  return true;
}

// 运行单个测试
async function runTest(testConfig: typeof TEST_CONFIGS[0], index: number): Promise<boolean> {
  log.header(`测试 ${index + 1}: ${testConfig.name}`);
  
  try {
    log.info("开始生成图像...");
    log.info(`提示词: ${testConfig.params.prompt}`);
    log.info(`尺寸: ${testConfig.params.width}x${testConfig.params.height}`);
    log.info(`步数: ${testConfig.params.steps}`);
    
    const startTime = Date.now();
    const blobUrl = await generateQwenImage(testConfig.params);
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    log.success(`图像生成成功！耗时: ${duration}秒`);
    log.success(`Blob URL: ${blobUrl}`);
    
    return true;
  } catch (error) {
    log.error(`测试失败: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// 主函数
async function main() {
  log.header("ComfyUI 图像生成测试脚本");
  log.info("这个脚本将测试 comfy.ts 中的图像生成功能");
  
  // 检查环境
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  // 解析命令行参数
  const args = process.argv.slice(2);
  const testIndex = args[0] ? parseInt(args[0]) - 1 : -1;
  
  if (testIndex >= 0 && testIndex < TEST_CONFIGS.length) {
    // 运行指定测试
    log.info(`运行指定测试: ${TEST_CONFIGS[testIndex].name}`);
    const success = await runTest(TEST_CONFIGS[testIndex], testIndex);
    process.exit(success ? 0 : 1);
  } else {
    // 运行所有测试
    log.info("运行所有测试...");
    let successCount = 0;
    let totalCount = TEST_CONFIGS.length;
    
    for (let i = 0; i < TEST_CONFIGS.length; i++) {
      const success = await runTest(TEST_CONFIGS[i], i);
      if (success) successCount++;
      
      // 在测试之间添加延迟，避免API限制
      if (i < TEST_CONFIGS.length - 1) {
        log.info("等待 5 秒后继续下一个测试...");
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    log.header("测试结果汇总");
    log.info(`总测试数: ${totalCount}`);
    log.info(`成功: ${successCount}`);
    log.info(`失败: ${totalCount - successCount}`);
    
    if (successCount === totalCount) {
      log.success("所有测试都通过了！");
      process.exit(0);
    } else {
      log.error("部分测试失败");
      process.exit(1);
    }
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  log.error(`未处理的 Promise 拒绝: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log.error(`未捕获的异常: ${error.message}`);
  process.exit(1);
});

// 运行主函数
main().catch((error) => {
  log.error(`主函数执行失败: ${error.message}`);
  process.exit(1);
});
